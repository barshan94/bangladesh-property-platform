import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [migration, design, workflow] = await Promise.all([
  readFile(new URL("../supabase/migrations/20261113270000_listing_media_publication_workflow.sql", import.meta.url), "utf8"),
  readFile(new URL("../docs/PUBLIC_LISTING_MEDIA_PUBLICATION_DESIGN.md", import.meta.url), "utf8"),
  readFile(new URL("../.github/workflows/database-policy-tests.yml", import.meta.url), "utf8"),
]);

test("publisher RPC requires active publisher/admin role and authenticated actor", () => {
  assert.match(migration, /auth\.uid\(\) is null/);
  assert.match(migration, /has_active_listing_staff_role\('listing_publisher'\)/);
  assert.match(migration, /has_active_listing_staff_role\('administrator'\)/);
  assert.doesNotMatch(migration, /has_active_listing_staff_role\('listing_reviewer'\)/);
  assert.match(migration, /revoke all on function public\.set_listing_media_publication\(uuid,text,text\) from public, anon, service_role/);
  assert.match(migration, /grant execute on function public\.set_listing_media_publication\(uuid,text,text\) to authenticated/);
});

test("publication is separate from moderation and requires approved media and independent publisher", () => {
  assert.match(migration, /publication_status text not null default 'unpublished'/);
  assert.match(migration, /moderation_status <> 'approved'/);
  assert.match(migration, /owner_user_id = auth\.uid\(\)/);
  assert.match(migration, /MEDIA_OWNER_CANNOT_PUBLISH_OWN_UPLOAD/);
  assert.match(migration, /publication_status = p_decision/);
  assert.match(migration, /for update/);
});

test("publication and unpublication are reasoned and audited in the same transaction", () => {
  assert.match(migration, /p_reason/);
  assert.match(migration, /char_length\(pg_catalog\.btrim\(p_reason\)\) < 5/);
  assert.match(migration, /listing_media\.published/);
  assert.match(migration, /listing_media\.unpublished/);
  assert.match(migration, /insert into public\.audit_events/);
  assert.match(migration, /begin;/);
  assert.match(migration, /commit;/);
});

test("approved-media publisher queue excludes own uploads and private storage metadata", () => {
  assert.match(migration, /list_approved_listing_media_for_publication/);
  assert.match(migration, /owner_user_id <> auth\.uid\(\)/);
  const queue = migration.slice(migration.indexOf("create or replace function public.list_approved_listing_media_for_publication"));
  assert.doesNotMatch(queue, /quarantine_storage_key|sha256_hex|reviewed_by/);
  assert.match(queue, /grant execute on function public\.list_approved_listing_media_for_publication\(\)\s+to authenticated/);
});

test("publication design keeps public delivery disabled until its separate release gate", () => {
  assert.match(design, /No publication RPC, public media endpoint, or public listing image query is enabled/);
  assert.match(design, /private, no-store/);
  assert.match(workflow, /supabase db reset --local --no-seed/);
});
