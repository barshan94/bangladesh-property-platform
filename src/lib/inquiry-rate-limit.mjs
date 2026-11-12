const MAX_LIMIT = 1000;
const MIN_WINDOW_MS = 1000;
const MAX_WINDOW_MS = 24 * 60 * 60 * 1000;

function isSafeInteger(value) {
  return Number.isSafeInteger(value) && value >= 0;
}

/**
 * Evaluate a fixed-window rate-limit decision from trusted server-side counter data.
 * This function does not read a client-provided identifier, persist counters, or
 * increment them. The API adapter must perform reset/check/increment atomically.
 */
function evaluateInquiryRateLimit({ count, limit, windowStartedAtMs, nowMs, windowMs }) {
  if (!isSafeInteger(count) ||
      !Number.isSafeInteger(limit) || limit < 1 || limit > MAX_LIMIT ||
      !isSafeInteger(windowStartedAtMs) ||
      !isSafeInteger(nowMs) ||
      !Number.isSafeInteger(windowMs) || windowMs < MIN_WINDOW_MS || windowMs > MAX_WINDOW_MS) {
    return { valid: false, reason: "INVALID_RATE_LIMIT_STATE" };
  }

  if (windowStartedAtMs > nowMs) {
    return { valid: false, reason: "WINDOW_START_IN_FUTURE" };
  }

  const windowEndAtMs = windowStartedAtMs + windowMs;
  if (!Number.isSafeInteger(windowEndAtMs)) {
    return { valid: false, reason: "INVALID_RATE_LIMIT_STATE" };
  }

  const isExpired = nowMs >= windowEndAtMs;
  const effectiveCount = isExpired ? 0 : count;
  const resetAtMs = isExpired ? nowMs + windowMs : windowEndAtMs;

  if (!Number.isSafeInteger(resetAtMs)) {
    return { valid: false, reason: "INVALID_RATE_LIMIT_STATE" };
  }

  const allowed = effectiveCount < limit;
  const retryAfterSeconds = allowed
    ? 0
    : Math.max(1, Math.ceil((resetAtMs - nowMs) / 1000));

  return {
    valid: true,
    allowed,
    limit,
    remaining: allowed ? limit - effectiveCount - 1 : 0,
    resetAtMs,
    retryAfterSeconds,
    windowExpired: isExpired,
  };
}

export { evaluateInquiryRateLimit };
