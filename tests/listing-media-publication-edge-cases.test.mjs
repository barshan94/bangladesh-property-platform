import test from "node:test";
import assert from "node:assert/strict";
import {
  canChangeListingMediaPublication,
  canServeListingMediaPublicly,
} from "../src/lib/listing-media-publication.mjs";

const valid = {
  actorId: "publisher-user",
  ownerUserId: "seller-user",
  claimRoles: ["listing_publisher"],
  activeRoles: ["listing_publisher"],
  moderationStatus: "approved",
  publicationStatus: "unpublished",
  decision: "published",
  reason: "Approved for public listing display",
};

test("publication policy fails closed for null, arrays and primitive input", () => {
  for (const input of [null, undefined, [], "valid", 1, true]) {
    assert.equal(canChangeListingMediaPublication(input), false);
  }
});

test("publication policy requires non-empty string identities", () => {
  for (const patch of [
    { actorId: "" },
    { actorId: "   " },
    { actorId: null },
    { actorId: 7 },
    { ownerUserId: "" },
    { ownerUserId: "\t " },
    { ownerUserId: null },
    { ownerUserId: {} },
  ]) {
    assert.equal(canChangeListingMediaPublication({ ...valid, ...patch }), false);
  }
});

test("role claim and current active role must intersect on an allowed role", () => {
  const cases = [
    { claimRoles: ["listing_publisher"], activeRoles: ["administrator"] },
    { claimRoles: ["listing_reviewer"], activeRoles: ["listing_publisher"] },
    { claimRoles: ["administrator"], activeRoles: ["listing_reviewer"] },
    { claimRoles: "listing_publisher", activeRoles: ["listing_publisher"] },
    { claimRoles: ["listing_publisher"], activeRoles: "listing_publisher" },
  ];
  for (const patch of cases) {
    assert.equal(canChangeListingMediaPublication({ ...valid, ...patch }), false);
  }
});

test("reason rejects all ASCII control characters and overlong values", () => {
  for (const control of ["\u0000", "\u0008", "\u0009", "\u000a", "\u000d", "\u001f", "\u007f"]) {
    assert.equal(canChangeListingMediaPublication({
      ...valid,
      reason: `valid reason${control}tail`,
    }), false);
  }
  assert.equal(canChangeListingMediaPublication({
    ...valid,
    reason: "x".repeat(1001),
  }), false);
});

test("public delivery policy fails closed for missing or malformed state", () => {
  for (const input of [null, undefined, [], "published", {}]) {
    assert.equal(canServeListingMediaPublicly(input), false);
  }
  for (const patch of [
    { moderationStatus: "approved", publicationStatus: "published" },
    { moderationStatus: "approved", publicationStatus: "published", listingStatus: null },
    { moderationStatus: "approved", publicationStatus: "pending", listingStatus: "published" },
    { moderationStatus: "rejected", publicationStatus: "published", listingStatus: "published" },
  ]) {
    assert.equal(canServeListingMediaPublicly(patch), false);
  }
});
