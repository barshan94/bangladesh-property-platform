import test from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { verifyScannerCallbackSignature } from "../src/lib/private-document-scan-auth.mjs";

const secret = "scanner-webhook-secret-that-is-long-enough-for-tests";
const timestamp = "1794592800";
const body = new TextEncoder().encode('{"documentId":"123","result":"clean"}');
const sign = (bytes, time = timestamp) =>
  createHmac("sha256", secret).update(time).update(".").update(bytes).digest("hex");

test("scanner callback signature accepts the exact timestamp and raw bytes", () => {
  assert.equal(verifyScannerCallbackSignature(secret, timestamp, body, sign(body)), true);
});

test("scanner callback signature rejects a changed body", () => {
  const altered = new TextEncoder().encode('{"documentId":"123","result":"infected"}');
  assert.equal(verifyScannerCallbackSignature(secret, timestamp, altered, sign(body)), false);
});

test("scanner callback signature rejects a changed timestamp", () => {
  assert.equal(verifyScannerCallbackSignature(secret, "1794592801", body, sign(body)), false);
});

test("scanner callback signature rejects malformed hex and wrong-length signatures", () => {
  assert.equal(verifyScannerCallbackSignature(secret, timestamp, body, "not-hex"), false);
  assert.equal(verifyScannerCallbackSignature(secret, timestamp, body, "a".repeat(62)), false);
});

test("scanner callback signature rejects invalid argument types", () => {
  assert.equal(verifyScannerCallbackSignature("", timestamp, body, 42), false);
  assert.equal(verifyScannerCallbackSignature(secret, timestamp, [], sign(body)), false);
});
