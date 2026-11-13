import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(
  new URL("../src/app/api/private-documents/scan-callback/route.ts", import.meta.url),
  "utf8",
);

test("scanner callback authenticates the exact raw body with HMAC-SHA256", () => {
  assert.match(route, /createHmac\("sha256", secret\)/);
  assert.match(route, /timingSafeEqual/);
  assert.match(route, /x-scanner-signature/);
  assert.match(route, /x-scanner-timestamp/);
  assert.match(route, /update\(timestamp\).*update\("\."\).*update\(rawBody\)/);
});

test("scanner callback rejects stale signatures and oversized payloads", () => {
  assert.match(route, /MAX_CLOCK_SKEW_SECONDS = 5 \* 60/);
  assert.match(route, /SCANNER_SIGNATURE_EXPIRED/);
  assert.match(route, /MAX_BODY_BYTES = 16 \* 1024/);
  assert.match(route, /REQUEST_TOO_LARGE/);
  assert.match(route, /request\.body\.getReader\(\)/);
  assert.match(route, /total > MAX_BODY_BYTES/);
});

test("scanner callback validates a strict payload and binds results to document digest", () => {
  assert.match(route, /INVALID_SCAN_RESULT/);
  assert.match(route, /SHA256 = \//);
  assert.match(route, /p_expected_sha256_hex: sha256/);
  assert.match(route, /p_document_id: documentId/);
  assert.match(route, /p_scan_result: result/);
});

test("scanner callback uses only server-side Supabase secret and trusted RPC", () => {
  assert.match(route, /process\.env\.SUPABASE_SECRET_KEY/);
  assert.match(route, /process\.env\.DOCUMENT_SCANNER_WEBHOOK_SECRET/);
  assert.match(route, /admin\.rpc\("complete_private_document_scan"/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_.*SECRET|service_role/i);
});

test("scanner callback rejects replayed or mismatched one-way scan completions", () => {
  assert.match(route, /PRIVATE_DOCUMENT_SCAN_TARGET_MISMATCH_OR_ALREADY_SCANNED/);
  assert.match(route, /SCAN_TARGET_MISMATCH_OR_ALREADY_PROCESSED/);
  assert.ok(route.includes("respond(200,"));
});
