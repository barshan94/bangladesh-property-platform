import test from "node:test";
import assert from "node:assert/strict";
import {
  canChangeListingMediaPublication,
  canServeListingMediaPublicly,
} from "../src/lib/listing-media-publication.mjs";

const base = {
  actorId: "publisher-user",
  ownerUserId: "seller-user",
  claimRoles: ["listing_publisher"],
  activeRoles: ["listing_publisher"],
  moderationStatus: "approved",
  publicationStatus: "unpublished",
  decision: "published",
  reason: "Approved for public listing display",
};

test("active publisher can publish approved media owned by another user", () => {
  assert.equal(canChangeListingMediaPublication(base), true);
});

test("active administrator can publish approved media", () => {
  assert.equal(canChangeListingMediaPublication({
    ...base,
    claimRoles: ["administrator"],
    activeRoles: ["administrator"],
  }), true);
});

test("reviewer-only and ordinary users cannot publish", () => {
  for (const role of ["listing_reviewer", "seller", "buyer"]) {
    assert.equal(canChangeListingMediaPublication({
      ...base,
      claimRoles: [role],
      activeRoles: [role],
    }), false);
  }
});

test("stale JWT role without a matching active database role is denied", () => {
  assert.equal(canChangeListingMediaPublication({
    ...base,
    activeRoles: [],
  }), false);
});

test("media owner cannot publish their own upload", () => {
  assert.equal(canChangeListingMediaPublication({
    ...base,
    ownerUserId: base.actorId,
  }), false);
});

test("only approved media can be published or unpublished", () => {
  for (const moderationStatus of ["pending", "rejected"]) {
    assert.equal(canChangeListingMediaPublication({
      ...base,
      moderationStatus,
    }), false);
  }
});

test("publication decisions must be valid one-way toggles", () => {
  assert.equal(canChangeListingMediaPublication({
    ...base,
    publicationStatus: "published",
    decision: "published",
  }), false);
  assert.equal(canChangeListingMediaPublication({
    ...base,
    publicationStatus: "unpublished",
    decision: "unpublished",
  }), false);
  assert.equal(canChangeListingMediaPublication({
    ...base,
    publicationStatus: "archived",
    decision: "published",
  }), false);
  assert.equal(canChangeListingMediaPublication({
    ...base,
    publicationStatus: "published",
    decision: "unpublished",
  }), true);
});

test("publication reason is mandatory, bounded and control-character free", () => {
  for (const reason of ["", "no", "     ", "valid\nreason", "x".repeat(1001)]) {
    assert.equal(canChangeListingMediaPublication({
      ...base,
      reason,
    }), false);
  }
});

test("public media requires moderation, media publication and listing publication", () => {
  assert.equal(canServeListingMediaPublicly({
    moderationStatus: "approved",
    publicationStatus: "published",
    listingStatus: "published",
  }), true);
  assert.equal(canServeListingMediaPublicly({
    moderationStatus: "pending",
    publicationStatus: "published",
    listingStatus: "published",
  }), false);
  assert.equal(canServeListingMediaPublicly({
    moderationStatus: "approved",
    publicationStatus: "unpublished",
    listingStatus: "published",
  }), false);
  assert.equal(canServeListingMediaPublicly({
    moderationStatus: "approved",
    publicationStatus: "published",
    listingStatus: "withdrawn",
  }), false);
  assert.equal(canServeListingMediaPublicly({
    moderationStatus: "approved",
    publicationStatus: "published",
    listingStatus: "expired",
  }), false);
});
