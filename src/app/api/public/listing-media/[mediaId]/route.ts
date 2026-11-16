import { createHash } from "node:crypto";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BUCKET = "listing-media-quarantine";
const MAX_BYTES = 8 * 1024 * 1024;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "private, no-store, max-age=0",
      "content-security-policy": "default-src 'none'; sandbox",
      "cross-origin-resource-policy": "same-site",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    },
  });
}

function unavailable(): Response {
  return new Response("Image temporarily unavailable", {
    status: 503,
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "private, no-store, max-age=0",
      "retry-after": "30",
      "x-content-type-options": "nosniff",
    },
  });
}

async function handlePublicListingMedia(
  _request: Request,
  { params }: { params: Promise<{ mediaId: string }> },
): Promise<Response> {
  const { mediaId } = await params;
  if (!UUID.test(mediaId)) return notFound();

  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sb_secret_")) return unavailable();

  let admin;
  try {
    const { url } = getSupabasePublicEnv();
    admin = createSupabaseClient(url, secretKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  } catch {
    return unavailable();
  }

  // Every request re-checks both independent decisions and the parent listing.
  // Do not trust the UUID merely because it was once returned by the public projection.
  const { data: media, error: mediaError } = await admin
    .from("listing_media")
    .select("id,listing_id,quarantine_storage_key,size_bytes,sha256_hex,moderation_status,publication_status")
    .eq("id", mediaId)
    .maybeSingle();
  if (mediaError) return unavailable();
  if (!media || media.moderation_status !== "approved" ||
      media.publication_status !== "published" ||
      typeof media.quarantine_storage_key !== "string" ||
      typeof media.sha256_hex !== "string" || !/^[a-f0-9]{64}$/.test(media.sha256_hex) ||
      !Number.isSafeInteger(media.size_bytes) || media.size_bytes < 12 || media.size_bytes > MAX_BYTES) {
    return notFound();
  }

  const { data: listing, error: listingError } = await admin
    .from("property_listings")
    .select("id,status")
    .eq("id", media.listing_id)
    .maybeSingle();
  if (listingError) return unavailable();
  if (!listing || listing.status !== "published") return notFound();

  const { data: object, error: storageError } = await admin.storage
    .from(BUCKET)
    .download(media.quarantine_storage_key);
  if (storageError || !object) return unavailable();
  if (object.size !== media.size_bytes || object.size < 12 || object.size > MAX_BYTES) {
    return notFound();
  }

  let bytes: Buffer;
  try {
    bytes = Buffer.from(await object.arrayBuffer());
  } catch {
    return unavailable();
  }

  const validWebp = bytes.byteLength === media.size_bytes &&
    bytes.byteLength >= 12 && bytes.byteLength <= MAX_BYTES &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP";
  if (!validWebp) {
    bytes.fill(0);
    return notFound();
  }

  const digest = createHash("sha256").update(bytes).digest("hex");
  if (digest !== media.sha256_hex) {
    bytes.fill(0);
    return notFound();
  }

  const responseBytes = new Uint8Array(bytes);
  bytes.fill(0);
  return new Response(responseBytes, {
    status: 200,
    headers: {
      "content-type": "image/webp",
      "content-length": String(responseBytes.byteLength),
      "content-disposition": 'inline; filename="property-image.webp"',
      "cache-control": "private, no-store, max-age=0",
      "content-security-policy": "default-src 'none'; sandbox",
      "cross-origin-resource-policy": "same-site",
      "referrer-policy": "no-referrer",
      "x-content-type-options": "nosniff",
    },
  });
}


export async function GET(
  request: Request,
  context: { params: Promise<{ mediaId: string }> },
): Promise<Response> {
  try {
    return await handlePublicListingMedia(request, context);
  } catch {
    // A thrown database, Storage, or runtime failure must never leak details
    // or escape as an unhandled route error. Public media remains fail-closed.
    return unavailable();
  }
}
