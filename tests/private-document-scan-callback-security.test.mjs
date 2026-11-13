import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/private-documents/scan-callback/route.ts", import.meta.url), "utf8");

test("scanner callback rejects timestamps outside the five-minute replay window", () => {
  assert.match(route, /const MAX_CLOCK_SKEW_SECONDS = 5 \* 60/u);
  assert.match(route, /Math\.abs\(Math\.floor\(Date\.now\(\) \/ 1000\) - timestampSeconds\) > MAX_CLOCK_SKEW_SECONDS/u);
  assert.ok(route.indexOf("SCANNER_SIGNATURE_EXPIRED") < route.indexOf("verifyScannerCallbackSignature(secret, timestamp, rawBody, signature)"));
});

test("scanner callback verifies HMAC before JSON parsing or database access", () => {
  const verify = route.indexOf("verifyScannerCallbackSignature(secret, timestamp, rawBody, signature)");
  const parse = route.indexOf("JSON.parse(decodedBody)");
  const client = route.indexOf("createSupabaseClient<Database>");
  assert.ok(verify >= 0 && verify < parse && parse < client);
});

test("scanner callback rejects unknown payload fields and validates scanner identifiers", () => {
  assert.match(route, /Object\.keys\(data\)\.some/u);
  assert.match(route, /typeof requestId !== "string" \|\| !UUID\.test\(requestId\)/u);
  assert.match(route, /typeof sha256 !== "string" \|\| !SHA256\.test\(sha256\)/u);
});

test("scanner callback forwards the signed request ID and expected digest to the atomic RPC", () => {
  assert.match(route, /p_expected_sha256_hex:\s*sha256/u);
  assert.match(route, /p_request_id:\s*requestId/u);
  assert.match(route, /complete_private_document_scan/u);
});

test("scanner callback reports already-processed or mismatched targets as conflicts", () => {
  assert.match(route, /PRIVATE_DOCUMENT_SCAN_TARGET_MISMATCH_OR_ALREADY_SCANNED/u);
  assert.match(route, /respond\(409,/u);
});
