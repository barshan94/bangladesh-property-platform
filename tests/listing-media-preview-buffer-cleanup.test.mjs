import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const route = readFileSync(
  fileURLToPath(new URL("../src/app/api/listing-media/[mediaId]/route.ts", import.meta.url)),
  "utf8",
);

test("private listing-media preview clears its working byte buffer on every post-read path", () => {
  const read = route.indexOf("bytes = Buffer.from(await object.arrayBuffer())");
  const processingStart = route.indexOf("  try {\n    const validWebp", read);
  const cleanup = route.indexOf("  } finally {\n    bytes.fill(0);", processingStart);
  const responseCopy = route.indexOf("const responseBytes = new Uint8Array(bytes)", processingStart);
  const response = route.indexOf("return new Response(responseBytes", processingStart);

  assert.ok(read >= 0, "the bounded object is materialized once");
  assert.ok(processingStart > read, "all post-read processing is inside the cleanup try");
  assert.ok(responseCopy > processingStart, "response receives a separate byte copy");
  assert.ok(response > responseCopy, "verified bytes are returned only after audit");
  assert.ok(cleanup > response, "finally clears the source buffer after response construction");
  assert.equal((route.match(/bytes\.fill\(0\)/g) ?? []).length, 1,
    "cleanup is centralized in one unconditional finally block");
  assert.match(route, /catch \{\n    return respond\(503, "Private image could not be read"\);\n  \}/);
});

test("private listing-media preview retains integrity and audit gates before serving bytes", () => {
  const digest = route.indexOf("createHash(\"sha256\").update(bytes).digest(\"hex\")");
  const audit = route.indexOf('action: "listing_media.previewed"');
  const response = route.indexOf("return new Response(responseBytes");
  assert.ok(digest >= 0 && audit > digest && response > audit);
  assert.match(route, /actualDigest !== media\.sha256_hex/);
  assert.match(route, /cache-control": "private, no-store, max-age=0"/);
});
