const MAX_FILE_BYTES = 15 * 1024 * 1024;
const MIME_BY_PURPOSE = Object.freeze({
  listing_evidence: new Set(["application/pdf", "image/jpeg", "image/png"]),
  client_case: new Set(["application/pdf", "image/jpeg", "image/png"]),
});
const SCAN_STATES = new Set(["pending", "clean", "infected", "error"]);

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value) &&
    (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null);
}

/**
 * Decide whether a server-inspected private document may leave quarantine.
 * The caller must supply MIME detected from file bytes and a completed scanner result,
 * not browser-supplied metadata. This policy does not authenticate, store or authorize.
 */
export function evaluatePrivateDocument(input) {
  if (!isPlainObject(input)) return { accepted: false, disposition: "rejected", reason: "INVALID_INPUT" };
  const keys = new Set(["purpose", "detectedMimeType", "sizeBytes", "scanStatus"]);
  if (Object.keys(input).some((key) => !keys.has(key))) {
    return { accepted: false, disposition: "rejected", reason: "UNEXPECTED_FIELD" };
  }
  if (!Object.hasOwn(MIME_BY_PURPOSE, input.purpose)) {
    return { accepted: false, disposition: "rejected", reason: "INVALID_PURPOSE" };
  }
  if (typeof input.detectedMimeType !== "string" || !MIME_BY_PURPOSE[input.purpose].has(input.detectedMimeType)) {
    return { accepted: false, disposition: "rejected", reason: "UNSUPPORTED_FILE_TYPE" };
  }
  if (!Number.isSafeInteger(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > MAX_FILE_BYTES) {
    return { accepted: false, disposition: "rejected", reason: "INVALID_FILE_SIZE" };
  }
  if (!SCAN_STATES.has(input.scanStatus)) {
    return { accepted: false, disposition: "rejected", reason: "INVALID_SCAN_STATUS" };
  }
  if (input.scanStatus === "infected") {
    return { accepted: false, disposition: "rejected", reason: "MALWARE_DETECTED" };
  }
  if (input.scanStatus !== "clean") {
    return { accepted: false, disposition: "quarantine", reason: "SCAN_NOT_CLEARED" };
  }
  return Object.freeze({
    accepted: true,
    disposition: "private_storage",
    reason: "POLICY_PASSED",
    purpose: input.purpose,
    detectedMimeType: input.detectedMimeType,
    sizeBytes: input.sizeBytes,
  });
}
