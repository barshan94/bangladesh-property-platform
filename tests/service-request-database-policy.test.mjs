import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20261113130000_service_request_staff_workflow.sql", import.meta.url),
  "utf8",
);
const functionStart = migration.indexOf("create or replace function public.manage_service_request(");
const functionEnd = migration.indexOf("\n\nrevoke all on function public.manage_service_request", functionStart);
assert.notEqual(functionStart, -1, "staff management function must exist in the migration");
assert.notEqual(functionEnd, -1, "staff management function must have an explicit privilege section");
const staffFunction = migration.slice(functionStart, functionEnd);

test("staff authorization requires trusted claims and a current non-revoked database role", () => {
  assert.match(staffFunction, /auth\.uid\(\)/);
  assert.match(staffFunction, /auth\.jwt\(\)/);
  assert.match(staffFunction, /ur\.revoked_at is null/);
  assert.match(staffFunction, /v_roles \? ur\.role_code/);
});

test("intake coordinator transitions match the domain lifecycle policy", () => {
  assert.match(staffFunction, /v_current_status = 'new' and v_next_status in \('triaged','spam','closed'\)/);
  assert.match(staffFunction, /v_current_status = 'triaged' and v_next_status in \('assigned','waiting_on_client','spam','closed'\)/);
  assert.match(staffFunction, /v_current_status = 'assigned' and v_next_status = 'closed'/);
});

test("case managers can transition only requests currently assigned to themselves", () => {
  assert.match(staffFunction, /v_has_case_manager and v_current_assignee = v_actor/);
  assert.match(staffFunction, /v_current_status = 'in_progress' and v_next_status in \('waiting_on_client','resolved'\)/);
  assert.match(staffFunction, /v_current_status = 'resolved' and v_next_status = 'closed'/);
});

test("administrator role does not grant a status-transition bypass", () => {
  assert.match(staffFunction, /v_has_administrator boolean := false/);
  assert.match(staffFunction, /if not \(v_has_intake or v_has_case_manager or v_has_administrator\)/);
  assert.match(staffFunction, /if not \(v_has_intake or v_has_administrator\) then/);
  assert.doesNotMatch(staffFunction, /v_has_administrator and \(/);
});

test("assignment is restricted to active staff members and intake or administrator actors", () => {
  assert.match(staffFunction, /if not \(v_has_intake or v_has_administrator\) then/);
  assert.match(staffFunction, /ur\.role_code in \('intake_coordinator','case_manager','administrator'\)/);
});
