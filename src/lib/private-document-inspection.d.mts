/** Detects PDF/JPEG/PNG signatures from bytes; null means unsupported or unrecognized. */
export declare function detectPrivateDocumentMimeType(
  bytes: Uint8Array,
): "application/pdf" | "image/jpeg" | "image/png" | null;
