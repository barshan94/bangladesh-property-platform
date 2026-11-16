import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, action, dashboard, migration] = await Promise.all([
  readFile(new URL("../src/app/dashboard/media-publication/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/dashboard/media-publication/actions.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/dashboard/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261113270000_listing_media_publication_workflow.sql", import.meta.url), "utf8"),
]);

test("publisher workspace uses the approved-only queue and does not expose private object data", () => {
  assert.match(page, /list_approved_listing_media_for_publication/);
  assert.match(page, /publication_status/);
  assert.match(page, /approved_at/);
  assert.match(page, /Public image delivery remains disabled/i);
  assert.doesNotMatch(page, /quarantine_storage_key|sha256_hex|createSignedUrl|getPublicUrl/);
});

test("publisher action validates one form value per field and strict reason input", () => {
  assert.match(action, /getAll\("media_id"\)/);
  assert.match(action, /getAll\("decision"\)/);
  assert.match(action, /getAll\("reason"\)/);
  assert.match(action, /mediaIds\.length !== 1 \|\| decisions\.length !== 1 \|\| reasons\.length !== 1/);
  assert.match(action, /CONTROL_CHARACTERS = \/\[\\u0000-\\u001f\\u007f-\\u009f\]\/u/);
  assert.match(action, /decision !== "published" && decision !== "unpublished"/);
  assert.match(action, /set_listing_media_publication/);
  assert.match(action, /p_reason: reason/);
});

test("publisher and administrator dashboard claims expose the new queue", () => {
  assert.match(dashboard, /roles\.includes\("listing_publisher"\) \|\| isAdministrator/);
  assert.match(dashboard, /href="\/dashboard\/media-publication"/);
});

test("database migration locks rows and enforces active publisher, approval, owner independence and audit", () => {
  assert.match(migration, /for update/);
  assert.match(migration, /has_active_listing_staff_role\('listing_publisher'\)/);
  assert.match(migration, /has_active_listing_staff_role\('administrator'\)/);
  assert.match(migration, /MEDIA_OWNER_CANNOT_PUBLISH_OWN_UPLOAD/);
  assert.match(migration, /ONLY_APPROVED_MEDIA_CAN_BE_PUBLISHED/);
  assert.match(migration, /listing_media\.published/);
  assert.match(migration, /listing_media\.unpublished/);
  assert.match(migration, /insert into public\.audit_events/);
});
