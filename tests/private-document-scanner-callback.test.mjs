import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(
  new URL("../src/app/api/private-documents/scan-callback/route.ts", import.meta.url),
  "utf8",
);
const authHelper = await readFile(
  new URL("../src/lib/private-document-scan-auth.mjs", import.meta.url),
  "utf8",
);
const bodyHelper = await readFile(
  new URL("../src/lib/private-document-body.mjs", import.meta.url),
  "utf8",
);

test("scanner callback authenticates the exact raw body with the shared HMAC-SHA256 verifier", () => {
  assert.match(route, /verifyScannerCallbackSignature\(secret, timestamp, rawBody, signature\)/);
  assert.match(authHelper, /createHmac\("sha256", secret\)/);
  assert.match(authHelper, /timingSafeEqual/);
  assert.match(authHelper, /update\(timestamp\).*update\("\."\).*update\(rawBody\)/);
  assert.match(route, /x-scanner-signature/);
  assert.match(route, /x-scanner-timestamp/);
});

test("scanner callback rejects stale signatures and uses the shared bounded body reader", () => {
  assert.match(route, /MAX_CLOCK_SKEW_SECONDS = 5 \* 60/);
  assert.match(route, /SCANNER_SIGNATURE_EXPIRED/);
  assert.match(route, /MAX_BODY_BYTES = 16 \* 1024/);
  assert.match(route, /readBoundedBody\(request, MAX_BODY_BYTES\)/);
  assert.match(bodyHelper, /total > maxBytes/);
  assert.match(bodyHelper, /await reader\.cancel\(\)/);
  assert.ok(route.indexOf("readBoundedBody(request, MAX_BODY_BYTES)") < route.indexOf("JSON.parse(decodedBody)"));
});

test("scanner callback validates a strict payload and binds results to document digest", () => {
  assert.match(route, /INVALID_SCAN_RESULT/);
  assert.match(route, /const SHA256 = \/\^\[a-f0-9\]\{64\}\$\//);
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
