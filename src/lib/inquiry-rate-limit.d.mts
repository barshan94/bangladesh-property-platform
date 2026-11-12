export type InquiryRateLimitDecision =
  | {
      valid: false;
      reason: "INVALID_RATE_LIMIT_STATE" | "WINDOW_START_IN_FUTURE";
    }
  | {
      valid: true;
      allowed: boolean;
      limit: number;
      remaining: number;
      resetAtMs: number;
      retryAfterSeconds: number;
      windowExpired: boolean;
    };

export declare function evaluateInquiryRateLimit(input: {
  /** Trusted count read from the server-side rate-limit store. */
  count: number;
  /** Server-configured maximum requests per window (1–1000). */
  limit: number;
  /** Trusted start timestamp for the stored fixed window, in Unix milliseconds. */
  windowStartedAtMs: number;
  /** Current server time in Unix milliseconds. */
  nowMs: number;
  /** Server-configured window duration (1 second–24 hours). */
  windowMs: number;
}): InquiryRateLimitDecision;
