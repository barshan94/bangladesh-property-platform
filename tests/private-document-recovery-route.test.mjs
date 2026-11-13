import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(
  new URL("../src/app/api/private-documents/recovery/route.ts", import.meta.url),
  "utf8",
);

test("quarantine recovery is a server-only, cron-authenticated operation", () => {
  assert.match(route, /process\.env\.CRON_SECRET/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /authorization\.startsWith\("Bearer "\)/);
  assert.match(route, /process\.env\.SUPABASE_SECRET_KEY/);
  assert.match(route, /secretKey\.startsWith\("sb_secret_"/);
});

test("recovery only selects stale pending, non-deleted documents in bounded batches", () => {
  assert.match(route, /STALE_AFTER_HOURS = 24/);
  assert.match(route, /MAX_BATCH_SIZE = 50/);
  assert.match(route, /\.eq\("scan_status", "pending"\)/);
  assert.match(route, /\.is\("deleted_at", null\)/);
  assert.match(route, /\.lt\("uploaded_at", cutoff\)/);
  assert.match(route, /\.limit\(MAX_BATCH_SIZE\)/);
});

test("recovery reuses the digest-bound audited transition and never deletes or serves objects", () => {
  assert.match(route, /complete_private_document_scan/);
  assert.match(route, /p_expected_sha256_hex: document\.sha256_hex/);
  assert.match(route, /p_scan_result: "error"/);
  assert.match(route, /p_scan_engine: "quarantine-timeout"/);
  assert.match(route, /manualReviewSkipped/);
  assert.doesNotMatch(route, /storage\.from\(/);
  assert.doesNotMatch(route, /createSignedUrl|createSignedUrls/);
});
