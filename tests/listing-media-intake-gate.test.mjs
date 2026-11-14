import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import {
  canonicalizeListingImage,
  MAX_LISTING_IMAGE_INPUT_BYTES,
  safeListingMediaFilename,
} from "../src/lib/listing-media-processing.mjs";

const [packageJson, packageLock, security, roadmap, route, previewRoute, uploadUi, sellerListings, helper, migration, probe, workflow] = await Promise.all([
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  readFile(new URL("../docs/SECURITY_AND_PRIVACY.md", import.meta.url), "utf8"),
  readFile(new URL("../ROADMAP.md", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/listing-media/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/listing-media/[mediaId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/dashboard/listings/listing-media-upload.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/dashboard/listings/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/listing-media-processing.mjs", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261113230000_listing_media_intake_limits.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/tests/listing_media_intake_probe.sql", import.meta.url), "utf8"),
  readFile(new URL("../.github/workflows/database-policy-tests.yml", import.meta.url), "utf8"),
]);

test("sharp is a direct production dependency with a matching root lock entry", () => {
  const manifest = JSON.parse(packageJson);
  const lock = JSON.parse(packageLock);
  assert.equal(manifest.dependencies?.sharp, "0.35.5");
  assert.equal(lock.packages?.[""]?.dependencies?.sharp, "0.35.5");
  assert.equal(lock.packages?.["node_modules/sharp"]?.version, "0.35.5");
});

test("listing image intake is authenticated, same-origin, bounded and quarantined", () => {
  assert.match(route, /sameOrigin\(request\)/);
  assert.match(route, /auth\.getClaims\(\)/);
  assert.match(route, /readBoundedBody\(request, MAX_CONTENT_LENGTH\)/);
  assert.match(route, /consume_listing_media_upload_rate_limit/);
  assert.match(route, /listing-media-quarantine/);
  assert.match(route, /const fileFields = form\.getAll\("file"\)/);
  assert.match(route, /const listingIdFields = form\.getAll\("listingId"\)/);
  assert.match(route, /fileFields\.length !== 1 \|\| listingIdFields\.length !== 1/);
  assert.match(route, /DUPLICATE_OR_MISSING_MULTIPART_FIELD/);
  assert.ok(route.indexOf("fileFields.length !== 1") < route.indexOf("const file = fileFields[0]"),
    "multipart cardinality must be validated before selecting file or listing ID");
  assert.match(route, /from\("listing_media"\)\.insert/);
  assert.match(route, /storage\.from\(BUCKET\)\.upload/);
  assert.match(route, /LISTING_MEDIA_PENDING_LIMIT_REACHED/);
  assert.doesNotMatch(route, /createSignedUrl|\.getPublicUrl/);
  assert.ok(route.indexOf('storage.from(BUCKET).upload') < route.indexOf('from("listing_media").insert'),
    "the quarantine object must exist before a pending row becomes visible to the moderation queue");
  assert.ok(route.includes("if (!uploadAttempt.ok || uploadAttempt.value.error)") &&
    route.includes("bestEffortCleanup(() => admin.storage.from(BUCKET).remove([storageKey]))"),
    "returned and thrown Storage upload failures must attempt quarantine-object cleanup");
  assert.ok(route.includes("if (!insertAttempt.ok || insertAttempt.value.error)") &&
    route.includes("bestEffortCleanup(() => admin.storage.from(BUCKET).remove([storageKey]))"),
    "returned and thrown metadata reservation failures must remove the already-uploaded quarantine object");
  assert.ok(route.includes("async function attempt<T>") && route.includes("return { ok: false }"),
    "thrown Storage and database SDK failures must become handled failure results");
  const uploadAttemptIndex = route.indexOf("const uploadAttempt = await attempt");
  const uploadBufferClearIndex = route.indexOf("canonical.bytes.fill(0)", uploadAttemptIndex);
  assert.ok(uploadAttemptIndex >= 0 && uploadBufferClearIndex > uploadAttemptIndex &&
    uploadBufferClearIndex < route.indexOf("if (!uploadAttempt.ok", uploadAttemptIndex),
    "canonical bytes must be cleared even when the Storage SDK throws");
  assert.ok(route.includes("if (!uploadAttempt.ok || uploadAttempt.value.error)"), "upload failure branch must handle returned and thrown Storage errors");
  assert.ok(route.includes("if (!insertAttempt.ok || insertAttempt.value.error)"), "reservation failure branch must handle returned and thrown database errors");
  assert.ok(route.includes("if (!auditAttempt.ok || auditAttempt.value.error)"), "audit failure branch must handle returned and thrown database errors");
  assert.ok(route.includes("bestEffortCleanup(() => admin.storage.from(BUCKET).remove([storageKey]))"), "failed upload and reservation must attempt object cleanup safely");
  assert.ok(route.includes("bestEffortCleanup(() => admin.from(\"listing_media\").delete().eq(\"id\", mediaId))"), "audit failure must attempt reservation cleanup safely");
  const auditFailureBlock = route.slice(route.indexOf("if (!auditAttempt.ok || auditAttempt.value.error)"));
  const storageCleanupCheck = auditFailureBlock.indexOf("cleanupAttempt.ok && !cleanupAttempt.value.error");
  const metadataDelete = auditFailureBlock.indexOf('from("listing_media").delete()');
  assert.ok(storageCleanupCheck >= 0 && metadataDelete > storageCleanupCheck,
    "audit failure must confirm Storage removal before deleting the traceable metadata row");
  assert.doesNotMatch(auditFailureBlock, /Promise\.all/,
    "Storage removal and metadata deletion must not race each other");
  assert.match(route, /canonical\.bytes\.fill\(0\)/,
    "canonical image buffers must be cleared on handled failure and success paths");
  assert.ok(route.indexOf("canonical.bytes.fill(0)", route.indexOf("storage.from(BUCKET).upload")) <
    route.indexOf("if (!uploadAttempt.ok"), "canonical image bytes must be cleared before upload-failure compensation");
  assert.ok(route.indexOf("canonical.bytes.fill(0)", route.indexOf("storage.from(BUCKET).upload")) <
    route.indexOf("if (!auditAttempt.ok"), "canonical image bytes must be cleared before audit-failure compensation");
  assert.match(route, /canonicalizeListingImage/);
  assert.match(uploadUi, /fetch\("\/api\/listing-media"/);
  assert.match(uploadUi, /credentials: "same-origin"/);
  assert.match(sellerListings, /ListingMediaUpload listingId=\{listing\.id\}/);
  assert.match(sellerListings, /listing\.status === "changes_requested"/);
});

test("image processor accepts raster formats only and emits metadata-free canonical WebP", () => {
  assert.match(helper, /\["jpeg", "png", "webp"\]/);
  assert.match(helper, /metadata\.pages > 1/);
  assert.match(helper, /limitInputPixels: MAX_LISTING_IMAGE_PIXELS/);
  assert.match(helper, /\.rotate\(\)/);
  assert.match(helper, /\.webp\(\{ quality: 82, effort: 4 \}\)/);
  assert.doesNotMatch(helper, /withMetadata\(/);
  assert.match(helper, /MAX_LISTING_IMAGE_DIMENSION = 8192/);
});

test("database enforces per-owner rate limits and serialized pending quotas", () => {
  assert.match(migration, /consume_listing_media_upload_rate_limit/);
  assert.match(migration, /for update/);
  assert.match(migration, /v_pending_count >= 8/);
  assert.match(probe, /LISTING_MEDIA_PENDING_QUOTA_NOT_SERIALIZED/);
  assert.match(probe, /LISTING_MEDIA_PRIVATE_RATE_LIMIT_RPC_GRANTS_INVALID/);
  assert.match(workflow, /listing_media_intake_probe\.sql/);
});

test("public listing media remains disabled until moderation and promotion are complete", () => {
  assert.match(security, /publisher-controlled promotion/i);
  assert.match(security, /public listing pages must continue to return no images/i);
  assert.match(roadmap, /Keep public listing images empty/i);
});


test("reviewer media preview fails closed on unexpected dependency exceptions", () => {
  assert.ok(previewRoute.includes("async function handleListingMediaPreview("));
  assert.ok(previewRoute.includes("export async function GET("));
  assert.ok(previewRoute.includes("return await handleListingMediaPreview(request, context);"));
  assert.ok(previewRoute.includes('return respond(503, "Media preview is temporarily unavailable");'));
  assert.doesNotMatch(previewRoute, /Media preview is temporarily unavailable.{0,100}error\\.message/);
});;


async function jpegFixture(width = 64, height = 32) {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 24, g: 96, b: 160 },
    },
  })
    .jpeg({ quality: 90 })
    .withMetadata({ density: 300 })
    .toBuffer();
}

test("canonicalizes a real metadata-bearing JPEG to bounded metadata-free WebP", async () => {
  const source = await jpegFixture();
  const sourceMetadata = await sharp(source).metadata();
  assert.equal(sourceMetadata.format, "jpeg");
  assert.equal(sourceMetadata.density, 300);

  const result = await canonicalizeListingImage(source);
  assert.equal(result.mimeType, "image/webp");
  assert.ok(Buffer.isBuffer(result.bytes));
  assert.ok(result.bytes.byteLength > 0);
  assert.ok(result.bytes.byteLength <= 8 * 1024 * 1024);
  assert.equal(result.width, 64);
  assert.equal(result.height, 32);

  const outputMetadata = await sharp(result.bytes).metadata();
  assert.equal(outputMetadata.format, "webp");
  assert.equal(outputMetadata.width, 64);
  assert.equal(outputMetadata.height, 32);
  assert.equal(outputMetadata.exif, undefined);
  assert.equal(outputMetadata.iptc, undefined);
  assert.equal(outputMetadata.xmp, undefined);
  assert.equal(outputMetadata.icc, undefined);
  assert.notEqual(outputMetadata.density, 300);
  result.bytes.fill(0);
});

test("rejects unsupported vector formats and corrupt raster payloads", async () => {
  const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"></svg>');
  await assert.rejects(
    canonicalizeListingImage(svg),
    (error) => error instanceof Error && error.message === "LISTING_MEDIA_UNSUPPORTED_IMAGE_FORMAT",
  );

  await assert.rejects(
    canonicalizeListingImage(Buffer.from([0xff, 0xd8, 0xff, 0xd9])),
    (error) => error instanceof Error && error.message === "LISTING_MEDIA_IMAGE_DECODE_FAILED",
  );
});

test("rejects excessive dimensions and oversized input before processing", async () => {
  const oversizedDimensions = await jpegFixture(8193, 1);
  await assert.rejects(
    canonicalizeListingImage(oversizedDimensions),
    (error) => error instanceof Error && error.message === "LISTING_MEDIA_IMAGE_DIMENSIONS_REJECTED",
  );

  await assert.rejects(
    canonicalizeListingImage(Buffer.alloc(MAX_LISTING_IMAGE_INPUT_BYTES + 1)),
    (error) => error instanceof Error && error.message === "LISTING_MEDIA_INVALID_INPUT_SIZE",
  );
});

test("sanitizes client filenames to a bounded basename", () => {
  assert.equal(safeListingMediaFilename("../../private\\evi" + String.fromCharCode(0) + "dence.jpg"), "evidence.jpg");
  assert.equal(safeListingMediaFilename("   "), "property-image");
  assert.equal(safeListingMediaFilename("a".repeat(300)).length, 255);
});
