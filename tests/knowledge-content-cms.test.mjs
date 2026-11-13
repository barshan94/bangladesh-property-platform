import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [page, actions, dashboard, migration, probe] = await Promise.all([
  readFile(new URL("../src/app/dashboard/content/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/dashboard/content/actions.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/dashboard/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261113210000_knowledge_content_editor_workspace.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/tests/knowledge_content_boundary_probe.sql", import.meta.url), "utf8"),
]);

test("CMS workspace is role-gated and linked only for editors and administrators", () => {
  assert.match(page, /roles\.includes\("content_editor"\)/);
  assert.match(page, /roles\.includes\("administrator"\)/);
  assert.match(dashboard, /href="\/dashboard\/content"/);
  assert.match(dashboard, /isContentEditor/);
});

test("CMS writes use authenticated RPCs and do not write directly to the content table", () => {
  assert.match(actions, /auth\.getClaims\(\)/);
  assert.match(actions, /save_knowledge_content_draft/);
  assert.match(actions, /transition_knowledge_content/);
  assert.doesNotMatch(actions, /\.from\(["']knowledge_content["']\)\.(insert|update|delete)/);
  assert.match(migration, /CONTENT_AUTHOR_ACCESS_REQUIRED/);
  assert.match(migration, /ONLY_DRAFT_OR_REJECTED_CONTENT_CAN_BE_EDITED/);
  assert.match(migration, /knowledge_content\.draft_saved/);
});

test("editorial listing RPC scopes editors to their own records", () => {
  assert.match(migration, /where v_is_admin or kc\.author_user_id = auth\.uid\(\)/);
  assert.match(migration, /ACTIVE_CONTENT_EDITOR_OR_ADMIN_REQUIRED/);
  assert.match(migration, /grant execute on function public\.list_knowledge_content_for_editor\(\) to authenticated/);
  assert.match(migration, /grant execute on function public\\.save_knowledge_content_draft/);
  assert.match(probe, /KNOWLEDGE_CONTENT_CMS_RPC_GRANTS_INVALID/);
  assert.match(probe, /KNOWLEDGE_CONTENT_CMS_RPC_SEARCH_PATH_NOT_PINNED/);
});

test("CMS does not expose raw Markdown or claim public rendering is available", () => {
  assert.match(page, /No unreviewed content is publicly visible/);
  assert.match(page, /published until an administrator approves and publishes it/);
  assert.match(page, /Article Markdown/);
  assert.match(migration, /security definer/);
});
