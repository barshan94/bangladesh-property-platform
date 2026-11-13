import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/private-documents/scan-callback/route.ts", import.meta.url), "utf8");

test("scanner callback uses the shared bounded request reader", () => {
  assert.match(route, /import \{ readBoundedBody \} from "@\/lib\/private-document-body\.mjs"/u);
  assert.match(route, /readBoundedBody\(request, MAX_BODY_BYTES\)/u);
  assert.doesNotMatch(route, /async function readBoundedBody/u);
});

test("scanner callback authenticates the exact bounded bytes before parsing", () => {
  assert.ok(route.indexOf("readBoundedBody(request, MAX_BODY_BYTES)") < route.indexOf("validSignature(secret, timestamp, rawBody, signature)"));
  assert.ok(route.indexOf("validSignature(secret, timestamp, rawBody, signature)") < route.indexOf("JSON.parse(decodedBody)"));
  assert.match(route, /update\(timestamp\)\.update\("\."\)\.update\(rawBody\)/u);
});
