import { createHash, randomUUID } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "listing-media-quarantine";
const MAX_BYTES = 8 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function respond(status: number, message: string) {
  return new Response(message, {
    status,
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "content-type": "text/plain; charset=utf-8",
      "x-content-type-options": "nosniff",
    },
  });
}

async function handleListingMediaPreview(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
): Promise<Response> {
  const { mediaId } = await params;
  if (!UUID.test(mediaId)) return respond(404, "Not found");

  const userClient = await createClient();
  const { data: claimsData, error: claimsError } = await userClient.auth.getClaims();
  const claims = claimsData?.claims;
  const actorId = claims?.sub;
  const claimRoles = (claims?.app_metadata as { roles?: unknown } | undefined)?.roles;
  if (claimsError || typeof actorId !== "string" || !UUID.test(actorId)) {
    return respond(401, "Authentication required");
  }
  if (!Array.isArray(claimRoles) ||
      (!claimRoles.includes("listing_reviewer") && !claimRoles.includes("administrator"))) {
    return respond(403, "Reviewer access required");
  }

  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sb_secret_")) {
    return respond(503, "Media review is not configured");
  }
  const { url } = getSupabasePublicEnv();
  const admin = createSupabaseClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: roleRows, error: roleError } = await admin
    .from("user_roles")
    .select("role_code")
    .eq("user_id", actorId)
    .is("revoked_at", null)
    .in("role_code", ["listing_reviewer", "administrator"]);
  if (roleError) return respond(503, "Reviewer authorization is unavailable");
  const activeRole = (roleRows ?? []).some((row) => claimRoles.includes(row.role_code));
  if (!activeRole) return respond(403, "Reviewer access required");

  const { data: media, error: mediaError } = await admin
    .from("listing_media")
    .select("id,listing_id,owner_user_id,quarantine_storage_key,moderation_status,detected_mime_type,sha256_hex")
    .eq("id", mediaId)
    .maybeSingle();
  if (mediaError) return respond(503, "Media record is unavailable");
  if (!media || media.owner_user_id === actorId || media.moderation_status !== "pending" ||
      media.detected_mime_type !== "image/webp" ||
      typeof media.quarantine_storage_key !== "string" ||
      typeof media.sha256_hex !== "string" || !/^[a-f0-9]{64}$/.test(media.sha256_hex)) {
    return respond(404, "Pending media not found");
  }

  const { data: object, error: storageError } = await admin.storage
    .from(BUCKET)
    .download(media.quarantine_storage_key);
  if (storageError || !object) return respond(503, "Private image is unavailable");
  // Check the Blob's declared size before materializing it in memory. The
  // post-read byte check below remains the integrity backstop.
  if (object.size < 12 || object.size > MAX_BYTES) {
    return respond(415, "Stored image exceeds preview limits");
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(await object.arrayBuffer());
  } catch {
    return respond(503, "Private image could not be read");
  }
  const validWebp = bytes.byteLength >= 12 &&
    bytes.byteLength <= MAX_BYTES &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";
  if (!validWebp) {
    bytes.fill(0);
    return respond(415, "Stored image failed integrity checks");
  }
  const actualDigest = createHash("sha256").update(bytes).digest("hex");
  if (actualDigest !== media.sha256_hex) {
    bytes.fill(0);
    return respond(415, "Stored image failed integrity checks");
  }

  const { error: auditError } = await admin.from("audit_events").insert({
    actor_user_id: actorId,
    action: "listing_media.previewed",
    resource_type: "listing_media",
    resource_id: mediaId,
    after_summary: { listing_id: media.listing_id, purpose: "moderation_preview" },
    request_id: randomUUID(),
  });
  if (auditError) {
    bytes.fill(0);
    return respond(503, "Media access audit is unavailable");
  }

  const responseBytes = new Uint8Array(bytes);
  bytes.fill(0);
  return new Response(responseBytes, {
    status: 200,
    headers: {
      "content-type": "image/webp",
      "content-length": String(responseBytes.byteLength),
      "content-disposition": 'inline; filename="listing-media-review.webp"',
      "cache-control": "private, no-store, max-age=0",
      "content-security-policy": "default-src 'none'; sandbox",
      "cross-origin-resource-policy": "same-origin",
      "referrer-policy": "no-referrer",
      "vary": "Cookie",
      "x-content-type-options": "nosniff",
    },
  });
}


export async function GET(
  request: Request,
  context: { params: Promise<{ mediaId: string }> },
): Promise<Response> {
  try {
    return await handleListingMediaPreview(request, context);
  } catch {
    return respond(503, "Media preview is temporarily unavailable");
  }
}
