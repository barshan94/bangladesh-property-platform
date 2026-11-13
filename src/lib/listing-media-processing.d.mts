export const MAX_LISTING_IMAGE_INPUT_BYTES: number;
export const MAX_LISTING_IMAGE_OUTPUT_BYTES: number;
export const MAX_LISTING_IMAGE_DIMENSION: number;
export const MAX_LISTING_IMAGE_PIXELS: number;
export type CanonicalListingImage = {
  bytes: Buffer;
  width: number;
  height: number;
  mimeType: "image/webp";
};
export function canonicalizeListingImage(input: Buffer): Promise<CanonicalListingImage>;
export function safeListingMediaFilename(value: string): string;
