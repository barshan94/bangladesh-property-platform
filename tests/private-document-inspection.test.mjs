import test from "node:test";
import assert from "node:assert/strict";
import { detectPrivateDocumentMimeType } from "../src/lib/private-document-inspection.mjs";

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const name = new TextEncoder().encode(type);
  const chunk = new Uint8Array(12 + data.length);
  const view = new DataView(chunk.buffer);
  view.setUint32(0, data.length);
  chunk.set(name, 4);
  chunk.set(data, 8);
  view.setUint32(8 + data.length, crc32(chunk.subarray(4, 8 + data.length)));
  return chunk;
}

function validPng() {
  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, 1);
  view.setUint32(4, 1);
  ihdr.set([8, 2, 0, 0, 0], 8);
  const chunks = [
    pngChunk("IHDR", ihdr),
    pngChunk("IDAT", Uint8Array.from([0x78, 0x9c, 0x63, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01])),
    pngChunk("IEND", new Uint8Array()),
  ];
  const result = new Uint8Array(signature.length + chunks.reduce((n, chunk) => n + chunk.length, 0));
  result.set(signature);
  let offset = signature.length;
  for (const chunk of chunks) { result.set(chunk, offset); offset += chunk.length; }
  return result;
}

function validJpeg() {
  return Uint8Array.from([
    0xff,0xd8, 0xff,0xc0,0x00,0x0b,0x08,0x00,0x01,0x00,0x01,0x01,0x01,0x11,0x00,
    0xff,0xda,0x00,0x08,0x01,0x01,0x00,0x00,0x3f,0x00,0x11,0xff,0xd9,
  ]);
}

test("accepts minimally structured PDF, PNG and JPEG documents", () => {
  const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj <<>> endobj\nstartxref\n9\n%%EOF\n");
  assert.equal(detectPrivateDocumentMimeType(pdf), "application/pdf");
  assert.equal(detectPrivateDocumentMimeType(validPng()), "image/png");
  assert.equal(detectPrivateDocumentMimeType(validJpeg()), "image/jpeg");
});

test("rejects signature-only, truncated and structurally inconsistent files", () => {
  assert.equal(detectPrivateDocumentMimeType(Uint8Array.from([0x25,0x50,0x44,0x46,0x2d,0x31])), null);
  assert.equal(detectPrivateDocumentMimeType(Uint8Array.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a])), null);
  assert.equal(detectPrivateDocumentMimeType(Uint8Array.from([0xff,0xd8,0xff,0xe0,0xff,0xd9])), null);
  const corruptPng = validPng();
  corruptPng[corruptPng.length - 5] ^= 0xff;
  assert.equal(detectPrivateDocumentMimeType(corruptPng), null);
  assert.equal(detectPrivateDocumentMimeType(new TextEncoder().encode("deed.pdf")), null);
  assert.equal(detectPrivateDocumentMimeType(new TextEncoder().encode("<html>")), null);
  assert.equal(detectPrivateDocumentMimeType(new Uint8Array()), null);
  assert.equal(detectPrivateDocumentMimeType("not bytes"), null);
  assert.equal(detectPrivateDocumentMimeType(null), null);
});

test("rejects malformed PDF cross-reference trailer and JPEG frame structure", () => {
  const badPdf = new TextEncoder().encode("%PDF-1.7\nstartxref\n999999\n%%EOF\n");
  assert.equal(detectPrivateDocumentMimeType(badPdf), null);
  const badJpeg = Uint8Array.from([0xff,0xd8,0xff,0xda,0x00,0x02,0xff,0xd9]);
  assert.equal(detectPrivateDocumentMimeType(badJpeg), null);
});
