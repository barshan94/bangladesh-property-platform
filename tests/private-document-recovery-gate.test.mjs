import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/private-documents/recovery/route.ts", import.meta.url), "utf8");

test("confidential document recovery is excluded from the MVP", () => {
  assert.match(route, /CONFIDENTIAL_DOCUMENT_EXCHANGE_EXCLUDED_FROM_MVP/);
  assert.match(route, /status: 410/);
  assert.doesNotMatch(route, /private_documents|complete_private_document_scan|CRON_SECRET|storage\.from\(/);
});
