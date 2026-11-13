import sharp from "sharp";

export const MAX_LISTING_IMAGE_INPUT_BYTES = 4 * 1024 * 1024;
export const MAX_LISTING_IMAGE_OUTPUT_BYTES = 8 * 1024 * 1024;
export const MAX_LISTING_IMAGE_DIMENSION = 8192;
export const MAX_LISTING_IMAGE_PIXELS = 24_000_000;

const INPUT_OPTIONS = {
  failOn: "warning",
  limitInputPixels: MAX_LISTING_IMAGE_PIXELS,
  timeout: 10,
};

/** @typedef {{ bytes: Buffer, width: number, height: number, mimeType: 'image/webp' }} CanonicalListingImage */

  bytes: Buffer;
  width: number;
  height: number;
  mimeType: "image/webp";
};

/** @param {Buffer} input @returns {Promise<CanonicalListingImage>} */
export async function canonicalizeListingImage(input) {
  if (input.byteLength < 1 || input.byteLength > MAX_LISTING_IMAGE_INPUT_BYTES) {
    throw new Error("LISTING_MEDIA_INVALID_INPUT_SIZE");
  }

  let metadata;
  try {
    metadata = await sharp(input, INPUT_OPTIONS).metadata();
  } catch {
    throw new Error("LISTING_MEDIA_IMAGE_DECODE_FAILED");
  }

  if (!["jpeg", "png", "webp"].includes(metadata.format ?? "")) {
    throw new Error("LISTING_MEDIA_UNSUPPORTED_IMAGE_FORMAT");
  }
  if (typeof metadata.width !== "number" || typeof metadata.height !== "number" ||
      metadata.width < 1 || metadata.height < 1 ||
      metadata.width > MAX_LISTING_IMAGE_DIMENSION ||
      metadata.height > MAX_LISTING_IMAGE_DIMENSION ||
      metadata.width * metadata.height > MAX_LISTING_IMAGE_PIXELS) {
    throw new Error("LISTING_MEDIA_IMAGE_DIMENSIONS_REJECTED");
  }
  if (typeof metadata.pages === "number" && metadata.pages > 1) {
    throw new Error("LISTING_MEDIA_ANIMATION_NOT_SUPPORTED");
  }

  let result;
  try {
    result = await sharp(input, INPUT_OPTIONS)
      .rotate()
      .resize({
        width: 2560,
        height: 2560,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82, effort: 4 })
      .toBuffer({ resolveWithObject: true });
  } catch {
    throw new Error("LISTING_MEDIA_IMAGE_PROCESSING_FAILED");
  }

  if (result.info.format !== "webp" ||
      result.data.byteLength < 1 ||
      result.data.byteLength > MAX_LISTING_IMAGE_OUTPUT_BYTES) {
    throw new Error("LISTING_MEDIA_CANONICAL_OUTPUT_REJECTED");
  }

  return {
    bytes: result.data,
    width: result.info.width,
    height: result.info.height,
    mimeType: "image/webp",
  };
}

/** @param {string} value @returns {string} */
export function safeListingMediaFilename(value) {
  const basename = value.split(/[\\/]/).pop() ?? "";
  const cleaned = basename.replace(/[\\u0000-\\u001f\\u007f]/g, "").trim().slice(0, 255);
  return cleaned || "property-image";
}
