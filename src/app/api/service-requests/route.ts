import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { validateServiceRequest } from "@/lib/service-request-validation.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const CONSENT_VERSION = "service-request-v1";
const MAX_BODY_BYTES = 8_192;

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status, headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const session = await createSessionClient();
  const { data: authData, error: authError } = await session.auth.getClaims();
  const claims = authData?.claims;
  const userId = claims?.sub;
  const email = typeof claims?.email === "string" ? claims.email.trim().toLowerCase() : "";
  if (authError || typeof userId !== "string" || !userId || !email) {
    return json(401, { error: "AUTHENTICATION_REQUIRED" });
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) return json(503, { error: "SERVICE_REQUESTS_UNAVAILABLE" });

  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return json(413, { error: "REQUEST_TOO_LARGE" });
  }

  let raw: unknown;
  try {
    const body = await request.text();
    if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) return json(413, { error: "REQUEST_TOO_LARGE" });
    raw = JSON.parse(body);
  } catch {
    return json(400, { error: "INVALID_JSON" });
  }

  const validation = validateServiceRequest(raw);
  if (!validation.success) return json(422, { error: "INVALID_SERVICE_REQUEST", fields: validation.errors });

  const admin = createSupabaseClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.rpc("create_service_request", {
    p_requester_user_id: userId,
    p_service_code: validation.data.serviceCode,
    p_contact_name: validation.data.name,
    p_email_normalized: email,
    p_phone: validation.data.phone ?? null,
    p_country: validation.data.country ?? null,
    p_property_district: validation.data.propertyDistrict ?? null,
    p_property_listing_id: null,
    p_summary: validation.data.summary,
    p_consent_version: CONSENT_VERSION,
    p_request_id: randomUUID(),
  });

  if (error) {
    if (error.message.includes("SERVICE_REQUEST_RATE_LIMITED")) {
      return json(429, { error: "SERVICE_REQUEST_RATE_LIMITED" });
    }
    if (error.message.includes("INVALID_PROPERTY_REFERENCE")) {
      return json(422, { error: "INVALID_PROPERTY_REFERENCE" });
    }
    return json(503, { error: "SERVICE_REQUEST_SUBMISSION_FAILED" });
  }
  if (typeof data !== "string") return json(503, { error: "SERVICE_REQUEST_SUBMISSION_FAILED" });
  return json(201, { ok: true, reference: data });
}
