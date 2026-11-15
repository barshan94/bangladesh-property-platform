import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/private-documents/route.ts", import.meta.url), "utf8");

test("confidential document upload is explicitly excluded from the MVP", () => {
  assert.match(route, /CONFIDENTIAL_DOCUMENT_EXCHANGE_EXCLUDED_FROM_MVP/);
  assert.match(route, /status: 410/);
  assert.doesNotMatch(route, /formData\(|storage\.from\(|reserve_private_document_slot|createSignedUrl/);
});
