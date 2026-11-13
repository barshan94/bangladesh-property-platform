/**
 * Domain-only policy for publishing listing images.
 *
 * This helper is not an authorization boundary. Production callers must still
 * use a database RPC that verifies the authenticated actor against current
 * role rows, applies the transition under a row lock, and writes the audit
 * event in the same transaction.
 */

const PUBLISHER_ROLES = new Set(["listing_publisher", "administrator"]);
const REASONS = Object.freeze({ min: 5, max: 1000 });

/**
 * @param {unknown} value
 * @returns {value is string}
 */
function hasReason(value) {
  return typeof value === "string" &&
    value.trim().length >= REASONS.min &&
    value.length <= REASONS.max &&
    !/[\x00-\x1f\x7f]/.test(value);
}

/**
 * Validate a requested media publication state transition.
 *
 * @param {{
 *  actorId: unknown,
 *  ownerUserId: unknown,
 *  claimRoles: unknown,
 *  activeRoles: unknown,
 *  moderationStatus: unknown,
 *  publicationStatus: unknown,
 *  decision: unknown,
 *  reason: unknown
 * }} input
 */
export function canChangeListingMediaPublication(input) {
  if (!input || typeof input !== "object") return false;
  const {
    actorId,
    ownerUserId,
    claimRoles,
    activeRoles,
    moderationStatus,
    publicationStatus,
    decision,
    reason,
  } = input;

  if (typeof actorId !== "string" || actorId.length === 0 || actorId !== actorId.trim()) return false;
  if (typeof ownerUserId !== "string" || ownerUserId.length === 0 || ownerUserId !== ownerUserId.trim()) return false;
  if (actorId === ownerUserId) return false;
  if (!Array.isArray(claimRoles) || !Array.isArray(activeRoles)) return false;
  if (decision !== "published" && decision !== "unpublished") return false;
  const hasActivePublisherRole = claimRoles.some(
    (role) => PUBLISHER_ROLES.has(role) && activeRoles.includes(role),
  );
  if (!hasActivePublisherRole) return false;
  if (!hasReason(reason)) return false;
  if (moderationStatus !== "approved") return false;

  return (
    (publicationStatus === "unpublished" && decision === "published") ||
    (publicationStatus === "published" && decision === "unpublished")
  );
}

/**
 * A public media response is allowed only while both independent publication
 * decisions remain current.
 *
 * @param {{moderationStatus: unknown, publicationStatus: unknown, listingStatus: unknown}} input
 */
export function canServeListingMediaPublicly(input) {
  return Boolean(
    input &&
    input.moderationStatus === "approved" &&
    input.publicationStatus === "published" &&
    input.listingStatus === "published"
  );
}
