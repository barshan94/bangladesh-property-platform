import test from "node:test";
import assert from "node:assert/strict";
import { validateListingDraft } from "../src/lib/listing-validation.mjs";

const validDraft = () => ({
  title: "Two bedroom apartment in Dhanmondi",
  description: "A bright apartment with practical access to local services and public transport.",
  propertyType: "apartment",
  listingKind: "sale",
  priceAmount: 12500000,
  priceNegotiable: true,
  district: "Dhaka",
  publicLocationLabel: "Dhanmondi, Dhaka",
  images: [{ src: "/property/cover.webp", alt: "Living room of the apartment" }],
  areaValue: 1250,
  areaUnit: "sqft",
  areaBasis: "built-up",
});

test("accepts valid seller data and trims text", () => {
  const result = validateListingDraft({ ...validDraft(), district: " Dhaka " });
  assert.equal(result.success, true);
  if (result.success) assert.equal(result.data.district, "Dhaka");
});

test("rejects non-object inputs and arrays", () => {
  for (const value of [null, [], "listing", 12]) {
    assert.equal(validateListingDraft(value).success, false);
  }
});

test("rejects missing required fields and invalid enums", () => {
  const draft = validDraft();
  delete draft.title;
  draft.propertyType = "palace";
  draft.listingKind = "lease-to-own";
  const result = validateListingDraft(draft);
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.errors.title);
    assert.ok(result.errors.propertyType);
    assert.ok(result.errors.listingKind);
  }
});

test("rejects zero, negative, infinite and unsafe prices", () => {
  for (const priceAmount of [0, -1, Infinity, NaN, Number.MAX_SAFE_INTEGER + 1]) {
    assert.equal(validateListingDraft({ ...validDraft(), priceAmount }).success, false);
  }
});

test("rejects seller attempts to set server-managed fields", () => {
  for (const field of ["reference", "slug", "currency", "trustLabels", "publishedAt", "updatedAt", "expiresAt", "status", "sellerId"]) {
    const result = validateListingDraft({ ...validDraft(), [field]: "attacker-controlled" });
    assert.equal(result.success, false, field);
    if (!result.success) assert.ok(result.errors[field]);
  }
});

test("requires area value, unit and basis as a complete group", () => {
  const result = validateListingDraft({ ...validDraft(), areaUnit: undefined });
  assert.equal(result.success, false);
  if (!result.success) assert.ok(result.errors.areaValue);
});

test("rejects invalid area, bedroom and bathroom values", () => {
  const result = validateListingDraft({
    ...validDraft(), areaValue: -10, bedrooms: 1.5, bathrooms: -1,
  });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.errors.areaValue);
    assert.ok(result.errors.bedrooms);
    assert.ok(result.errors.bathrooms);
  }
});

test("accepts only HTTPS or same-origin relative image paths", () => {
  for (const src of ["javascript:alert(1)", "data:image/png;base64,abc", "http://example.com/a.jpg", "//evil.example/a.jpg", "/\\\\evil.example/a.jpg", "file:///etc/passwd", "https://user:pass@example.com/a.jpg"]) {
    const result = validateListingDraft({ ...validDraft(), images: [{ src, alt: "Property exterior image" }] });
    assert.equal(result.success, false, src);
  }
  assert.equal(validateListingDraft({ ...validDraft(), images: [{ src: "https://cdn.example.com/a.jpg", alt: "Property exterior image" }] }).success, true);
});

test("rejects excessive images, malformed image objects and weak alt text", () => {
  const result = validateListingDraft({
    ...validDraft(),
    images: Array.from({ length: 13 }, () => ({ src: "/a.jpg", alt: "House photo" })),
  });
  assert.equal(result.success, false);
  if (!result.success) assert.ok(result.errors.images);
  assert.equal(validateListingDraft({ ...validDraft(), images: [{ src: "/a.jpg", alt: "x" }] }).success, false);
});

test("rejects unknown fields and control characters", () => {
  const result = validateListingDraft({ ...validDraft(), admin: true, district: "Dhaka\u0000" });
  assert.equal(result.success, false);
  if (!result.success) {
    assert.ok(result.errors.admin);
    assert.ok(result.errors.district);
  }
});

test("does not mutate the caller input", () => {
  const draft = validDraft();
  const original = structuredClone(draft);
  validateListingDraft(draft);
  assert.deepEqual(draft, original);
});

test("rejects prototype-polluted object shapes without throwing", () => {
  const polluted = Object.create({ isAdmin: true });
  Object.assign(polluted, validDraft());
  assert.equal(validateListingDraft(polluted).success, false);
});
