import test from "node:test";
import assert from "node:assert/strict";
import { createInquiryConsentRecord } from "../src/lib/inquiry-consent-record.mjs";

const valid = () => ({
  consent: true,
  noticeVersion: "2026-11-12.v1",
  acceptedAt: "2026-11-12T10:15:30.000Z",
});

test("creates a minimal record with fixed purpose and channel", () => {
  const result = createInquiryConsentRecord(valid());
  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(result.record, {
      purpose: "public_service_inquiry",
      channel: "website",
      noticeVersion: "2026-11-12.v1",
      acceptedAt: "2026-11-12T10:15:30.000Z",
    });
    assert.equal(Object.isFrozen(result.record), true);
  }
});

test("requires explicit affirmative consent", () => {
  for (const consent of [undefined, false, "yes", 1, null]) {
    assert.deepEqual(createInquiryConsentRecord({ ...valid(), consent }), {
      success: false,
      error: "AFFIRMATIVE_CONSENT_REQUIRED",
    });
  }
});

test("rejects malformed and unbounded notice versions", () => {
  for (const noticeVersion of ["", " ", "../notice", "v".repeat(65), 1, null]) {
    assert.equal(createInquiryConsentRecord({ ...valid(), noticeVersion }).success, false);
  }
});

test("requires a canonical UTC timestamp with milliseconds", () => {
  for (const acceptedAt of [
    "2026-11-12",
    "2026-11-12T10:15:30Z",
    "2026-11-12T11:15:30.000+01:00",
    "not-a-date",
    "2026-02-30T10:15:30.000Z",
    1794488130000,
  ]) {
    assert.equal(createInquiryConsentRecord({ ...valid(), acceptedAt }).success, false);
  }
});

test("rejects unexpected fields including client-controlled purpose and channel", () => {
  for (const extra of [{ purpose: "marketing" }, { channel: "mobile" }, { userId: "client-choice" }]) {
    assert.deepEqual(createInquiryConsentRecord({ ...valid(), ...extra }), {
      success: false,
      error: "UNKNOWN_FIELD",
    });
  }
});

test("rejects non-object and prototype-sensitive inputs without throwing", () => {
  for (const input of [null, [], "consent", 1]) {
    assert.equal(createInquiryConsentRecord(input).success, false);
  }
  const polluted = JSON.parse('{"consent":true,"noticeVersion":"v1","acceptedAt":"2026-11-12T10:15:30.000Z","__proto__":"x"}');
  assert.deepEqual(createInquiryConsentRecord(polluted), {
    success: false,
    error: "UNKNOWN_FIELD",
  });
});

test("does not mutate the supplied input", () => {
  const input = valid();
  const original = structuredClone(input);
  createInquiryConsentRecord(input);
  assert.deepEqual(input, original);
});

test("record does not include personal data or client-supplied identifiers", () => {
  const result = createInquiryConsentRecord(valid());
  assert.equal(result.success, true);
  if (result.success) {
    assert.deepEqual(Object.keys(result.record).sort(), [
      "acceptedAt", "channel", "noticeVersion", "purpose",
    ]);
  }
});
