import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [packageJson, packageLock, security, roadmap, route, helper, migration, probe, workflow] = await Promise.all([
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  readFile(new URL("../docs/SECURITY_AND_PRIVACY.md", import.meta.url), "utf8"),
  readFile(new URL("../ROADMAP.md", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/listing-media/route.ts", import.meta.url), "utf8"),
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
  assert.match(route, /from\("listing_media"\)\.insert/);
  assert.match(route, /storage\.from\(BUCKET\)\.upload/);
  assert.match(route, /LISTING_MEDIA_PENDING_LIMIT_REACHED/);
  assert.doesNotMatch(route, /createSignedUrl|\.getPublicUrl/);
  assert.match(route, /canonicalizeListingImage/);
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
