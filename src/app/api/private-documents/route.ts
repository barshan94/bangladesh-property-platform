import { createHash, randomUUID } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { detectPrivateDocumentMimeType } from "@/lib/private-document-inspection.mjs";
import { readBoundedBody } from "@/lib/private-document-body.mjs";
import { sanitizePrivateDocumentFilename } from "@/lib/private-document-filename.mjs";
import type { Database } from "@/types/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Keep multipart requests below Vercel's 4.5 MiB function request-body ceiling.
// Storage itself permits 15 MiB, but this HTTP intake currently accepts at most 4 MiB.
const MAX_FILE_BYTES = 4 * 1024 * 1024;
const MAX_CONTENT_LENGTH = MAX_FILE_BYTES + 128 * 1024;
const BUCKET = "private-evidence";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const respond = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });


export async function POST(request: Request): Promise<Response> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return respond(415, { error: "MULTIPART_FORM_DATA_REQUIRED" });
  }
  const lengthHeader = request.headers.get("content-length");
  if (lengthHeader !== null) {
    const contentLength = Number(lengthHeader);
    if (!Number.isSafeInteger(contentLength) || contentLength < 0) {
      return respond(400, { error: "INVALID_CONTENT_LENGTH" });
    }
    if (contentLength > MAX_CONTENT_LENGTH) return respond(413, { error: "REQUEST_TOO_LARGE" });
  }

  // Cookie-authenticated uploads must originate from the configured site.
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const requestOrigin = request.headers.get("origin");
  if (!configuredSiteUrl || !requestOrigin || requestOrigin === "null") {
    return respond(403, { error: "SAME_ORIGIN_REQUIRED" });
  }
  let expectedOrigin: string;
  let suppliedOrigin: string;
  try {
    expectedOrigin = new URL(configuredSiteUrl).origin;
    suppliedOrigin = new URL(requestOrigin).origin;
  } catch {
    return respond(403, { error: "INVALID_REQUEST_ORIGIN" });
  }
  if (suppliedOrigin !== requestOrigin || suppliedOrigin !== expectedOrigin) {
    return respond(403, { error: "CROSS_ORIGIN_REQUEST_BLOCKED" });
  }

  const userClient = await createClient();
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims();
  const actorId = claimsData?.claims?.sub;
  if (claimsError || typeof actorId !== "string" || !UUID.test(actorId)) {
    return respond(401, { error: "AUTHENTICATION_REQUIRED" });
  }

  const { url } = getSupabasePublicEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sb_secret_")) {
    return respond(503, { error: "PRIVATE_DOCUMENT_INTAKE_NOT_CONFIGURED" });
  }
  const admin = createSupabaseClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Throttle authenticated owners before parsing or buffering multipart bytes.
  const { data: rateRows, error: rateError } = await admin.rpc("consume_private_document_upload_rate_limit", {
    p_owner_user_id: actorId,
    p_limit: 10,
    p_window_seconds: 3600,
  });
  const rateDecision = rateRows?.[0];
  if (rateError || !rateDecision) {
    return respond(503, { error: "DOCUMENT_RATE_LIMIT_UNAVAILABLE" });
  }
  if (!rateDecision.allowed) {
    return new Response(JSON.stringify({ error: "DOCUMENT_UPLOAD_RATE_LIMITED" }), {
      status: 429,
      headers: {
        ...JSON_HEADERS,
        "retry-after": String(rateDecision.retry_after_seconds),
        "x-ratelimit-remaining": "0",
      },
    });
  }

  // Enforce the request-body ceiling while streaming, even when the ingress
  // omits Content-Length. Only the bounded buffer is passed to multipart parsing.
  let boundedBody: Uint8Array | null;
  try {
    boundedBody = await readBoundedBody(request, MAX_CONTENT_LENGTH);
  } catch {
    return respond(400, { error: "REQUEST_BODY_READ_FAILED" });
  }
  if (!boundedBody) return respond(413, { error: "REQUEST_TOO_LARGE" });

  let form: FormData;
  try {
    const bodyBytes = new Uint8Array(boundedBody.byteLength);
    bodyBytes.set(boundedBody);
    const boundedRequest = new Request(request.url, {
      method: "POST",
      headers: request.headers,
      body: bodyBytes,
    });
    form = await boundedRequest.formData();
  } catch {
    return respond(400, { error: "INVALID_MULTIPART_BODY" });
  }
  const allowedFields = new Set(["file", "purpose", "listingId", "serviceRequestId"]);
  for (const [key] of form.entries()) {
    if (!allowedFields.has(key)) return respond(400, { error: "UNKNOWN_FIELD" });
  }

  const file = form.get("file");
  const purpose = form.get("purpose");
  const listingId = form.get("listingId");
  const serviceRequestId = form.get("serviceRequestId");
  if (typeof File === "undefined" || !(file instanceof File) ||
      (purpose !== "listing_evidence" && purpose !== "client_case")) {
    return respond(400, { error: "INVALID_DOCUMENT_INPUT" });
  }
  if (file.size < 1 || file.size > MAX_FILE_BYTES) {
    return respond(413, { error: "INVALID_FILE_SIZE" });
  }

  const listingEvidence = purpose === "listing_evidence";
  const parentId = listingEvidence ? listingId : serviceRequestId;
  if (typeof parentId !== "string" || !UUID.test(parentId) ||
      (listingEvidence && serviceRequestId !== null) ||
      (!listingEvidence && listingId !== null)) {
    return respond(400, { error: "INVALID_DOCUMENT_PARENT" });
  }

  // Confirm ownership using trusted database reads before accepting any bytes.
  if (listingEvidence) {
    const { data: listing, error } = await admin.from("property_listings")
      .select("id, owner_user_id").eq("id", parentId).maybeSingle();
    if (error) return respond(503, { error: "DOCUMENT_PARENT_CHECK_UNAVAILABLE" });
    if (!listing || listing.owner_user_id !== actorId) {
      return respond(404, { error: "DOCUMENT_PARENT_NOT_FOUND" });
    }
  } else {
    const { data: serviceRequest, error } = await admin.from("service_requests")
      .select("id, requester_user_id").eq("id", parentId).maybeSingle();
    if (error) return respond(503, { error: "DOCUMENT_PARENT_CHECK_UNAVAILABLE" });
    if (!serviceRequest || serviceRequest.requester_user_id !== actorId) {
      return respond(404, { error: "DOCUMENT_PARENT_NOT_FOUND" });
    }
  }

  let bytes: Uint8Array;
  try {
    bytes = new Uint8Array(await file.arrayBuffer());
  } catch {
    return respond(400, { error: "FILE_READ_FAILED" });
  }
  const detectedMimeType = detectPrivateDocumentMimeType(bytes);
  if (!detectedMimeType) return respond(415, { error: "UNSUPPORTED_OR_INVALID_FILE_SIGNATURE" });

  const documentId = randomUUID();
  const requestId = randomUUID();
  const storageKey = `quarantine/${actorId}/${documentId}`;
  const sha256Hex = createHash("sha256").update(bytes).digest("hex");
  const originalFilename = sanitizePrivateDocumentFilename(file.name);

  // Reserve the pending slot and insert its metadata in one serialized DB
  // transaction before writing bytes to Storage. This closes the quota race.
  const { error: reservationError } = await admin.rpc("reserve_private_document_slot", {
    p_document_id: documentId,
    p_owner_user_id: actorId,
    p_purpose: purpose,
    p_listing_id: listingEvidence ? parentId : null,
    p_service_request_id: listingEvidence ? null : parentId,
    p_storage_key: storageKey,
    p_original_filename: originalFilename,
    p_detected_mime_type: detectedMimeType,
    p_size_bytes: bytes.byteLength,
    p_sha256_hex: sha256Hex,
  });
  if (reservationError) {
    if (reservationError.message?.includes("PENDING_DOCUMENT_LIMIT_REACHED")) {
      return respond(429, { error: "PENDING_DOCUMENT_LIMIT_REACHED" });
    }
    return respond(503, { error: "DOCUMENT_QUOTA_RESERVATION_FAILED" });
  }

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(storageKey, bytes, {
    contentType: detectedMimeType,
    cacheControl: "0",
    upsert: false,
  });
  if (uploadError) {
    await admin.from("private_documents").delete().eq("id", documentId);
    return respond(503, { error: "PRIVATE_STORAGE_UPLOAD_FAILED" });
  }

  const { error: auditError } = await admin.from("document_access_events").insert({
    document_id: documentId,
    actor_user_id: actorId,
    action: "upload",
    purpose: "authenticated_quarantined_upload",
    request_id: requestId,
  });
  if (auditError) {
    await admin.from("private_documents").delete().eq("id", documentId);
    await admin.storage.from(BUCKET).remove([storageKey]);
    return respond(503, { error: "DOCUMENT_AUDIT_WRITE_FAILED" });
  }

  // No signed URL is returned. Pending documents remain inaccessible until a
  // separately implemented trusted scanner and authorization flow clear them.
  return respond(202, {
    documentId,
    scanStatus: "pending",
    message: "Document received into private quarantine; it is not available for download.",
  });
}
