/**
 * Domain policy for non-confidential initial service inquiries.
 *
 * This module is not an authentication, assignment, or persistence layer.
 * A server must authenticate the actor, derive their role and assignment
 * from trusted records, load the current state, and persist the transition
 * plus an append-only event atomically.
 */

const TRANSITIONS = Object.freeze({
  new: Object.freeze(["triaged", "spam", "closed"]),
  triaged: Object.freeze(["assigned", "waiting_on_client", "spam", "closed"]),
  assigned: Object.freeze(["in_progress", "waiting_on_client", "closed"]),
  in_progress: Object.freeze(["waiting_on_client", "resolved"]),
  waiting_on_client: Object.freeze(["in_progress", "resolved", "closed"]),
  resolved: Object.freeze(["closed"]),
  closed: Object.freeze([]),
  spam: Object.freeze([]),
});

const ROLES = Object.freeze({
  intake_coordinator: "intake_coordinator",
  case_manager: "case_manager",
  administrator: "administrator",
});

const ROLE_TRANSITIONS = Object.freeze({
  intake_coordinator: Object.freeze({
    new: Object.freeze(["triaged", "spam", "closed"]),
    triaged: Object.freeze(["assigned", "waiting_on_client", "spam", "closed"]),
    assigned: Object.freeze(["closed"]),
    waiting_on_client: Object.freeze(["closed"]),
  }),
  case_manager: Object.freeze({
    assigned: Object.freeze(["in_progress", "waiting_on_client", "closed"]),
    in_progress: Object.freeze(["waiting_on_client", "resolved"]),
    waiting_on_client: Object.freeze(["in_progress", "resolved", "closed"]),
    resolved: Object.freeze(["closed"]),
  }),
  administrator: Object.freeze({}),
});

function isAllowedServiceRequestTransition(from, to) {
  return Object.hasOwn(TRANSITIONS, from) &&
    Array.isArray(TRANSITIONS[from]) &&
    TRANSITIONS[from].includes(to);
}

function canRolePerformServiceRequestTransition(role, from, to) {
  if (!Object.hasOwn(ROLE_TRANSITIONS, role) ||
      !Object.hasOwn(TRANSITIONS, from) ||
      !isAllowedServiceRequestTransition(from, to)) return false;
  const destinations = ROLE_TRANSITIONS[role][from];
  return Array.isArray(destinations) && destinations.includes(to);
}

function assertServiceRequestTransition(role, from, to) {
  if (!isAllowedServiceRequestTransition(from, to)) {
    throw new Error("INVALID_SERVICE_REQUEST_TRANSITION");
  }
  if (!canRolePerformServiceRequestTransition(role, from, to)) {
    throw new Error("FORBIDDEN_SERVICE_REQUEST_TRANSITION");
  }
  return true;
}

export {
  TRANSITIONS as serviceRequestTransitions,
  ROLES as serviceRequestRoles,
  isAllowedServiceRequestTransition,
  canRolePerformServiceRequestTransition,
  assertServiceRequestTransition,
};
