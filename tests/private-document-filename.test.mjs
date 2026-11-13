import test from "node:test";
import assert from "node:assert/strict";
import { sanitizePrivateDocumentFilename } from "../src/lib/private-document-filename.mjs";

test("keeps only the basename from client-supplied paths", () => {
  assert.equal(sanitizePrivateDocumentFilename("C:\\fakepath\\evidence.pdf"), "evidence.pdf");
  assert.equal(sanitizePrivateDocumentFilename("../../evidence.pdf"), "evidence.pdf");
});

test("removes C0, DEL and Unicode C1 control characters", () => {
  assert.equal(
    sanitizePrivateDocumentFilename("ev\u0001id\u007fenc\u0085e\u009f.pdf"),
    "evidence.pdf",
  );
});

test("trims whitespace and applies a 255-character bound", () => {
  assert.equal(sanitizePrivateDocumentFilename("  evidence.pdf  "), "evidence.pdf");
  assert.equal(sanitizePrivateDocumentFilename("a".repeat(300)).length, 255);
});

test("uses a safe fallback for empty and non-string values", () => {
  for (const value of ["", "   ", "\u0085", null, undefined, 42]) {
    assert.equal(sanitizePrivateDocumentFilename(value), "evidence");
  }
});
