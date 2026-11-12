import test from "node:test";
import assert from "node:assert/strict";
import { evaluateInquiryRateLimit } from "../src/lib/inquiry-rate-limit.mjs";

const base = {
  count: 0,
  limit: 5,
  windowStartedAtMs: 1_000_000,
  nowMs: 1_300_000,
  windowMs: 900_000,
};

test("allows a request below the configured limit and reports post-request remaining count", () => {
  assert.deepEqual(evaluateInquiryRateLimit(base), {
    valid: true,
    allowed: true,
    limit: 5,
    remaining: 4,
    resetAtMs: 1_900_000,
    retryAfterSeconds: 0,
    windowExpired: false,
  });
});

test("allows the final available request with zero remaining", () => {
  const result = evaluateInquiryRateLimit({ ...base, count: 4 });
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 0);
  }
});

test("blocks at the limit and calculates retry time", () => {
  const result = evaluateInquiryRateLimit({ ...base, count: 5 });
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.allowed, false);
    assert.equal(result.remaining, 0);
    assert.equal(result.retryAfterSeconds, 600);
  }
});

test("blocks above the limit without exposing a negative remaining count", () => {
  const result = evaluateInquiryRateLimit({ ...base, count: 9 });
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.allowed, false);
    assert.equal(result.remaining, 0);
  }
});

test("starts a fresh window when the stored window has expired", () => {
  const result = evaluateInquiryRateLimit({
    ...base,
    count: 5,
    nowMs: 1_900_000,
  });
  assert.equal(result.valid, true);
  if (result.valid) {
    assert.equal(result.allowed, true);
    assert.equal(result.remaining, 4);
    assert.equal(result.resetAtMs, 2_800_000);
    assert.equal(result.windowExpired, true);
  }
});

test("treats the exact window end as expired", () => {
  const result = evaluateInquiryRateLimit({ ...base, nowMs: 1_900_000 });
  assert.equal(result.valid, true);
  if (result.valid) assert.equal(result.windowExpired, true);
});

test("rounds retry-after up to a whole second", () => {
  const result = evaluateInquiryRateLimit({
    ...base,
    count: 5,
    nowMs: 1_899_500,
  });
  assert.equal(result.valid, true);
  if (result.valid) assert.equal(result.retryAfterSeconds, 1);
});

test("rejects invalid counts, limits, timestamps and window sizes", () => {
  const invalid = [
    { count: -1 },
    { count: 1.5 },
    { count: Number.MAX_SAFE_INTEGER + 1 },
    { limit: 0 },
    { limit: 1001 },
    { limit: 2.5 },
    { windowStartedAtMs: -1 },
    { nowMs: -1 },
    { windowMs: 999 },
    { windowMs: 86_400_001 },
    { windowMs: 1.5 },
  ];
  for (const override of invalid) {
    assert.equal(evaluateInquiryRateLimit({ ...base, ...override }).valid, false);
  }
});

test("rejects a future window start", () => {
  const result = evaluateInquiryRateLimit({
    ...base,
    windowStartedAtMs: base.nowMs + 1,
  });
  assert.deepEqual(result, { valid: false, reason: "WINDOW_START_IN_FUTURE" });
});

test("rejects timestamp overflow", () => {
  const result = evaluateInquiryRateLimit({
    ...base,
    nowMs: Number.MAX_SAFE_INTEGER - 100,
    windowStartedAtMs: Number.MAX_SAFE_INTEGER - 100,
    windowMs: 900_000,
  });
  assert.deepEqual(result, { valid: false, reason: "INVALID_RATE_LIMIT_STATE" });
});

test("does not mutate the supplied counter state", () => {
  const input = { ...base };
  const original = { ...input };
  evaluateInquiryRateLimit(input);
  assert.deepEqual(input, original);
});
