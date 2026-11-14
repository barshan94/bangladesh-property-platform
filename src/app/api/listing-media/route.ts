import { createHash, randomUUID } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";
import { readBoundedBody } from "@/lib/private-document-body.mjs";
import {
  canonicalizeListingImage,
  MAX_LISTING_IMAGE_INPUT_BYTES,
  MAX_LISTING_IMAGE_OUTPUT_BYTES,
  safeListingMediaFilename,
} from "@/lib/listing-media-processing.mjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CONTENT_LENGTH = MAX_LISTING_IMAGE_INPUT_BYTES + 128 * 1024;
const BUCKET = "listing-media-quarantine";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };
const respond = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });

async function attempt<T>(operation: () => PromiseLike<T>): Promise<{ ok: true; value: T } | { ok: false }> {
  try {
    return { ok: true, value: await operation() };
  } catch {
    return { ok: false };
  }
}

async function bestEffortCleanup(operation: () => PromiseLike<unknown>): Promise<void> {
  try {
    await operation();
  } catch {
    // Preserve the primary failure; reconciliation handles any orphan left behind.
  }
}

function sameOrigin(request: Request): boolean {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const requestOrigin = request.headers.get("origin");
  if (!configuredSiteUrl || !requestOrigin || requestOrigin === "null") return false;
  try {
    const expectedOrigin = new URL(configuredSiteUrl).origin;
    const suppliedOrigin = new URL(requestOrigin).origin;
    return suppliedOrigin === requestOrigin && suppliedOrigin === expectedOrigin;
  } catch {
    return false;
  }
}

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
  if (!sameOrigin(request)) return respond(403, { error: "SAME_ORIGIN_REQUIRED" });

  const userClient = await createClient();
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims();
  const actorId = claimsData?.claims?.sub;
  if (claimsError || typeof actorId !== "string" || !UUID.test(actorId)) {
    return respond(401, { error: "AUTHENTICATION_REQUIRED" });
  }

  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sb_secret_")) {
    return respond(503, { error: "LISTING_MEDIA_INTAKE_NOT_CONFIGURED" });
  }
  const { url } = getSupabasePublicEnv();
  const admin = createSupabaseClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: rateRows, error: rateError } = await admin.rpc("consume_listing_media_upload_rate_limit", {
    p_owner_user_id: actorId,
    p_limit: 10,
    p_window_seconds: 3600,
  });
  const rateDecision = rateRows?.[0];
  if (rateError || !rateDecision) {
    return respond(503, { error: "LISTING_MEDIA_RATE_LIMIT_UNAVAILABLE" });
  }
  if (!rateDecision.allowed) {
    return new Response(JSON.stringify({ error: "LISTING_MEDIA_RATE_LIMITED" }), {
      status: 429,
      headers: {
        ...JSON_HEADERS,
        "retry-after": String(rateDecision.retry_after_seconds),
        "x-ratelimit-remaining": "0",
      },
    });
  }

  const boundedBody = await readBoundedBody(request, MAX_CONTENT_LENGTH);
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

  const allowedFields = new Set(["file", "listingId"]);
  for (const [key] of form.entries()) {
    if (!allowedFields.has(key)) return respond(400, { error: "UNKNOWN_FIELD" });
  }
  const fileFields = form.getAll("file");
  const listingIdFields = form.getAll("listingId");
  if (fileFields.length !== 1 || listingIdFields.length !== 1) {
    return respond(400, { error: "DUPLICATE_OR_MISSING_MULTIPART_FIELD" });
  }
  const file = fileFields[0];
  const listingId = listingIdFields[0];
  if (typeof File === "undefined" || !(file instanceof File) ||
      typeof listingId !== "string" || !UUID.test(listingId)) {
    return respond(400, { error: "INVALID_LISTING_MEDIA_INPUT" });
  }
  if (file.size < 1 || file.size > MAX_LISTING_IMAGE_INPUT_BYTES) {
    return respond(413, { error: "INVALID_FILE_SIZE" });
  }

  const { data: listing, error: listingError } = await admin
    .from("property_listings")
    .select("id,owner_user_id,status")
    .eq("id", listingId)
    .maybeSingle();
  if (listingError) return respond(503, { error: "LISTING_OWNERSHIP_CHECK_UNAVAILABLE" });
  if (!listing || listing.owner_user_id !== actorId) {
    return respond(404, { error: "LISTING_NOT_FOUND" });
  }
  if (listing.status !== "draft" && listing.status !== "changes_requested") {
    return respond(409, { error: "LISTING_NOT_EDITABLE" });
  }

  let input: Buffer;
  try {
    input = Buffer.from(await file.arrayBuffer());
  } catch {
    return respond(400, { error: "IMAGE_READ_FAILED" });
  }

  let canonical: Awaited<ReturnType<typeof canonicalizeListingImage>>;
  try {
    canonical = await canonicalizeListingImage(input);
  } catch (error) {
    const code = error instanceof Error ? error.message : "LISTING_MEDIA_IMAGE_REJECTED";
    const status = code === "LISTING_MEDIA_IMAGE_PROCESSING_FAILED" ? 422 : 415;
    return respond(status, { error: code });
  } finally {
    input.fill(0);
  }

  if (canonical.bytes.byteLength > MAX_LISTING_IMAGE_OUTPUT_BYTES) {
    canonical.bytes.fill(0);
    return respond(413, { error: "CANONICAL_IMAGE_TOO_LARGE" });
  }

  const outputSizeBytes = canonical.bytes.byteLength;
  const mediaId = randomUUID();
  const storageKey = `${actorId}/${listingId}/${mediaId}.webp`;
  const digest = createHash("sha256").update(canonical.bytes).digest("hex");
  // Store the private object before creating its reviewable database row.
  // Otherwise the moderation queue can observe a pending record before its
  // quarantine object exists and reviewers may act on an incomplete upload.
  const uploadAttempt = await attempt(() => admin.storage.from(BUCKET).upload(storageKey, canonical.bytes, {
    contentType: canonical.mimeType,
    cacheControl: "0",
    upsert: false,
  }));
  canonical.bytes.fill(0);
  if (!uploadAttempt.ok || uploadAttempt.value.error) {
    await bestEffortCleanup(() => admin.storage.from(BUCKET).remove([storageKey]));
    return respond(503, { error: "LISTING_MEDIA_QUARANTINE_UPLOAD_FAILED" });
  }

  const insertAttempt = await attempt(() => admin.from("listing_media").insert({
    id: mediaId,
    listing_id: listingId,
    owner_user_id: actorId,
    quarantine_storage_key: storageKey,
    original_filename: safeListingMediaFilename(file.name),
    detected_mime_type: canonical.mimeType,
    size_bytes: outputSizeBytes,
    sha256_hex: digest,
  }));
  if (!insertAttempt.ok || insertAttempt.value.error) {
    await bestEffortCleanup(() => admin.storage.from(BUCKET).remove([storageKey]));
    const insertError = insertAttempt.ok ? insertAttempt.value.error : null;
    if (insertError?.message?.includes("LISTING_MEDIA_PENDING_LIMIT_REACHED")) {
      return respond(429, { error: "LISTING_MEDIA_PENDING_LIMIT_REACHED" });
    }
    if (insertError?.message?.includes("LISTING_NOT_EDITABLE_FOR_MEDIA_UPLOAD")) {
      return respond(409, { error: "LISTING_NOT_EDITABLE" });
    }
    return respond(503, { error: "LISTING_MEDIA_RESERVATION_FAILED" });
  }

  const auditAttempt = await attempt(() => admin.from("audit_events").insert({
    actor_user_id: actorId,
    action: "listing_media.uploaded",
    resource_type: "listing_media",
    resource_id: mediaId,
    after_summary: {
      listing_id: listingId,
      mime_type: canonical.mimeType,
      size_bytes: outputSizeBytes,
      sha256_hex: digest,
      width: canonical.width,
      height: canonical.height,
    },
    request_id: randomUUID(),
  }));
  if (!auditAttempt.ok || auditAttempt.value.error) {
    // Remove the private object first. If Storage cleanup fails or throws,
    // retain its metadata row so the object remains traceable for reconciliation.
    const cleanupAttempt = await attempt(() => admin.storage.from(BUCKET).remove([storageKey]));
    if (cleanupAttempt.ok && !cleanupAttempt.value.error) {
      await bestEffortCleanup(() => admin.from("listing_media").delete().eq("id", mediaId));
    }
    return respond(503, { error: "LISTING_MEDIA_AUDIT_FAILED" });
  }

  return respond(202, {
    mediaId,
    moderationStatus: "pending",
    message: "Image received into private quarantine. It is not publicly visible.",
  });
}
