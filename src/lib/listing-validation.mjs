const PROPERTY_TYPES = new Set(["apartment", "house", "land", "commercial", "industrial", "other"]);
const LISTING_KINDS = new Set(["sale", "rent"]);
const AREA_UNITS = new Set(["sqft", "katha", "decimal", "acre", "sqm"]);
const AREA_BASES = new Set(["land", "built-up", "floor"]);
const SELLER_FIELDS = new Set([
  "title", "description", "propertyType", "listingKind", "priceAmount",
  "priceNegotiable", "areaValue", "areaUnit", "areaBasis", "bedrooms",
  "bathrooms", "district", "upazila", "locality", "publicLocationLabel", "images",
]);
const TEXT_RULES = {
  title: [8, 120],
  description: [30, 5000],
  district: [2, 80],
  upazila: [2, 100],
  locality: [2, 160],
  publicLocationLabel: [3, 180],
};

function isRecord(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function addError(errors, field, code) {
  (errors[field] ??= []).push(code);
}

function validateText(input, field, required, errors) {
  if (input === undefined && !required) return undefined;
  if (typeof input !== "string") {
    addError(errors, field, required ? "REQUIRED_STRING" : "INVALID_STRING");
    return undefined;
  }
  const value = input.trim();
  const [min, max] = TEXT_RULES[field];
  if (value.length < min) addError(errors, field, "TOO_SHORT");
  if (value.length > max) addError(errors, field, "TOO_LONG");
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/u.test(value)) {
    addError(errors, field, "CONTROL_CHARACTERS_NOT_ALLOWED");
  }
  return value;
}

function validateListingDraft(input) {
  if (!isRecord(input)) {
    return { success: false, errors: { _root: ["EXPECTED_OBJECT"] } };
  }

  const errors = {};
  for (const key of Object.keys(input)) {
    if (!SELLER_FIELDS.has(key)) addError(errors, key, "UNKNOWN_OR_SERVER_MANAGED_FIELD");
  }

  const data = {};
  for (const [field, [min]] of Object.entries(TEXT_RULES)) {
    const value = validateText(input[field], field, ["title", "description", "district", "publicLocationLabel"].includes(field), errors);
    if (value !== undefined) data[field] = value;
    void min;
  }

  if (!PROPERTY_TYPES.has(input.propertyType)) addError(errors, "propertyType", "INVALID_PROPERTY_TYPE");
  else data.propertyType = input.propertyType;

  if (!LISTING_KINDS.has(input.listingKind)) addError(errors, "listingKind", "INVALID_LISTING_KIND");
  else data.listingKind = input.listingKind;

  if (typeof input.priceAmount !== "number" || !Number.isFinite(input.priceAmount) || input.priceAmount <= 0 || input.priceAmount > Number.MAX_SAFE_INTEGER) {
    addError(errors, "priceAmount", "INVALID_PRICE_AMOUNT");
  } else data.priceAmount = input.priceAmount;

  if (typeof input.priceNegotiable !== "boolean") addError(errors, "priceNegotiable", "REQUIRED_BOOLEAN");
  else data.priceNegotiable = input.priceNegotiable;

  if (input.areaValue !== undefined) {
    if (typeof input.areaValue !== "number" || !Number.isFinite(input.areaValue) || input.areaValue <= 0) {
      addError(errors, "areaValue", "INVALID_AREA_VALUE");
    } else data.areaValue = input.areaValue;
  }
  if (input.areaUnit !== undefined) {
    if (!AREA_UNITS.has(input.areaUnit)) addError(errors, "areaUnit", "INVALID_AREA_UNIT");
    else data.areaUnit = input.areaUnit;
  }
  if (input.areaBasis !== undefined) {
    if (!AREA_BASES.has(input.areaBasis)) addError(errors, "areaBasis", "INVALID_AREA_BASIS");
    else data.areaBasis = input.areaBasis;
  }
  if ((input.areaValue !== undefined || input.areaUnit !== undefined || input.areaBasis !== undefined) &&
      (input.areaValue === undefined || input.areaUnit === undefined || input.areaBasis === undefined)) {
    addError(errors, "areaValue", "AREA_VALUE_UNIT_AND_BASIS_MUST_BE_PROVIDED_TOGETHER");
  }

  for (const field of ["bedrooms", "bathrooms"]) {
    if (input[field] === undefined) continue;
    if (!Number.isInteger(input[field]) || input[field] < 0 || input[field] > 100) {
      addError(errors, field, "INVALID_NON_NEGATIVE_INTEGER");
    } else data[field] = input[field];
  }

  if (!Array.isArray(input.images)) {
    addError(errors, "images", "REQUIRED_ARRAY");
  } else {
    if (input.images.length > 12) addError(errors, "images", "TOO_MANY_IMAGES");
    data.images = [];
    input.images.forEach((image, index) => {
      const field = `images[${index}]`;
      if (!isRecord(image) || Object.keys(image).some((key) => !["src", "alt"].includes(key))) {
        addError(errors, field, "INVALID_IMAGE_OBJECT");
        return;
      }
      if (typeof image.src !== "string" || image.src.length > 2048) {
        addError(errors, `${field}.src`, "INVALID_IMAGE_SOURCE");
        return;
      }
      const src = image.src.trim();
      let safeSource = src.startsWith("/") && !src.startsWith("//");
      if (!safeSource) {
        try {
          const url = new URL(src);
          safeSource = url.protocol === "https:" && !url.username && !url.password;
        } catch {
          safeSource = false;
        }
      }
      if (!safeSource) addError(errors, `${field}.src`, "IMAGE_SOURCE_MUST_BE_HTTPS_OR_LOCAL_PATH");
      if (typeof image.alt !== "string" || image.alt.trim().length < 5 || image.alt.trim().length > 180) {
        addError(errors, `${field}.alt`, "INVALID_IMAGE_ALT");
      }
      if (safeSource && typeof image.alt === "string" && image.alt.trim().length >= 5 && image.alt.trim().length <= 180) {
        data.images.push({ src, alt: image.alt.trim() });
      }
    });
  }

  if (Object.keys(errors).length > 0) return { success: false, errors };
  return { success: true, data };
}

export { validateListingDraft };
