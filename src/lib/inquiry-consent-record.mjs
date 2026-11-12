const PURPOSE = "public_service_inquiry";
const CHANNEL = "website";
const VERSION_PATTERN = /^[a-z0-9][a-z0-9._-]{0,63}$/iu;

function isPlainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isCanonicalUtcTimestamp(value) {
  if (typeof value !== "string" || value.length > 40) return false;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString() === value;
}

/**
 * Builds a minimal affirmative-consent record from server-controlled policy
 * metadata and a server-generated timestamp. The caller must authenticate the
 * request context, select the currently published notice version, and persist
 * this record atomically with the inquiry.
 */
function createInquiryConsentRecord(input) {
  if (!isPlainRecord(input)) {
    return { success: false, error: "EXPECTED_OBJECT" };
  }

  const allowedKeys = new Set(["consent", "noticeVersion", "acceptedAt"]);
  if (Object.keys(input).some((key) => !allowedKeys.has(key))) {
    return { success: false, error: "UNKNOWN_FIELD" };
  }
  if (input.consent !== true) {
    return { success: false, error: "AFFIRMATIVE_CONSENT_REQUIRED" };
  }
  if (typeof input.noticeVersion !== "string" || !VERSION_PATTERN.test(input.noticeVersion)) {
    return { success: false, error: "INVALID_NOTICE_VERSION" };
  }
  if (!isCanonicalUtcTimestamp(input.acceptedAt)) {
    return { success: false, error: "INVALID_SERVER_TIMESTAMP" };
  }

  return {
    success: true,
    record: Object.freeze({
      purpose: PURPOSE,
      channel: CHANNEL,
      noticeVersion: input.noticeVersion,
      acceptedAt: input.acceptedAt,
    }),
  };
}

export { createInquiryConsentRecord };
