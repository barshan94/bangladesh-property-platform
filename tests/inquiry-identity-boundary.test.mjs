import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/inquiries/route.ts", import.meta.url), "utf8");

test("public inquiry endpoint rejects cross-origin and missing-origin requests before processing", () => {
  assert.ok(route.includes("function sameOrigin(request: Request)"));
  assert.ok(route.includes("process.env.NEXT_PUBLIC_SITE_URL"));
  assert.ok(route.includes('request.headers.get("origin")'));
  assert.ok(route.includes('if (!sameOrigin(request)) return json(403, { error: "SAME_ORIGIN_REQUIRED" })'));
  assert.ok(route.indexOf("if (!sameOrigin(request))") < route.indexOf("readBoundedBody(request, MAX_BODY_BYTES)"));
  assert.ok(route.indexOf("if (!sameOrigin(request))") < route.indexOf("createClient(url, secretKey"));
});

test("public inquiry origin validation rejects opaque, non-canonical and mismatched origins", () => {
  assert.ok(route.includes('requestOrigin === "null"'));
  assert.ok(route.includes("suppliedOrigin === requestOrigin"));
  assert.ok(route.includes("suppliedOrigin === expectedOrigin"));
  assert.ok(route.includes("catch {\n    return false;"));
});
