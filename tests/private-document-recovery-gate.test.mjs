import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/private-documents/recovery/route.ts", import.meta.url), "utf8");

test("automated recovery excludes digestless rows before applying its batch limit", () => {
  const digestFilter = route.indexOf('.not("sha256_hex", "is", null)');
  const batchLimit = route.indexOf(".limit(MAX_BATCH_SIZE)");
  assert.notEqual(digestFilter, -1);
  assert.notEqual(batchLimit, -1);
  assert.ok(digestFilter < batchLimit);
  assert.match(route, /.eq("scan_status", "pending")/u);
  assert.match(route, /.is("deleted_at", null)/u);
});

test("recovery only submits the stored digest to the one-way scan transition", () => {
  assert.match(route, /p_expected_sha256_hex:s*document.sha256_hex/u);
  assert.match(route, /p_scan_result:s*"error"/u);
  assert.match(route, /p_scan_engine:s*"quarantine-timeout"/u);
  assert.match(route, /p_request_id:s*randomUUID()/u);
  assert.doesNotMatch(route, /manualReviewSkipped/u);
});

test("recovery retains quarantined objects and never serves file contents", () => {
  assert.match(route, /Quarantine objects are retained/u);
  assert.doesNotMatch(route, /storage\.from\(/u);
  assert.doesNotMatch(route, /createSignedUrl/u);
});
