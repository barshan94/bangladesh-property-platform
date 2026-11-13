import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const baseMigration = readFileSync(new URL("../supabase/migrations/20261113100000_public_inquiry_api.sql", import.meta.url), "utf8");
const maintenanceMigration = readFileSync(new URL("../supabase/migrations/20261113055034_prune_expired_inquiry_rate_limits.sql", import.meta.url), "utf8");

test("fresh inquiry migration creates the bounded rate-limit retention implementation", () => {
  assert.ok(baseMigration.includes("inquiry_rate_limits_updated_at_idx"));
  assert.ok(baseMigration.includes("where updated_at < v_now - interval '2 days'"));
  assert.ok(baseMigration.includes("limit 100"));
  assert.ok(baseMigration.includes("for update skip locked"));
  assert.ok(baseMigration.includes("p_window_seconds < 60 or p_window_seconds > 86400"));
  assert.ok(baseMigration.includes("as $$"));
  assert.ok(baseMigration.includes("end;\n$$;"));
});

test("earlier maintenance migration safely skips before its base objects exist", () => {
  assert.ok(maintenanceMigration.includes("to_regclass('public.inquiry_rate_limits')"));
  assert.ok(maintenanceMigration.includes("to_regprocedure('public.consume_inquiry_rate_limit(text,integer,integer)')"));
  assert.ok(maintenanceMigration.includes("do $migration$"));
  assert.ok(maintenanceMigration.includes("for update skip locked"));
});
