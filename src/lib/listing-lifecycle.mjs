/**
 * Server-side listing lifecycle policy.
 *
 * This module contains domain rules only. Callers must still authenticate the
 * actor, load the listing from trusted storage, authorize access, and persist
 * the transition and audit event atomically in a database transaction.
 *
 * @typedef {"draft"|"submitted"|"under_review"|"changes_requested"|"approved"|"published"|"rejected"|"withdrawn"|"expired"|"archived"} ListingStatus
 * @typedef {"seller"|"listing_reviewer"|"listing_publisher"|"administrator"} ListingActorRole
 */

/** @type {Record<ListingStatus, readonly ListingStatus[]>} */
export const allowedListingTransitions = Object.freeze({
  draft: Object.freeze(["submitted"]),
  submitted: Object.freeze(["under_review"]),
  under_review: Object.freeze(["changes_requested", "approved", "rejected"]),
  changes_requested: Object.freeze(["submitted", "withdrawn"]),
  approved: Object.freeze(["published", "withdrawn", "expired"]),
  published: Object.freeze(["withdrawn", "expired", "archived"]),
  rejected: Object.freeze([]),
  withdrawn: Object.freeze([]),
  expired: Object.freeze([]),
  archived: Object.freeze([]),
});

/**
 * @param {ListingStatus} from
 * @param {ListingStatus} to
 */
export function isAllowedListingTransition(from, to) {
  if (!Object.hasOwn(allowedListingTransitions, from)) return false;
  return allowedListingTransitions[from].includes(to);
}

/**
 * Role permissions are intentionally narrower than the transition matrix.
 * Reopening rejected/withdrawn/expired listings requires a new submission
 * workflow; no direct transition is allowed here.
 *
 * @param {ListingActorRole} role
 * @param {ListingStatus} from
 * @param {ListingStatus} to
 */
export function canRolePerformListingTransition(role, from, to) {
  if (!isAllowedListingTransition(from, to)) return false;

  if (role === "seller") {
    return (
      (from === "draft" && to === "submitted") ||
      (from === "changes_requested" && ["submitted", "withdrawn"].includes(to))
    );
  }

  if (role === "listing_reviewer") {
    return (
      from === "submitted" && to === "under_review" ||
      from === "under_review" && ["changes_requested", "approved", "rejected"].includes(to)
    );
  }

  if (role === "listing_publisher") {
    return (
      from === "approved" && ["published", "withdrawn", "expired"].includes(to) ||
      from === "published" && ["withdrawn", "expired", "archived"].includes(to)
    );
  }

  // Administrator is not an implicit bypass for reviewer/publisher separation.
  return false;
}

/**
 * @param {ListingActorRole} role
 * @param {ListingStatus} from
 * @param {ListingStatus} to
 */
export function assertListingTransition(role, from, to) {
  if (!isAllowedListingTransition(from, to)) {
    throw new Error("INVALID_STATE_TRANSITION");
  }
  if (!canRolePerformListingTransition(role, from, to)) {
    throw new Error("FORBIDDEN_LISTING_TRANSITION");
  }
}
