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

test("recovery selects only stale pending, non-deleted, digest-bound documents in bounded batches", () => {
  assert.match(route, /STALE_AFTER_HOURS = 24/);
  assert.match(route, /MAX_BATCH_SIZE = 50/);
  assert.match(route, /\.eq\("scan_status", "pending"\)/);
  assert.match(route, /\.is\("deleted_at", null\)/);
  assert.match(route, /\.not\("sha256_hex", "is", null\)/);
  assert.match(route, /\.lt\("uploaded_at", cutoff\)/);
  const digestFilter = route.indexOf('.not("sha256_hex", "is", null)');
  const batchLimit = route.indexOf(".limit(MAX_BATCH_SIZE)");
  assert.ok(digestFilter >= 0 && digestFilter < batchLimit);
});

test("recovery reuses the digest-bound audited transition and never deletes or serves objects", () => {
  assert.match(route, /complete_private_document_scan/);
  assert.match(route, /p_expected_sha256_hex: document\.sha256_hex/);
  assert.match(route, /p_scan_result: "error"/);
  assert.match(route, /p_scan_engine: "quarantine-timeout"/);
  assert.match(route, /p_request_id: randomUUID\(\)/);
  assert.doesNotMatch(route, /manualReviewSkipped/);
  assert.doesNotMatch(route, /storage\.from\(/);
  assert.doesNotMatch(route, /createSignedUrl|createSignedUrls/);
  assert.match(route, /Quarantine objects are retained/);
});


test("unexpected recovery dependency failures return a generic fail-closed response", () => {
  assert.match(route, /async function handlePrivateDocumentRecovery\(request: Request\)/);
  assert.match(route, /export async function POST\(request: Request\): Promise<Response>\s*\{\s*try\s*\{\s*return await handlePrivateDocumentRecovery\(request\);\s*\}\s*catch\s*\{\s*return respond\(503, \{ error: "DOCUMENT_RECOVERY_UNAVAILABLE" \}\);/);
  assert.doesNotMatch(route, /catch\s*\(\s*(?:error|err|exception)\s*\)[\s\S]{0,200}(?:error\.message|exception\.message|err\.message)/);
});
