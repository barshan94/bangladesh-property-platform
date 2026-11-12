import test from "node:test";
import assert from "node:assert/strict";
import { validateInquiry } from "../src/lib/inquiry-validation.mjs";

const validInquiry = () => ({
  name: "Amina Rahman",
  email: "AMINA@example.com",
  phone: "+880 1712-345678",
  country: "United Kingdom",
  serviceCode: "inheritance-and-succession",
  propertyDistrict: "Sylhet",
  message: "I need an initial discussion about inherited family property in Bangladesh.",
  consent: true,
});

test("accepts a minimal valid inquiry and normalizes email", () => {
  const result = validateInquiry(validInquiry());
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.email, "amina@example.com");
});

test("rejects non-object inputs", () => {
  for (const input of [null, [], "hello", 4]) assert.equal(validateInquiry(input).success, false);
});

test("requires a valid email and service code", () => {
  const result = validateInquiry({ ...validInquiry(), email: "not-an-email", serviceCode: "legal-guarantee" });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.errors.email);
    assert.ok(result.errors.serviceCode);
  }
});

test("requires affirmative consent", () => {
  for (const consent of [undefined, false, "yes", 1]) {
    const result = validateInquiry({ ...validInquiry(), consent });
    assert.equal(result.success, false);
  }
});

test("rejects unbounded or malformed phone values", () => {
  for (const phone of ["123", "letters-only", "+880" + "1".repeat(40)]) {
    assert.equal(validateInquiry({ ...validInquiry(), phone }).success, false);
  }
});

test("allows phone to be omitted", () => {
  const input = validInquiry();
  delete input.phone;
  assert.equal(validateInquiry(input).success, true);
});

test("rejects oversized and too-short message/name fields", () => {
  assert.equal(validateInquiry({ ...validInquiry(), name: "A", message: "help me" }).success, false);
  assert.equal(validateInquiry({ ...validInquiry(), message: "x".repeat(1501) }).success, false);
});

test("rejects confidential and unexpected fields", () => {
  for (const field of ["passportNumber", "nid", "deedText", "attachments", "documents", "admin"]) {
    const result = validateInquiry({ ...validInquiry(), [field]: "private data" });
    assert.equal(result.success, false, field);
    if (!result.success) assert.ok(result.errors[field]);
  }
});

test("rejects control characters and trims public text", () => {
  const result = validateInquiry({ ...validInquiry(), name: "  Amina Rahman  ", message: "A sufficiently long message\u0000 with invalid control." });
  assert.equal(result.success, false);
  if (!result.success) assert.ok(result.errors.message);
  const clean = validateInquiry({ ...validInquiry(), name: "  Amina Rahman  " });
  assert.equal(clean.success, true);
  if (clean.success) assert.equal(clean.data.name, "Amina Rahman");
});

test("does not mutate the original request", () => {
  const input = validInquiry();
  const original = structuredClone(input);
  validateInquiry(input);
  assert.deepEqual(input, original);
});


test("rejects prototype-sensitive unknown keys without throwing", () => {
  for (const key of ["__proto__", "constructor", "toString"]) {
    const input = JSON.parse(`{"name":"Amina Rahman","email":"amina@example.com","serviceCode":"inheritance-and-succession","message":"I need an initial discussion about inherited property.","consent":true,"${key}":"unexpected"}`);
    const result = validateInquiry(input);
    assert.equal(result.success, false);
    if (!result.success) {
      assert.equal(Object.hasOwn(result.errors, key), true);
      assert.deepEqual(result.errors[key], ["UNKNOWN_OR_SENSITIVE_FIELD"]);
    }
  }
});
