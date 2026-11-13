import { SERVICE_CODES } from "../data/service-codes.mjs";

function isPlainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateServiceRequest(input) {
  if (!isPlainRecord(input)) return { success: false, errors: { _root: ["EXPECTED_OBJECT"] } };
  const errors = Object.create(null);
  const allowed = new Set(["name", "phone", "country", "serviceCode", "propertyDistrict", "summary", "consent"]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) errors[key] = ["UNKNOWN_OR_SENSITIVE_FIELD"];
  }
  const data = {};
  const fields = {
    name: { required: true, min: 2, max: 120 },
    propertyDistrict: { required: false, min: 2, max: 80 },
    summary: { required: true, min: 10, max: 2000 },
  };
  for (const [field, rule] of Object.entries(fields)) {
    const raw = input[field];
    if (raw === undefined && !rule.required) continue;
    if (typeof raw !== "string") {
      errors[field] = [...(errors[field] ?? []), rule.required ? "REQUIRED_STRING" : "INVALID_STRING"];
      continue;
    }
    const value = raw.trim();
    if (value.length < rule.min) errors[field] = [...(errors[field] ?? []), "TOO_SHORT"];
    if (value.length > rule.max) errors[field] = [...(errors[field] ?? []), "TOO_LONG"];
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/u.test(value)) errors[field] = [...(errors[field] ?? []), "CONTROL_CHARACTERS_NOT_ALLOWED"];
    data[field] = value;
  }
  if (input.phone !== undefined) {
    if (typeof input.phone !== "string" || input.phone.length > 32 ||
        !/^\+?[0-9 ()-]{7,24}$/u.test(input.phone.trim()) ||
        input.phone.replace(/\D/gu, "").length < 7) {
      errors.phone = ["INVALID_PHONE"];
    } else data.phone = input.phone.trim();
  }
  if (input.country !== undefined) {
    if (typeof input.country !== "string" || !/^[A-Za-z]{2}$/u.test(input.country.trim())) {
      errors.country = ["USE_TWO_LETTER_COUNTRY_CODE"];
    } else data.country = input.country.trim().toUpperCase();
  }
  if (typeof input.serviceCode !== "string" || !SERVICE_CODES.includes(input.serviceCode)) {
    errors.serviceCode = ["UNKNOWN_SERVICE"];
  } else data.serviceCode = input.serviceCode;
  if (input.consent !== true) errors.consent = ["CONSENT_REQUIRED"];
  else data.consent = true;
  if (Object.keys(errors).length) return { success: false, errors };
  return { success: true, data };
}
export { validateServiceRequest };
