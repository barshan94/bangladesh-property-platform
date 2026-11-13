import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [migration, independence, probe, workflow, page, actions, preview, dashboard] = await Promise.all([
  readFile(new URL("../supabase/migrations/20261113240000_listing_media_review_workspace.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261113250000_listing_media_reviewer_independence.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/tests/listing_media_review_workspace_probe.sql", import.meta.url), "utf8"),
  readFile(new URL("../.github/workflows/database-policy-tests.yml", import.meta.url), "utf8"),
  readFile(new URL("../src/app/dashboard/media-review/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/dashboard/media-review/actions.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/api/listing-media/[mediaId]/route.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/dashboard/page.tsx", import.meta.url), "utf8"),
]);

test("review queue RPC exposes pending metadata but never a private Storage key", () => {
  assert.match(migration, /list_pending_listing_media_for_review/);
  assert.match(migration, /private\.has_active_listing_staff_role\('listing_reviewer'\)/);
  assert.doesNotMatch(migration, /quarantine_storage_key/);
  assert.match(migration, /grant execute on function public\.list_pending_listing_media_for_review\(\)\s+to authenticated/);
  assert.match(probe, /LISTING_MEDIA_REVIEW_QUEUE_EXPOSES_STORAGE_KEY/);
  assert.match(probe, /LISTING_MEDIA_REVIEW_QUEUE_RPC_GRANTS_INVALID/);
  assert.match(workflow, /listing_media_review_workspace_probe\.sql/);
});

test("reviewer preview verifies an active database role and audits private image access", () => {
  assert.match(preview, /auth\.getClaims\(\)/);
  assert.match(preview, /from\("user_roles"\)/);
  assert.match(preview, /revoked_at/);
  assert.match(preview, /moderation_status/);
  assert.match(preview, /storage\s*\.from\(BUCKET\)\s*\.download/);
  assert.match(preview, /listing_media\.previewed/);
  assert.match(preview, /cache-control.*no-store/);
  assert.doesNotMatch(preview, /createSignedUrl|\.getPublicUrl/);
});

test("reviewer workspace uses the private preview route and reasoned moderation action", () => {
  assert.match(page, /\/api\/listing-media\//);
  assert.match(page, /reviewListingMedia/);
  assert.match(page, /name="reason" required/);
  assert.match(page, /value="approved"/);
  assert.match(page, /value="rejected"/);
  assert.match(independence, /MEDIA_OWNER_CANNOT_REVIEW_OWN_UPLOAD/);
  assert.match(probe, /LISTING_MEDIA_OWNER_SELF_REVIEW_NOT_BLOCKED/);
  assert.match(actions, /review_listing_media/);
  assert.match(actions, /p_reason: reason/);
  assert.match(dashboard, /href="\/dashboard\/media-review"/);
});
