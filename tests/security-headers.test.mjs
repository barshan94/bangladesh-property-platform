import test from "node:test";
import assert from "node:assert/strict";
import { SECURITY_HEADERS } from "../src/lib/security-headers.mjs";

test("baseline security headers are present with restrictive values", () => {
  const headers = Object.fromEntries(SECURITY_HEADERS.map(({ key, value }) => [key, value]));
  assert.equal(headers["X-Content-Type-Options"], "nosniff");
  assert.equal(headers["X-Frame-Options"], "DENY");
  assert.equal(headers["Referrer-Policy"], "strict-origin-when-cross-origin");
  assert.equal(headers["Permissions-Policy"], "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  assert.equal(headers["Cross-Origin-Opener-Policy"], "same-origin");
});

test("header policy is immutable and contains no duplicate names", () => {
  assert.equal(Object.isFrozen(SECURITY_HEADERS), true);
  assert.ok(SECURITY_HEADERS.every(Object.isFrozen));
  const keys = SECURITY_HEADERS.map(({ key }) => key);
  assert.equal(new Set(keys).size, keys.length);
});
