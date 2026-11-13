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
  assert.match(source, /images:\s*\[\]/);
  assert.match(source, /No public-media table exists yet/);
  assert.doesNotMatch(source, /private_documents|private-evidence|createSignedUrl/);
});
