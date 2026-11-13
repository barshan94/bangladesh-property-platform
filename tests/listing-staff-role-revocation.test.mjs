import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("listing staff read and transition authority requires active database role plus trusted claim", async () => {
  const sql = await readFile(new URL("../supabase/migrations/20261113170000_require_active_listing_staff_role.sql", import.meta.url), "utf8");
  assert.match(sql, /ur\.revoked_at is null/);
  assert.match(sql, /ur\.user_id = v_actor/);
  assert.match(sql, /v_roles \? 'listing_reviewer'/);
  assert.match(sql, /v_roles \? 'listing_publisher'/);
  assert.match(sql, /listings_read_published_or_owned_or_staff/);
  assert.match(sql, /listings_update_staff/);
  assert.match(sql, /listing_status_events_read_owner_or_staff/);
  assert.equal((sql.match(/ur\.revoked_at is null/g) ?? []).length >= 5, true);
});

test("transactional probe covers stale revoked claims and valid active reviewers", async () => {
  const probe = await readFile(new URL("../supabase/tests/listing_staff_role_probe.sql", import.meta.url), "utf8");
  assert.match(probe, /REVOKED_STAFF_CAN_READ_UNPUBLISHED_LISTING/);
  assert.match(probe, /REVOKED_STAFF_TRANSITION_WAS_NOT_DENIED/);
  assert.match(probe, /ACTIVE_STAFF_CANNOT_READ_UNPUBLISHED_LISTING/);
  assert.match(probe, /ACTIVE_STAFF_STATUS_HISTORY_MISSING/);
  assert.match(probe, /rollback;/i);
});
