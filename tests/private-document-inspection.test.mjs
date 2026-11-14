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

function validPng(width = 1, height = 1) {
  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = new Uint8Array(13);
  const view = new DataView(ihdr.buffer);
  view.setUint32(0, width);
  view.setUint32(4, height);
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

function validJpeg(width = 1, height = 1) {
  return Uint8Array.from([
    0xff,0xd8, 0xff,0xc0,0x00,0x0b,0x08,(height >> 8) & 0xff,height & 0xff,(width >> 8) & 0xff,width & 0xff,0x01,0x01,0x11,0x00,
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
  const invalidXrefTarget = new TextEncoder().encode("%PDF-1.7\nnot-a-reference-target\nstartxref\n9\n%%EOF\n");
  assert.equal(detectPrivateDocumentMimeType(invalidXrefTarget), null);
  const badJpeg = Uint8Array.from([0xff,0xd8,0xff,0xda,0x00,0x02,0xff,0xd9]);
  assert.equal(detectPrivateDocumentMimeType(badJpeg), null);
});


test("rejects image dimensions that could trigger excessive decoder memory use", () => {
  assert.equal(detectPrivateDocumentMimeType(validPng(16_385, 1)), null);
  assert.equal(detectPrivateDocumentMimeType(validPng(4097, 4097)), null);
  assert.equal(detectPrivateDocumentMimeType(validJpeg(16_385, 1)), null);
  assert.equal(detectPrivateDocumentMimeType(validJpeg(4097, 4097)), null);
});

test("rejects simple appended-payload polyglots for all supported formats", () => {
  const pdf = new TextEncoder().encode("%PDF-1.7\n1 0 obj <<>> endobj\nstartxref\n9\n%%EOF\n");
  const png = validPng();
  const jpeg = validJpeg();
  const suffix = new TextEncoder().encode("<script>alert(1)</script>");
  const append = (bytes) => { const result = new Uint8Array(bytes.length + suffix.length); result.set(bytes); result.set(suffix, bytes.length); return result; };
  assert.equal(detectPrivateDocumentMimeType(append(pdf)), null);
  assert.equal(detectPrivateDocumentMimeType(append(png)), null);
  assert.equal(detectPrivateDocumentMimeType(append(jpeg)), null);
});


test("rejects invalid PNG critical-chunk and image-data ordering", () => {
  const png = validPng();
  const signature = png.subarray(0, 8);
  const ihdr = png.subarray(8, 33);
  const idat = png.subarray(33, png.length - 12);
  const iend = png.subarray(png.length - 12);
  const join = (...parts) => {
    const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
    let offset = 0;
    for (const part of parts) { result.set(part, offset); offset += part.length; }
    return result;
  };
  const unknownCritical = pngChunk("ABCD", new Uint8Array([1]));
  const ancillary = pngChunk("tEXt", new Uint8Array([65, 66]));

  assert.equal(detectPrivateDocumentMimeType(join(signature, ihdr, unknownCritical, idat, iend)), null);
  assert.equal(detectPrivateDocumentMimeType(join(signature, ihdr, idat, ancillary, idat, iend)), null);
  assert.equal(detectPrivateDocumentMimeType(join(signature, ihdr, idat, pngChunk("PLTE", new Uint8Array([0, 0, 0])), iend)), null);
});

test("rejects indexed PNG without a palette", () => {
  const png = validPng();
  png[25] = 3; // IHDR color type: indexed colour
  const ihdrData = png.subarray(16, 29);
  const crcInput = png.subarray(12, 29);
  new DataView(png.buffer).setUint32(29, crc32(crcInput));
  assert.equal(detectPrivateDocumentMimeType(png), null);
});
