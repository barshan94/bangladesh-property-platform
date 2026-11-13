import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [migration, queueExclusion, independence, probe, workflow, page, actions, preview, dashboard] = await Promise.all([
  readFile(new URL("../supabase/migrations/20261113240000_listing_media_review_workspace.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261113260000_listing_media_queue_excludes_own_uploads.sql", import.meta.url), "utf8"),
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
  assert.match(preview, /owner_user_id === actorId/);
  assert.match(preview, /moderation_status/);
  assert.match(preview, /sha256_hex/);
  assert.match(preview, /createHash\("sha256"\)\.update\(bytes\)\.digest\("hex"\)/);
  assert.match(preview, /actualDigest !== media\.sha256_hex/);
  assert.ok(preview.indexOf("actualDigest !== media.sha256_hex") < preview.indexOf('action: "listing_media.previewed"'),
    "digest mismatch must be rejected before recording or returning a preview");
  assert.ok(preview.indexOf('action: "listing_media.previewed"') < preview.indexOf("new Response(responseBytes"),
    "private image delivery must happen only after its access audit is recorded");
  assert.match(preview, /storage\s*\.from\(BUCKET\)\s*\.download/);
  assert.match(preview, /object\.size > MAX_BYTES/);
  assert.ok(preview.indexOf("object.size > MAX_BYTES") < preview.indexOf("object.arrayBuffer()"),
    "reject oversized Storage objects before allocating their full contents");
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
  assert.match(queueExclusion, /owner_user_id <> auth\.uid\(\)/);
  assert.match(independence, /MEDIA_OWNER_CANNOT_REVIEW_OWN_UPLOAD/);
  assert.match(probe, /LISTING_MEDIA_OWNER_SELF_REVIEW_NOT_BLOCKED/);
  assert.match(actions, /review_listing_media/);
  assert.match(actions, /p_reason: reason/);
  assert.match(dashboard, /href="\/dashboard\/media-review"/);
});


test("review action rejects duplicate or non-string form fields before authorization or RPC", () => {
  assert.match(actions, /getAll\("media_id"\)/);
  assert.match(actions, /getAll\("decision"\)/);
  assert.match(actions, /getAll\("reason"\)/);
  assert.match(actions, /mediaIds\.length !== 1 \|\| decisions\.length !== 1 \|\| reasons\.length !== 1/);
  assert.ok(actions.indexOf("mediaIds.length !== 1") < actions.indexOf("createClient()"));
  assert.match(actions, /typeof mediaIds\[0\] !== "string"/);
});

test("review action rejects control characters in moderator reasons", () => {
  assert.match(actions, /CONTROL_CHARACTERS = \/\[\\u0000-\\u001f\\u007f-\\u009f\]\/u/);
  assert.match(actions, /CONTROL_CHARACTERS\.test\(reason\)/);
  assert.match(actions, /reason\.length < 5 \|\| reason\.length > 1000/);
});
