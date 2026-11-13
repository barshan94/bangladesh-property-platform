import test from "node:test";
import assert from "node:assert/strict";
import { detectPrivateDocumentMimeType } from "../src/lib/private-document-inspection.mjs";

test("detects PDF, PNG and JPEG from file signatures", () => {
  assert.equal(
    detectPrivateDocumentMimeType(Uint8Array.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])),
    "application/pdf",
  );
  assert.equal(
    detectPrivateDocumentMimeType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/png",
  );
  assert.equal(
    detectPrivateDocumentMimeType(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0])),
    "image/jpeg",
  );
});

test("does not trust filenames, MIME labels or arbitrary byte content", () => {
  assert.equal(detectPrivateDocumentMimeType(new TextEncoder().encode("deed.pdf")), null);
  assert.equal(detectPrivateDocumentMimeType(new TextEncoder().encode("<html>")), null);
  assert.equal(detectPrivateDocumentMimeType(new Uint8Array()), null);
  assert.equal(detectPrivateDocumentMimeType("not bytes"), null);
  assert.equal(detectPrivateDocumentMimeType(null), null);
});

test("rejects truncated signatures", () => {
  assert.equal(detectPrivateDocumentMimeType(Uint8Array.from([0x25, 0x50, 0x44, 0x46])), null);
  assert.equal(detectPrivateDocumentMimeType(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a])), null);
  assert.equal(detectPrivateDocumentMimeType(Uint8Array.from([0xff, 0xd8])), null);
});
