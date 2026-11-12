import test from "node:test";
import assert from "node:assert/strict";
import { createListingStatusEvent } from "../src/lib/listing-status-event.mjs";
const valid = { listingId:"listing_123", actorId:"staff_456", actorRole:"listing_reviewer",
  fromStatus:"under_review", toStatus:"approved", reason:"Authority evidence reviewed.",
  occurredAt:"2026-11-12T13:30:00.000Z", requestId:"req_789" };

test("creates an immutable event for an authorized transition", () => {
  const event=createListingStatusEvent(valid);
  assert.equal(event.eventType,"listing.status_changed");
  assert.equal(Object.isFrozen(event),true);
});
test("rejects forbidden roles and invalid transitions", () => {
  assert.throws(()=>createListingStatusEvent({...valid,actorRole:"seller"}),{message:"FORBIDDEN_LISTING_TRANSITION"});
  assert.throws(()=>createListingStatusEvent({...valid,toStatus:"published"}),{message:"INVALID_STATE_TRANSITION"});
});
test("requires a reason for reviewer decisions", () => {
  assert.throws(()=>createListingStatusEvent({...valid,reason:undefined}),{message:"DECISION_REASON_REQUIRED"});
});
test("allows seller submission without a reason", () => {
  const event=createListingStatusEvent({...valid,actorRole:"seller",fromStatus:"draft",toStatus:"submitted",reason:undefined});
  assert.equal(event.reason,null);
});
test("rejects unexpected fields and malformed identifiers", () => {
  assert.throws(()=>createListingStatusEvent({...valid,status:"published"}),{message:"UNEXPECTED_EVENT_FIELD"});
  assert.throws(()=>createListingStatusEvent({...valid,actorId:"bad id"}),{message:"INVALID_ACTOR_ID"});
});
test("rejects non-canonical timestamps and invalid calendar dates", () => {
  assert.throws(()=>createListingStatusEvent({...valid,occurredAt:"2026-11-12T13:30:00Z"}),{message:"INVALID_OCCURRED_AT"});
  assert.throws(()=>createListingStatusEvent({...valid,occurredAt:"2026-02-30T13:30:00.000Z"}),{message:"INVALID_OCCURRED_AT"});
});
test("rejects control characters and does not mutate input", () => {
  assert.throws(()=>createListingStatusEvent({...valid,reason:"bad\u0000reason"}),{message:"INVALID_REASON"});
  const input={...valid}; createListingStatusEvent(input); assert.deepEqual(input,valid);
});
