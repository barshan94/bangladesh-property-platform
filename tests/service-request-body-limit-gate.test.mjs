import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/service-requests/route.ts", import.meta.url), "utf8");

test("authenticated service request route enforces its body limit while streaming", () => {
  assert.match(route, /import \{ readBoundedBody \} from "@\/lib\/private-document-body\.mjs"/u);
  assert.match(route, /readBoundedBody\(request, MAX_BODY_BYTES\)/u);
  assert.match(route, /if \(!boundedBody\) return json\(413, \{ error: "REQUEST_TOO_LARGE" \}\)/u);
  assert.ok(route.indexOf("readBoundedBody(request, MAX_BODY_BYTES)") < route.indexOf("JSON.parse("));
});

test("service request route does not use unbounded request readers", () => {
  assert.doesNotMatch(route, /request\.(?:text|json)\(\)/u);
  assert.match(route, /new TextDecoder\("utf-8", \{ fatal: true \}\)\.decode\(boundedBody\)/u);
});
