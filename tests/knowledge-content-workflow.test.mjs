import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const migration = await readFile(
  new URL("../supabase/migrations/20261113200000_knowledge_content_editorial_workflow.sql", import.meta.url),
  "utf8",
);
const probe = await readFile(
  new URL("../supabase/tests/knowledge_content_boundary_probe.sql", import.meta.url),
  "utf8",
);
const workflow = await readFile(
  new URL("../.github/workflows/database-policy-tests.yml", import.meta.url),
  "utf8",
);

test("knowledge content is published-only to browser readers and has no browser write grants", () => {
  assert.match(migration, /alter table public\.knowledge_content enable row level security/);
  assert.match(migration, /grant select on public\.knowledge_content to anon, authenticated/);
  assert.match(migration, /using \(status = 'published'\)/);
  assert.match(migration, /revoke all on public\.knowledge_content from public, anon, authenticated/);
  assert.match(migration, /grant all on public\.knowledge_content to service_role/);
  assert.match(probe, /KNOWLEDGE_CONTENT_BROWSER_WRITE_GRANT_PRESENT/);
  assert.match(probe, /KNOWLEDGE_CONTENT_PUBLIC_POLICY_MISSING/);
});

test("editorial workflow requires a separate administrator review and publication", () => {
  assert.match(migration, /role_code = 'content_editor'/);
  assert.match(migration, /v_is_admin := private\.has_active_listing_staff_role\('administrator'\)/);
  assert.match(migration, /CONTENT_AUTHOR_CANNOT_REVIEW_OWN_WORK/);
  assert.match(migration, /APPROVED_CONTENT_REQUIRED_FOR_PUBLICATION/);
  assert.match(migration, /knowledge_content\.status_changed/);
  assert.match(migration, /p_reason is null/);
  assert.match(probe, /KNOWLEDGE_CONTENT_TRANSITION_RPC_GRANTS_INVALID/);
});

test("articles and videos have constrained payloads instead of arbitrary embed URLs", () => {
  assert.match(migration, /content_type in \('article','video'\)/);
  assert.match(migration, /video_provider in \('youtube','vimeo'\)/);
  assert.match(migration, /video_id ~ '\^\[A-Za-z0-9_-/);
  assert.doesNotMatch(migration, /video_url|embed_url/);
});

test("database CI runs the editorial content boundary probe", () => {
  assert.match(workflow, /knowledge_content_boundary_probe\.sql/);
});
