import test from "node:test";
import assert from "node:assert/strict";
import {
  serviceRequestTransitions,
  isAllowedServiceRequestTransition,
  canRolePerformServiceRequestTransition,
  assertServiceRequestTransition,
} from "../src/lib/service-request-lifecycle.mjs";

test("new inquiries can be triaged, marked spam, or closed", () => {
  for (const to of ["triaged", "spam", "closed"]) {
    assert.equal(isAllowedServiceRequestTransition("new", to), true);
    assert.equal(canRolePerformServiceRequestTransition("intake_coordinator", "new", to), true);
  }
});

test("intake coordinators can route triaged requests but cannot resolve case work", () => {
  for (const to of ["assigned", "waiting_on_client", "spam", "closed"]) {
    assert.equal(canRolePerformServiceRequestTransition("intake_coordinator", "triaged", to), true);
  }
  assert.equal(canRolePerformServiceRequestTransition("intake_coordinator", "assigned", "in_progress"), false);
  assert.equal(canRolePerformServiceRequestTransition("intake_coordinator", "in_progress", "resolved"), false);
});

test("case managers can work only from assigned or active states", () => {
  assert.equal(canRolePerformServiceRequestTransition("case_manager", "assigned", "in_progress"), true);
  assert.equal(canRolePerformServiceRequestTransition("case_manager", "in_progress", "resolved"), true);
  assert.equal(canRolePerformServiceRequestTransition("case_manager", "waiting_on_client", "in_progress"), true);
  assert.equal(canRolePerformServiceRequestTransition("case_manager", "resolved", "closed"), true);
  assert.equal(canRolePerformServiceRequestTransition("case_manager", "new", "triaged"), false);
});

test("administrator has no implicit lifecycle bypass", () => {
  for (const [from, destinations] of Object.entries(serviceRequestTransitions)) {
    for (const to of destinations) {
      assert.equal(canRolePerformServiceRequestTransition("administrator", from, to), false);
    }
  }
});

test("closed and spam are terminal states", () => {
  for (const from of ["closed", "spam"]) {
    for (const to of Object.keys(serviceRequestTransitions)) {
      assert.equal(isAllowedServiceRequestTransition(from, to), false);
    }
  }
});

test("resolved requests can only be closed", () => {
  assert.equal(isAllowedServiceRequestTransition("resolved", "closed"), true);
  assert.equal(isAllowedServiceRequestTransition("resolved", "in_progress"), false);
});

test("waiting-on-client requests can resume, resolve, or close", () => {
  for (const to of ["in_progress", "resolved", "closed"]) {
    assert.equal(isAllowedServiceRequestTransition("waiting_on_client", to), true);
  }
});

test("invalid states, transitions, and prototype keys are rejected", () => {
  for (const [from, to] of [
    ["unknown", "triaged"],
    ["new", "unknown"],
    ["toString", "triaged"],
    ["new", "constructor"],
  ]) {
    assert.equal(isAllowedServiceRequestTransition(from, to), false);
    assert.equal(canRolePerformServiceRequestTransition("intake_coordinator", from, to), false);
  }
  assert.equal(canRolePerformServiceRequestTransition("toString", "new", "triaged"), false);
});

test("assertion distinguishes invalid transitions from forbidden roles", () => {
  assert.throws(() => assertServiceRequestTransition("case_manager", "new", "resolved"), {
    message: "INVALID_SERVICE_REQUEST_TRANSITION",
  });
  assert.throws(() => assertServiceRequestTransition("case_manager", "new", "triaged"), {
    message: "FORBIDDEN_SERVICE_REQUEST_TRANSITION",
  });
  assert.equal(assertServiceRequestTransition("case_manager", "assigned", "in_progress"), true);
});

test("transition policy is immutable", () => {
  assert.equal(Object.isFrozen(serviceRequestTransitions), true);
  for (const destinations of Object.values(serviceRequestTransitions)) {
    assert.equal(Object.isFrozen(destinations), true);
  }
  assert.throws(() => serviceRequestTransitions.new.push("resolved"), TypeError);
});
