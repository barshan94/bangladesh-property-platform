import test from "node:test";
import assert from "node:assert/strict";
import { readBoundedBody } from "../src/lib/private-document-body.mjs";

function requestWithChunks(chunks) {
  return new Request("http://localhost.test/upload", {
    method: "POST",
    body: new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new Uint8Array(chunk));
        controller.close();
      },
    }),
    duplex: "half",
  });
}

test("bounded reader returns the exact bytes for a body within the limit", async () => {
  const result = await readBoundedBody(requestWithChunks([[1, 2], [3, 4]]), 4);
  assert.deepEqual([...result], [1, 2, 3, 4]);
});

test("bounded reader accepts a body exactly at the configured limit", async () => {
  const result = await readBoundedBody(requestWithChunks([[1, 2, 3]]), 3);
  assert.deepEqual([...result], [1, 2, 3]);
});

test("bounded reader rejects a chunked body that exceeds the limit", async () => {
  const result = await readBoundedBody(requestWithChunks([[1, 2], [3, 4]]), 3);
  assert.equal(result, null);
});

test("bounded reader returns an empty byte array for a bodyless request", async () => {
  const result = await readBoundedBody(new Request("http://localhost.test/upload"), 0);
  assert.deepEqual([...result], []);
});

test("bounded reader rejects invalid limits", async () => {
  for (const limit of [-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY]) {
    await assert.rejects(readBoundedBody(new Request("http://localhost.test/upload"), limit), RangeError);
  }
});
