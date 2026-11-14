import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const sourcePath = fileURLToPath(new URL("../src/lib/public-listings.ts", import.meta.url));
const source = readFileSync(sourcePath, "utf8");

test("public catalogue and detail queries use the same explicit public projection", () => {
  assert.equal((source.match(/\.select\(publicListingColumns\)/g) ?? []).length, 2);
  assert.equal(source.includes('.select("*")'), false);
  assert.equal((source.match(/\.eq\("status", "published"\)/g) ?? []).length, 2);
});

test("public listing projection excludes ownership, exact-address and evidence fields", () => {
  const projection = source.match(/const publicListingColumns = "([^"]+)";/)?.[1];
  assert.ok(projection, "public projection must be declared");
  for (const forbidden of [
    "owner_user_id",
    "id",
    "exact_address",
    "latitude",
    "longitude",
    "access_notes",
    "storage_key",
    "private_documents",
    "sha256_hex",
  ]) {
    assert.equal(projection.split(",").includes(forbidden), false, forbidden);
  }
});

test("public listing mapper never treats private evidence as listing imagery", () => {
  assert.match(source, /images,/);
  assert.match(source, /list_public_listing_media/);
  assert.doesNotMatch(source, /quarantine_storage_key|private_documents|private-evidence|createSignedUrl/);
});


test("homepage previews only real published listings from the shared public query", () => {
  const homepagePath = fileURLToPath(new URL("../src/app/page.tsx", import.meta.url));
  const homepage = readFileSync(homepagePath, "utf8");
  assert.ok(homepage.includes("getPublishedListings()"));
  assert.ok(homepage.includes("listings.slice(0, 3)"));
  assert.ok(homepage.includes("listing.reference"));
  assert.ok(homepage.includes("No properties are published yet"));
  assert.ok(homepage.includes("CATALOGUE UNAVAILABLE"));
  assert.equal(homepage.includes("CATALOGUE IN PREPARATION"), false);
  assert.equal(homepage.includes("Listings will appear here after review"), false);
});
