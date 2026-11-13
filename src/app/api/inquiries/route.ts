import { createHmac, randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { validateInquiry } from "@/lib/inquiry-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const NOTICE_VERSION = "inquiry-v1";
const MAX_BODY_BYTES = 8_192;

function json(status: number, body: Record<string, unknown>, extraHeaders: Record<string,string> = {}) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store", ...extraHeaders } });
}

export async function POST(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  const rateSecret = process.env.INQUIRY_RATE_LIMIT_SECRET;
  if (!url || !secretKey || !rateSecret || rateSecret.length < 32) {
    return json(503, { error: "INQUIRY_SERVICE_UNAVAILABLE" });
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > MAX_BODY_BYTES) return json(413, { error: "REQUEST_TOO_LARGE" });

  let raw: unknown;
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) return json(413, { error: "REQUEST_TOO_LARGE" });
    raw = JSON.parse(text);
  } catch {
    return json(400, { error: "INVALID_JSON" });
  }

  const validation = validateInquiry(raw);
  if (!validation.success) return json(422, { error: "INVALID_INQUIRY", fields: validation.errors });

  // Trust only headers set by the hosting proxy. Never fall back to x-forwarded-for:
  // clients can supply that header and rotate values to evade per-IP limits.
  const ip = request.headers.get("x-real-ip") ??
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim();
  if (!ip || ip.length > 128) return json(503, { error: "RATE_LIMIT_IDENTITY_UNAVAILABLE" });

  const keyHash = createHmac("sha256", rateSecret).update(ip).digest("hex");
  const supabase = createClient(url, secretKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const limit = await supabase.rpc("consume_inquiry_rate_limit", {
    p_key_hash: keyHash, p_limit: 5, p_window_seconds: 900,
  });
  if (limit.error || !limit.data?.[0]) return json(503, { error: "INQUIRY_SERVICE_UNAVAILABLE" });
  const decision = limit.data[0] as { allowed: boolean; remaining: number; retry_after_seconds: number };
  if (!decision.allowed) {
    return json(429, { error: "RATE_LIMITED" }, {
      "retry-after": String(decision.retry_after_seconds),
      "x-ratelimit-remaining": "0",
    });
  }

  const { data, error } = await supabase.rpc("create_public_inquiry", {
    p_contact_name: validation.data.name,
    p_email_normalized: validation.data.email,
    p_phone: validation.data.phone ?? null,
    p_message: validation.data.message,
    p_consent_version: NOTICE_VERSION,
    p_request_id: randomUUID(),
    p_service_code: validation.data.serviceCode,
    p_country: validation.data.country ?? null,
    p_property_district: validation.data.propertyDistrict ?? null,
  });
  if (error || typeof data !== "string") return json(503, { error: "INQUIRY_SUBMISSION_FAILED" });

  return json(201, { ok: true, reference: data }, {
    "x-ratelimit-remaining": String(decision.remaining),
  });
}
