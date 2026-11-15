import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/private-documents/scan-callback/route.ts", import.meta.url), "utf8");

test("scanner callback is excluded because no production scanner is part of the MVP", () => {
  assert.match(route, /CONFIDENTIAL_DOCUMENT_EXCHANGE_EXCLUDED_FROM_MVP/);
  assert.match(route, /status: 410/);
  assert.doesNotMatch(route, /MAX_CLOCK_SKEW_SECONDS|verifyScannerCallbackSignature|complete_private_document_scan|DOCUMENT_SCANNER_WEBHOOK_SECRET/);
});
