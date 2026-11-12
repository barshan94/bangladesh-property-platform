import { SERVICE_CODES } from "../data/service-codes.mjs";

function isPlainRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function addError(errors, field, code) {
  if (!Object.hasOwn(errors, field)) errors[field] = [];
  errors[field].push(code);
}

function validateInquiry(input) {
  if (!isPlainRecord(input)) return { success: false, errors: { _root: ["EXPECTED_OBJECT"] } };

  const errors = Object.create(null);
  const allowed = new Set(["name", "email", "phone", "country", "serviceCode", "propertyDistrict", "message", "consent"]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) addError(errors, key, "UNKNOWN_OR_SENSITIVE_FIELD");
  }

  const data = {};
  const textFields = {
    name: { required: true, min: 2, max: 100 },
    country: { required: false, min: 2, max: 80 },
    propertyDistrict: { required: false, min: 2, max: 80 },
    message: { required: true, min: 15, max: 1500 },
  };

  for (const [field, rule] of Object.entries(textFields)) {
    const raw = input[field];
    if (raw === undefined && !rule.required) continue;
    if (typeof raw !== "string") {
      addError(errors, field, rule.required ? "REQUIRED_STRING" : "INVALID_STRING");
      continue;
    }
    const value = raw.trim();
    if (value.length < rule.min) addError(errors, field, "TOO_SHORT");
    if (value.length > rule.max) addError(errors, field, "TOO_LONG");
    if (/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F\\u007F]/u.test(value)) {
      addError(errors, field, "CONTROL_CHARACTERS_NOT_ALLOWED");
    }
    data[field] = value;
  }

  if (typeof input.email !== "string" || input.email.length > 254 ||
      !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]{2,}$/u.test(input.email.trim())) {
    addError(errors, "email", "INVALID_EMAIL");
  } else data.email = input.email.trim().toLowerCase();

  if (input.phone !== undefined) {
    if (typeof input.phone !== "string" || input.phone.length > 32 ||
        !/^\\+?[0-9 ()-]{7,24}$/u.test(input.phone.trim()) ||
        input.phone.replace(/\\D/gu, "").length < 7) {
      addError(errors, "phone", "INVALID_PHONE");
    } else data.phone = input.phone.trim();
  }

  if (typeof input.serviceCode !== "string" || !SERVICE_CODES.includes(input.serviceCode)) {
    addError(errors, "serviceCode", "UNKNOWN_SERVICE");
  } else data.serviceCode = input.serviceCode;

  if (input.consent !== true) addError(errors, "consent", "CONSENT_REQUIRED");
  else data.consent = true;

  if (Object.keys(errors).length) return { success: false, errors };
  return { success: true, data };
}

export { validateInquiry };
