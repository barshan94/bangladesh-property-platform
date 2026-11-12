import test from "node:test";
import assert from "node:assert/strict";
import {
  allowedListingTransitions,
  assertListingTransition,
  canRolePerformListingTransition,
  isAllowedListingTransition,
} from "../src/lib/listing-lifecycle.mjs";

test("seller can submit a draft but cannot approve or publish", () => {
  assert.equal(canRolePerformListingTransition("seller", "draft", "submitted"), true);
  assert.equal(canRolePerformListingTransition("seller", "under_review", "approved"), false);
  assert.equal(canRolePerformListingTransition("seller", "approved", "published"), false);
});

test("reviewer can review and decide but cannot publish", () => {
  assert.equal(canRolePerformListingTransition("listing_reviewer", "submitted", "under_review"), true);
  assert.equal(canRolePerformListingTransition("listing_reviewer", "under_review", "approved"), true);
  assert.equal(canRolePerformListingTransition("listing_reviewer", "approved", "published"), false);
});

test("publisher can publish only an approved listing", () => {
  assert.equal(canRolePerformListingTransition("listing_publisher", "approved", "published"), true);
  assert.equal(canRolePerformListingTransition("listing_publisher", "under_review", "published"), false);
});

test("administrator has no implicit lifecycle bypass", () => {
  assert.equal(canRolePerformListingTransition("administrator", "approved", "published"), false);
});

test("invalid transitions are rejected", () => {
  assert.equal(isAllowedListingTransition("draft", "published"), false);
  assert.equal(isAllowedListingTransition("rejected", "draft"), false);
  assert.throws(
    () => assertListingTransition("seller", "draft", "published"),
    { message: "INVALID_STATE_TRANSITION" },
  );
});

test("forbidden role transitions are rejected even when state transition is valid", () => {
  assert.throws(
    () => assertListingTransition("listing_reviewer", "approved", "published"),
    { message: "FORBIDDEN_LISTING_TRANSITION" },
  );
});

test("terminal states cannot be silently reopened", () => {
  for (const terminal of ["rejected", "withdrawn", "expired", "archived"]) {
    assert.deepEqual(allowedListingTransitions[terminal], []);
  }
});

test("every configured transition has a non-empty destination", () => {
  for (const [from, destinations] of Object.entries(allowedListingTransitions)) {
    for (const to of destinations) {
      assert.equal(isAllowedListingTransition(from, to), true, `${from} -> ${to}`);
    }
  }
});


test("unknown or prototype property names are rejected safely", () => {
  assert.equal(isAllowedListingTransition("toString", "published"), false);
  assert.equal(isAllowedListingTransition("__proto__", "published"), false);
});

test("transition matrix cannot be mutated at runtime", () => {
  assert.equal(Object.isFrozen(allowedListingTransitions), true);
  assert.equal(Object.isFrozen(allowedListingTransitions.draft), true);
});
