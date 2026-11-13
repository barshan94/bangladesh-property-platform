const SIGNATURES = Object.freeze([
  {
    mimeType: "application/pdf",
    matches: (bytes) =>
      bytes.length >= 5 &&
      bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 &&
      bytes[3] === 0x46 && bytes[4] === 0x2d,
  },
  {
    mimeType: "image/png",
    matches: (bytes) =>
      bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e &&
      bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a &&
      bytes[6] === 0x1a && bytes[7] === 0x0a,
  },
  {
    mimeType: "image/jpeg",
    matches: (bytes) =>
      bytes.length >= 3 &&
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
]);

/**
 * Detect the declared document family from its leading file bytes.
 * This is a format-signature check, not malware scanning or full file validation.
 * The caller must still enforce size limits and keep the file quarantined until
 * a trusted malware scanner has returned a clean result.
 */
export function detectPrivateDocumentMimeType(bytes) {
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) return null;
  const signature = SIGNATURES.find((entry) => entry.matches(bytes));
  return signature?.mimeType ?? null;
}
