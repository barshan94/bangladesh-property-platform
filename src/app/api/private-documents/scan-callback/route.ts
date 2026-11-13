import { createHmac, timingSafeEqual } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};
const MAX_BODY_BYTES = 16 * 1024;
const MAX_CLOCK_SKEW_SECONDS = 5 * 60;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[a-f0-9]{64}$/;
const ENGINE = /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,79}$/;

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

async function readBoundedBody(request: Request): Promise<Buffer | null> {
  if (!request.body) return Buffer.alloc(0);
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_BODY_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)), total);
  } catch {
    return null;
  } finally {
    reader.releaseLock();
  }
}

function validSignature(secret: string, timestamp: string, rawBody: Buffer, supplied: string) {
  if (!/^[a-f0-9]{64}$/i.test(supplied)) return false;
  const expected = createHmac("sha256", secret).update(timestamp).update(".").update(rawBody).digest();
  const actual = Buffer.from(supplied, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function POST(request: Request): Promise<Response> {
  const contentType = request.headers.get("content-type")?.split(";")[0].trim().toLowerCase();
  if (contentType !== "application/json") return respond(415, { error: "APPLICATION_JSON_REQUIRED" });

  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader !== null) {
    const length = Number(lengthHeader);
    if (!Number.isSafeInteger(length) || length < 1) return respond(400, { error: "INVALID_CONTENT_LENGTH" });
    if (length > MAX_BODY_BYTES) return respond(413, { error: "REQUEST_TOO_LARGE" });
  }

  const secret = process.env.DOCUMENT_SCANNER_WEBHOOK_SECRET;
  if (!secret || secret.length < 32) return respond(503, { error: "SCANNER_CALLBACK_NOT_CONFIGURED" });

  const timestamp = request.headers.get("x-scanner-timestamp") ?? "";
  const signature = request.headers.get("x-scanner-signature") ?? "";
  if (!/^\d{10}$/.test(timestamp)) return respond(401, { error: "INVALID_SCANNER_AUTHENTICATION" });
  const timestampSeconds = Number(timestamp);
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > MAX_CLOCK_SKEW_SECONDS) {
    return respond(401, { error: "SCANNER_SIGNATURE_EXPIRED" });
  }

  const rawBody = await readBoundedBody(request);
  if (!rawBody) return respond(413, { error: "REQUEST_TOO_LARGE" });
  if (!validSignature(secret, timestamp, rawBody, signature)) {
    return respond(401, { error: "INVALID_SCANNER_AUTHENTICATION" });
  }

  let payload: unknown;
  try {
    const decodedBody = new TextDecoder("utf-8", { fatal: true }).decode(rawBody);
    payload = JSON.parse(decodedBody);
  } catch {
    return respond(400, { error: "INVALID_CALLBACK_JSON" });
  }
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return respond(400, { error: "INVALID_CALLBACK_PAYLOAD" });
  }
  const data = payload as Record<string, unknown>;
  const { documentId, sha256, result, engine, requestId } = data;
  if (typeof documentId !== "string" || !UUID.test(documentId) ||
      typeof sha256 !== "string" || !SHA256.test(sha256) ||
      (result !== "clean" && result !== "infected" && result !== "error") ||
      typeof engine !== "string" || !ENGINE.test(engine) ||
      typeof requestId !== "string" || !UUID.test(requestId) ||
      Object.keys(data).some((key) => !["documentId", "sha256", "result", "engine", "requestId"].includes(key))) {
    return respond(400, { error: "INVALID_SCAN_RESULT" });
  }

  const { url } = getSupabasePublicEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sb_secret_")) {
    return respond(503, { error: "PRIVATE_DOCUMENT_SCAN_NOT_CONFIGURED" });
  }
  const admin = createSupabaseClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { error } = await admin.rpc("complete_private_document_scan", {
    p_document_id: documentId,
    p_expected_sha256_hex: sha256,
    p_scan_result: result,
    p_scan_engine: engine,
    p_request_id: requestId,
  });
  if (error) {
    if (error.message?.includes("PRIVATE_DOCUMENT_SCAN_TARGET_MISMATCH_OR_ALREADY_SCANNED")) {
      return respond(409, { error: "SCAN_TARGET_MISMATCH_OR_ALREADY_PROCESSED" });
    }
    return respond(503, { error: "SCAN_RESULT_PERSISTENCE_FAILED" });
  }

  return respond(200, { accepted: true, documentId, scanStatus: result });
}
