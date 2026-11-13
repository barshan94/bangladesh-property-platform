import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import {
  canonicalizeListingImage,
  MAX_LISTING_IMAGE_INPUT_BYTES,
  MAX_LISTING_IMAGE_OUTPUT_BYTES,
  safeListingMediaFilename,
} from "../src/lib/listing-media-processing.mjs";

test("JPEG input is decoded, orientation-normalized, metadata-stripped and re-encoded as WebP", async () => {
  const svg = Buffer.from('<svg width="48" height="32" xmlns="http://www.w3.org/2000/svg"><rect width="48" height="32" fill="#345"/></svg>');
  const original = await sharp(svg).jpeg().withMetadata().toBuffer();
  const before = await sharp(original).metadata();
  assert.ok(before.exif || before.icc || before.xmp);

  const canonical = await canonicalizeListingImage(original);
  const after = await sharp(canonical.bytes).metadata();
  assert.equal(canonical.mimeType, "image/webp");
  assert.equal(after.format, "webp");
  assert.equal(after.exif, undefined);
  assert.equal(after.xmp, undefined);
  assert.equal(after.iptc, undefined);
  assert.equal(after.icc, undefined);
  assert.equal(canonical.width, 48);
  assert.equal(canonical.height, 32);
  assert.ok(canonical.bytes.byteLength <= MAX_LISTING_IMAGE_OUTPUT_BYTES);
});

test("PNG and WebP inputs are accepted and normalized to WebP", async () => {
  const svg = Buffer.from('<svg width="20" height="12" xmlns="http://www.w3.org/2000/svg"><circle cx="10" cy="6" r="5" fill="red"/></svg>');
  for (const input of [await sharp(svg).png().toBuffer(), await sharp(svg).webp().toBuffer()]) {
    const canonical = await canonicalizeListingImage(input);
    assert.equal((await sharp(canonical.bytes).metadata()).format, "webp");
  }
});

test("corrupt, unsupported and oversized image inputs are rejected", async () => {
  await assert.rejects(canonicalizeListingImage(Buffer.from("not an image")), /LISTING_MEDIA_IMAGE_DECODE_FAILED/);

  const svg = Buffer.from('<svg width="9000" height="1" xmlns="http://www.w3.org/2000/svg"><rect width="9000" height="1"/></svg>');
  const oversized = await sharp(svg).png().toBuffer();
  await assert.rejects(canonicalizeListingImage(oversized), /LISTING_MEDIA_IMAGE_DIMENSIONS_REJECTED/);

  await assert.rejects(canonicalizeListingImage(Buffer.alloc(MAX_LISTING_IMAGE_INPUT_BYTES + 1)), /LISTING_MEDIA_INVALID_INPUT_SIZE/);
});

test("original filenames are reduced to bounded safe display names", () => {
  assert.equal(safeListingMediaFilename("../../private\\photo.jpg"), "photo.jpg");
  assert.equal(safeListingMediaFilename("\u0000\u0001"), "property-image");
  assert.equal(safeListingMediaFilename("x".repeat(300)).length, 255);
});
