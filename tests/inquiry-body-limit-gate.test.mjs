import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/inquiries/route.ts", import.meta.url), "utf8");

test("public inquiry route enforces the byte limit during streaming", () => {
  assert.match(route, /import \{ readBoundedBody \} from "@\/lib\/private-document-body\.mjs"/u);
  assert.match(route, /readBoundedBody\(request, MAX_BODY_BYTES\)/u);
  assert.match(route, /if \(!boundedBody\) return json\(413, \{ error: "REQUEST_TOO_LARGE" \}\)/u);
  assert.ok(route.indexOf("readBoundedBody(request, MAX_BODY_BYTES)") < route.indexOf("JSON.parse("));
});

test("public inquiry route does not buffer an unbounded request before checking size", () => {
  assert.doesNotMatch(route, /request\.text\(\)/u);
  assert.doesNotMatch(route, /request\.json\(\)/u);
  assert.match(route, /new TextDecoder\("utf-8", \{ fatal: true \}\)\.decode\(boundedBody\)/u);
});
