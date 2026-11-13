import test from "node:test";
import assert from "node:assert/strict";
import { safeInternalRedirect } from "../src/lib/safe-redirect.mjs";

const origin = "https://platform.example";

test("accepts safe same-origin callback destinations", () => {
  assert.equal(safeInternalRedirect("/dashboard", origin), "/dashboard");
  assert.equal(safeInternalRedirect("/dashboard/listings?tab=draft#recent", origin), "/dashboard/listings?tab=draft#recent");
});

test("rejects external, protocol-relative and malformed callback destinations", () => {
  for (const value of [
    null,
    "",
    "dashboard",
    "https://evil.example/path",
    "//evil.example/path",
    "/\\\\evil.example/path",
    "/\\\\@evil.example/path",
  ]) {
    assert.equal(safeInternalRedirect(value, origin), "/dashboard", String(value));
  }
});
