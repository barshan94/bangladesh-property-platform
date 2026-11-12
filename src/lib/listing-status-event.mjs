import { assertListingTransition } from "./listing-lifecycle.mjs";

const allowed = new Set(["listingId","actorId","actorRole","fromStatus","toStatus","reason","occurredAt","requestId"]);
const idPattern = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/u;
const controls = /[\u0000-\u0008\u000B\u000C-\u001F\u007F]/u;

export function createListingStatusEvent(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input) ||
      (Object.getPrototypeOf(input) !== Object.prototype && Object.getPrototypeOf(input) !== null)) {
    throw new Error("INVALID_EVENT_INPUT");
  }
  if (Object.keys(input).some((key) => !allowed.has(key))) throw new Error("UNEXPECTED_EVENT_FIELD");
  for (const [field, value] of [["listing_id", input.listingId], ["actor_id", input.actorId], ["request_id", input.requestId]]) {
    if (typeof value !== "string" || !idPattern.test(value)) throw new Error(`INVALID_${field.toUpperCase()}`);
  }
  if (typeof input.actorRole !== "string") throw new Error("INVALID_ACTOR_ROLE");
  if (typeof input.fromStatus !== "string" || typeof input.toStatus !== "string") throw new Error("INVALID_STATUS");
  assertListingTransition(input.actorRole, input.fromStatus, input.toStatus);
  if (typeof input.occurredAt !== "string" ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u.test(input.occurredAt) ||
      new Date(input.occurredAt).toISOString() !== input.occurredAt) throw new Error("INVALID_OCCURRED_AT");
  let reason = null;
  if (input.reason !== undefined) {
    if (typeof input.reason !== "string") throw new Error("INVALID_REASON");
    reason = input.reason.trim();
    if (!reason || reason.length > 1000 || controls.test(reason)) throw new Error("INVALID_REASON");
  }
  if (input.actorRole === "listing_reviewer" && input.fromStatus === "under_review" &&
      ["changes_requested", "approved", "rejected"].includes(input.toStatus) && !reason) {
    throw new Error("DECISION_REASON_REQUIRED");
  }
  return Object.freeze({
    eventType:"listing.status_changed", listingId:input.listingId, actorId:input.actorId,
    actorRole:input.actorRole, fromStatus:input.fromStatus, toStatus:input.toStatus,
    reason, occurredAt:input.occurredAt, requestId:input.requestId,
  });
}
