import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/service-requests/route.ts", import.meta.url), "utf8");
const validator = await readFile(new URL("../src/lib/service-request-validation.mjs", import.meta.url), "utf8");

test("service request identity is derived from the authenticated JWT, not the request body", () => {
  assert.match(route, /session\.auth\.getClaims\(\)/u);
  assert.match(route, /const userId = claims\?\.sub/u);
  assert.match(route, /p_requester_user_id:\s*userId/u);
  assert.doesNotMatch(validator, /requesterUserId|requester_user_id|ownerUserId|userId/u);
});

test("service request contact email is taken from the authenticated claim", () => {
  assert.match(route, /claims\?\.email/u);
  assert.match(route, /p_email_normalized:\s*email/u);
  assert.doesNotMatch(validator, /emailNormalized|email_normalized/u);
});

test("service request validation rejects unknown and sensitive body fields", () => {
  assert.match(validator, /const allowed = new Set\(\["name", "phone", "country", "serviceCode", "propertyDistrict", "summary", "consent"\]\)/u);
  assert.match(validator, /UNKNOWN_OR_SENSITIVE_FIELD/u);
});

test("service request endpoint requires explicit consent and server-selected consent version", () => {
  assert.match(validator, /if \(input\.consent !== true\)/u);
  assert.match(route, /const CONSENT_VERSION = "service-request-v1"/u);
  assert.match(route, /p_consent_version:\s*CONSENT_VERSION/u);
});

test("service request creation uses a server-generated request ID", () => {
  assert.match(route, /p_request_id:\s*randomUUID\(\)/u);
});
