import { randomUUID, timingSafeEqual } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import type { Database } from "@/types/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STALE_AFTER_HOURS = 24;
const MAX_BATCH_SIZE = 50;
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

export async function POST(request: Request): Promise<Response> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || cronSecret.length < 32) {
    return respond(503, { error: "DOCUMENT_RECOVERY_NOT_CONFIGURED" });
  }

  const authorization = request.headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7) : "";
  const expectedBytes = Buffer.from(cronSecret);
  const suppliedBytes = Buffer.from(supplied);
  if (expectedBytes.length !== suppliedBytes.length ||
      !timingSafeEqual(expectedBytes, suppliedBytes)) {
    return respond(401, { error: "UNAUTHORIZED" });
  }

  const { url } = getSupabasePublicEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sb_secret_")) {
    return respond(503, { error: "DOCUMENT_RECOVERY_NOT_CONFIGURED" });
  }

  const admin = createSupabaseClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const cutoff = new Date(Date.now() - STALE_AFTER_HOURS * 60 * 60 * 1000).toISOString();
  const { data: staleDocuments, error: queryError } = await admin
    .from("private_documents")
    .select("id, sha256_hex, uploaded_at")
    .eq("scan_status", "pending")
    .is("deleted_at", null)
    .lt("uploaded_at", cutoff)
    .order("uploaded_at", { ascending: true })
    .limit(MAX_BATCH_SIZE);

  if (queryError || !staleDocuments) {
    return respond(503, { error: "DOCUMENT_RECOVERY_QUERY_FAILED" });
  }

  let recovered = 0;
  let failed = 0;
  let manualReviewSkipped = 0;

  for (const document of staleDocuments) {
    if (!document.sha256_hex) {
      manualReviewSkipped += 1;
      continue;
    }

    const { error } = await admin.rpc("complete_private_document_scan", {
      p_document_id: document.id,
      p_expected_sha256_hex: document.sha256_hex,
      p_scan_result: "error",
      p_scan_engine: "quarantine-timeout",
      p_request_id: randomUUID(),
    });

    if (error) {
      failed += 1;
    } else {
      recovered += 1;
    }
  }

  return respond(200, {
    inspected: staleDocuments.length,
    recovered,
    failed,
    manualReviewSkipped,
    staleAfterHours: STALE_AFTER_HOURS,
    moreMayRemain: staleDocuments.length === MAX_BATCH_SIZE,
    note: "Timed-out records are marked error and audited. Quarantine objects are retained; no files are deleted or made downloadable.",
  });
}
