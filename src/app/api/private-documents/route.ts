import { createHash, randomUUID } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { detectPrivateDocumentMimeType } from "@/lib/private-document-inspection.mjs";
import type { Database } from "@/types/database.types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MAX_CONTENT_LENGTH = MAX_FILE_BYTES + 128 * 1024;
const BUCKET = "private-evidence";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const respond = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

function safeFilename(value: string): string {
  const basename = value.split(/[\\/]/).pop() ?? "";
  const cleaned = basename.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, 255);
  return cleaned || "evidence";
}

export async function POST(request: Request): Promise<Response> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("multipart/form-data")) {
    return respond(415, { error: "MULTIPART_FORM_DATA_REQUIRED" });
  }
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_CONTENT_LENGTH) {
    return respond(413, { error: "REQUEST_TOO_LARGE" });
  }

  const userClient = await createClient();
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims();
  const actorId = claimsData?.claims?.sub;
  if (claimsError || typeof actorId !== "string" || !UUID.test(actorId)) {
    return respond(401, { error: "AUTHENTICATION_REQUIRED" });
  }

  let form: FormData;
  try {
    form = await request.formData();
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

  const { url, publishableKey } = getSupabasePublicEnv();
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sb_secret_")) {
    return respond(503, { error: "PRIVATE_DOCUMENT_INTAKE_NOT_CONFIGURED" });
  }
  const admin = createSupabaseClient<Database>(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

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

  // Bound concurrent pending evidence per account to reduce storage abuse.
  const { count, error: countError } = await admin.from("private_documents")
    .select("id", { count: "exact", head: true })
    .eq("owner_user_id", actorId).eq("scan_status", "pending").is("deleted_at", null);
  if (countError) return respond(503, { error: "DOCUMENT_QUOTA_CHECK_UNAVAILABLE" });
  if ((count ?? 0) >= 5) return respond(429, { error: "PENDING_DOCUMENT_LIMIT_REACHED" });

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
  const originalFilename = safeFilename(file.name);

  const { error: uploadError } = await admin.storage.from(BUCKET).upload(storageKey, bytes, {
    contentType: detectedMimeType,
    cacheControl: "0",
    upsert: false,
  });
  if (uploadError) return respond(503, { error: "PRIVATE_STORAGE_UPLOAD_FAILED" });

  const { error: metadataError } = await admin.from("private_documents").insert({
    id: documentId,
    owner_user_id: actorId,
    purpose,
    listing_id: listingEvidence ? parentId : null,
    service_request_id: listingEvidence ? null : parentId,
    storage_key: storageKey,
    original_filename: originalFilename,
    detected_mime_type: detectedMimeType,
    size_bytes: bytes.byteLength,
    sha256_hex: sha256Hex,
    scan_status: "pending",
    review_status: "pending",
  });
  if (metadataError) {
    await admin.storage.from(BUCKET).remove([storageKey]);
    return respond(503, { error: "DOCUMENT_METADATA_WRITE_FAILED" });
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
