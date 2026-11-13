import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(new URL("../src/app/api/service-requests/route.ts", import.meta.url), "utf8");
const migration = await readFile(new URL("../supabase/migrations/20261113130000_service_request_staff_workflow.sql", import.meta.url), "utf8");
const probe = await readFile(new URL("../supabase/tests/service_request_rpc_probe.sql", import.meta.url), "utf8");

const functionStart = migration.indexOf("create or replace function public.create_service_request(");
const functionEnd = migration.indexOf("\n$$;", functionStart);
assert.notEqual(functionStart, -1, "corrected service-request RPC must exist in the forward migration");
assert.notEqual(functionEnd, -1, "RPC function body must be closed");
const functionSql = migration.slice(functionStart, functionEnd);

test("service-request route maps every RPC argument by its named parameter", () => {
  for (const parameter of [
    "p_requester_user_id: userId",
    "p_service_code: validation.data.serviceCode",
    "p_contact_name: validation.data.name",
    "p_email_normalized: email",
    "p_phone: validation.data.phone ?? null",
    "p_country: validation.data.country ?? null",
    "p_property_district: validation.data.propertyDistrict ?? null",
    "p_property_listing_id: null",
    "p_summary: validation.data.summary",
    "p_consent_version: CONSENT_VERSION",
    "p_request_id: randomUUID()",
  ]) {
    assert.ok(route.includes(parameter), `Missing RPC mapping: ${parameter}`);
  }
});

test("forward RPC migration aligns property listing UUID before contact text", () => {
  const insert = functionSql.match(/insert into public\.service_requests\s*\(([\s\S]*?)\)\s*values\s*\(([\s\S]*?)\)\s*returning id into v_request_id/iu);
  assert.ok(insert, "expected service request INSERT in corrected function");
  const columns = insert[1].split(",").map((value) => value.trim());
  const values = insert[2].split(",").map((value) => value.trim());
  assert.deepEqual(columns.slice(0, 4), [
    "requester_user_id",
    "service_code",
    "property_listing_id",
    "contact_name",
  ]);
  assert.deepEqual(values.slice(0, 4), [
    "p_requester_user_id",
    "p_service_code",
    "p_property_listing_id",
    "pg_catalog.btrim(p_contact_name)",
  ]);
});

test("intake RPC is not executable by anonymous or authenticated browser roles", () => {
  assert.match(functionSql, /revoke all on function public\.create_service_request\([\s\S]*?from public, anon, authenticated/iu);
  assert.match(functionSql, /grant execute on function public\.create_service_request\([\s\S]*?to service_role/iu);
});

test("transactional SQL probe checks persisted intake fields and atomic side effects", () => {
  assert.match(probe, /SERVICE_REQUEST_INTAKE_FIELD_MAPPING_FAILED/u);
  assert.match(probe, /SERVICE_REQUEST_INTAKE_ATOMIC_SIDE_EFFECTS_FAILED/u);
  assert.match(probe, /public\.consent_records/u);
  assert.match(probe, /public\.audit_events/u);
  assert.match(probe, /public\.service_request_status_events/u);
});
