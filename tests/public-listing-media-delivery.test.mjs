import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const source = readFileSync(fileURLToPath(new URL("../src/lib/public-listings.ts", import.meta.url)), "utf8");
const route = readFileSync(fileURLToPath(new URL("../src/app/api/public/listing-media/[mediaId]/route.ts", import.meta.url)), "utf8");
const migration = readFileSync(fileURLToPath(new URL("../supabase/migrations/20261113280000_public_listing_media_projection.sql", import.meta.url)), "utf8");
const detail = readFileSync(fileURLToPath(new URL("../src/app/properties/[reference]/page.tsx", import.meta.url)), "utf8");

test("public catalogue and detail use the same explicit listing projection", () => {
  assert.equal((source.match(/\.select\(publicListingColumns\)/g) ?? []).length, 2);
  assert.equal(source.includes('.select("*")'), false);
  assert.equal((source.match(/\.eq\("status", "published"\)/g) ?? []).length, 2);
});

test("public listing projection excludes ownership, exact-address and evidence fields", () => {
  const projection = source.match(/const publicListingColumns = "([^"]+)";/)?.[1];
  assert.ok(projection, "public projection must be declared");
  for (const forbidden of [
    "owner_user_id", "id", "exact_address", "latitude", "longitude",
    "access_notes", "storage_key", "private_documents", "sha256_hex",
  ]) {
    assert.equal(projection.split(",").includes(forbidden), false, forbidden);
  }
});

test("listing images are obtained only from the narrow public media RPC", () => {
  assert.match(source, /list_public_listing_media/);
  assert.match(source, /p_public_references: references/);
  assert.match(source, /\/api\/public\/listing-media\//);
  assert.match(source, /images,/);
  assert.doesNotMatch(source, /quarantine_storage_key|sha256_hex|createSignedUrl|getPublicUrl/);
});

test("public media delivery re-checks both media decisions and current parent listing status", () => {
  assert.match(route, /moderation_status !== "approved"/);
  assert.match(route, /publication_status !== "published"/);
  assert.match(route, /listing\.status !== "published"/);
  assert.match(route, /from\(BUCKET\)/);
  assert.match(route, /cache-control": "private, no-store, max-age=0"/);
  assert.match(route, /content-type": "image\/webp"/);
  assert.doesNotMatch(route, /createSignedUrl|getPublicUrl|storage\.from\([^)]*\)\.getPublicUrl/);
});

test("public media route catches unexpected dependency failures and returns a generic unavailable response", () => {
  assert.match(route, /async function handlePublicListingMedia/);
  assert.match(route, /export async function GET\([\s\S]*?try\s*\{\s*return await handlePublicListingMedia\(request, context\)/);
  assert.match(route, /catch\s*\{[\s\S]*?return unavailable\(\)/);
  assert.match(route, /Image temporarily unavailable/);
  assert.doesNotMatch(route, /catch\s*\(\s*error\s*\)[\s\S]{0,200}error\.message/);
});

test("public SQL projection returns media UUIDs only for published listings and approved published images", () => {
  assert.match(migration, /returns table\(public_reference text, media_id uuid\)/);
  assert.match(migration, /l\.status = 'published'/);
  assert.match(migration, /lm\.moderation_status = 'approved'/);
  assert.match(migration, /lm\.publication_status = 'published'/);
  assert.match(migration, /position <= 12/);
  assert.doesNotMatch(migration, /quarantine_storage_key|sha256_hex/);
});

test("property detail renders only the image URLs supplied by the public projection", () => {
  assert.match(detail, /listing\.images\.map/);
  assert.match(detail, /property-detail-image/);
});
