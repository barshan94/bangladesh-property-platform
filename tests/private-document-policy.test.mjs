import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePrivateDocument } from "../src/lib/private-document-policy.mjs";

const valid = { purpose: "listing_evidence", detectedMimeType: "application/pdf", sizeBytes: 1024, scanStatus: "clean" };

test("permits only clean, supported, bounded documents for private storage", () => {
  const result = evaluatePrivateDocument(valid);
  assert.equal(result.accepted, true);
  assert.equal(result.disposition, "private_storage");
  assert.equal(Object.isFrozen(result), true);
});
test("keeps pending or failed scans in quarantine", () => {
  for (const scanStatus of ["pending", "error"]) {
    const result = evaluatePrivateDocument({ ...valid, scanStatus });
    assert.equal(result.accepted, false);
    assert.equal(result.disposition, "quarantine");
  }
});
test("rejects infected, unsupported and oversized documents", () => {
  assert.equal(evaluatePrivateDocument({ ...valid, scanStatus: "infected" }).reason, "MALWARE_DETECTED");
  assert.equal(evaluatePrivateDocument({ ...valid, detectedMimeType: "text/html" }).reason, "UNSUPPORTED_FILE_TYPE");
  assert.equal(evaluatePrivateDocument({ ...valid, sizeBytes: 15 * 1024 * 1024 + 1 }).reason, "INVALID_FILE_SIZE");
});
test("rejects malformed sizes, purposes, extra fields and prototype-shaped input", () => {
  assert.equal(evaluatePrivateDocument({ ...valid, sizeBytes: 0 }).reason, "INVALID_FILE_SIZE");
  assert.equal(evaluatePrivateDocument({ ...valid, purpose: "public_media" }).reason, "INVALID_PURPOSE");
  assert.equal(evaluatePrivateDocument({ ...valid, filename: "deed.pdf" }).reason, "UNEXPECTED_FIELD");
  assert.equal(evaluatePrivateDocument(Object.assign(Object.create({ inherited: true }), valid)).reason, "INVALID_INPUT");
});
test("does not mutate caller input", () => {
  const input = { ...valid };
  evaluatePrivateDocument(input);
  assert.deepEqual(input, valid);
});
