import test from "node:test";
import assert from "node:assert/strict";
import { validateServiceRequest } from "../src/lib/service-request-validation.mjs";

const validRequest = () => ({
  name: "Test Buyer",
  phone: "+880 1712 345678",
  country: "BD",
  serviceCode: "title-and-record-review",
  propertyDistrict: "Dhaka",
  summary: "Please help verify the documents for a property.",
  consent: true,
});

test("service request validator accepts a valid allowlisted request", () => {
  const result = validateServiceRequest(validRequest());
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, "Test Buyer");
    assert.equal(result.data.country, "BD");
    assert.equal(result.data.consent, true);
  }
});

test("service request text rejects C0, DEL and C1 control characters", () => {
  for (const control of ["\u0001", "\u007f", "\u0085", "\u009f"]) {
    const result = validateServiceRequest({ ...validRequest(), summary: `Invalid ${control} text in request.` });
    assert.equal(result.success, false, `Expected control U+${control.codePointAt(0).toString(16)} to be rejected`);
    if (!result.success) assert.ok(result.errors.summary?.includes("CONTROL_CHARACTERS_NOT_ALLOWED"));
  }
});

test("service request validator rejects unknown and caller-controlled identity fields", () => {
  for (const field of ["userId", "requesterUserId", "email", "emailNormalized", "ownerUserId"]) {
    const result = validateServiceRequest({ ...validRequest(), [field]: "attacker-controlled" });
    assert.equal(result.success, false, `Expected ${field} to be rejected`);
    if (!result.success) assert.ok(result.errors[field]?.includes("UNKNOWN_OR_SENSITIVE_FIELD"));
  }
});

test("service request validator rejects missing consent and invalid service codes", () => {
  assert.equal(validateServiceRequest({ ...validRequest(), consent: false }).success, false);
  assert.equal(validateServiceRequest({ ...validRequest(), serviceCode: "admin_override" }).success, false);
});

test("service request validator rejects non-plain objects", () => {
  const inherited = Object.assign(Object.create({ consent: true }), validRequest());
  assert.equal(validateServiceRequest(inherited).success, false);
  assert.equal(validateServiceRequest(null).success, false);
  assert.equal(validateServiceRequest([]).success, false);
});
