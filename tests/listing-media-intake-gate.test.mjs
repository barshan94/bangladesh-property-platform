import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [packageJson, packageLock, security, roadmap, route, uploadUi, sellerListings, helper, migration, probe, workflow] = await Promise.all([
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  readFile(new URL("../docs/SECURITY_AND_PRIVACY.md", import.meta.url), "utf8"),
  readFile(new URL("../ROADMAP.md", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/listing-media/route.ts", import.meta.url), "utf8"),
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
  assert.match(route, /if \(uploadError\)[\s\S]*?storage\.from\(BUCKET\)\.remove\(\[storageKey\]\)/,
    "Storage upload failure must attempt quarantine-object cleanup");
  assert.match(route, /if \(insertError\)[\s\S]*?storage\.from\(BUCKET\)\.remove\(\[storageKey\]\)/,
    "metadata reservation failure must remove the already-uploaded quarantine object");
  assert.match(route, /async function attempt<T>\\([\\s\\S]*?catch \\{[\\s\\S]*?return \\{ ok: false \\}/,
    "thrown Storage and database SDK failures must become handled failure results");
  assert.match(route, /const uploadAttempt = await attempt\\([\\s\\S]*?canonical\\.bytes\\.fill\\(0\\)[\\s\\S]*?if \\(!uploadAttempt\\.ok \\|\\| uploadAttempt\\.value\\.error\\)/,
    "canonical bytes must be cleared even when the Storage SDK throws");
  assert.ok(route.includes("if (!uploadAttempt.ok || uploadAttempt.value.error)"), "upload failure branch must handle returned and thrown Storage errors");
  assert.ok(route.includes("if (!insertAttempt.ok || insertAttempt.value.error)"), "reservation failure branch must handle returned and thrown database errors");
  assert.ok(route.includes("if (!auditAttempt.ok || auditAttempt.value.error)"), "audit failure branch must handle returned and thrown database errors");
  assert.ok(route.includes("bestEffortCleanup(() => admin.storage.from(BUCKET).remove([storageKey]))"), "failed upload and reservation must attempt object cleanup safely");
  assert.ok(route.includes("bestEffortCleanup(() => admin.from(\"listing_media\").delete().eq(\"id\", mediaId))"), "audit failure must attempt reservation cleanup safely");
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
