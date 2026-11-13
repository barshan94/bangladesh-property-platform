import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [foundation, publicBoundary, probe, workflow, helper, renderer, listPage, detailPage] = await Promise.all([
  readFile(new URL("../supabase/migrations/20261113200000_knowledge_content_editorial_workflow.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261113220000_knowledge_content_public_read_boundary.sql", import.meta.url), "utf8"),
  readFile(new URL("../supabase/tests/knowledge_content_boundary_probe.sql", import.meta.url), "utf8"),
  readFile(new URL("../.github/workflows/database-policy-tests.yml", import.meta.url), "utf8"),
  readFile(new URL("../src/lib/knowledge-content.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/components/safe-markdown.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/knowledge/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/knowledge/[slug]/page.tsx", import.meta.url), "utf8"),
]);

test("public content view exposes published bodies but excludes internal editorial fields", () => {
  assert.match(foundation, /create view public\\.published_knowledge_content/);
  assert.match(publicBoundary, /security_invoker = true/);
  assert.match(publicBoundary, /where status = 'published'/);
  assert.match(publicBoundary, /grant select \\(/);
  assert.match(publicBoundary, /body_markdown/);
  assert.match(publicBoundary, /source_notes/);
  assert.match(publicBoundary, /review_note/);
  assert.match(publicBoundary, /author_user_id/);
  assert.match(probe, /KNOWLEDGE_CONTENT_COLUMN_GRANTS_INVALID/);
  assert.match(probe, /KNOWLEDGE_CONTENT_VIEW_NOT_SECURITY_INVOKER/);
  assert.match(probe, /KNOWLEDGE_CONTENT_PUBLISHED_RLS_POLICY_MISSING/);
  assert.match(probe, /KNOWLEDGE_CONTENT_INTERNAL_FIELDS_EXPOSED/);
});

test("public routes read only the published projection and fail closed on invalid records", () => {
  assert.match(helper, /published_knowledge_content/);
  assert.match(helper, /content_type === "article"/);
  assert.match(helper, /youtube/);
  assert.match(helper, /vimeo/);
  assert.match(helper, /status/);
  assert.match(listPage, /getPublishedKnowledgeContent/);
  assert.match(detailPage, /getPublishedKnowledgeEntry/);
  assert.match(detailPage, /notFound\(\)/);
});

test("Markdown renderer does not parse HTML or allow dangerous link protocols", () => {
  assert.doesNotMatch(renderer, /dangerouslySetInnerHTML/);
  assert.match(renderer, /https:\\\/\\\//);
  assert.match(renderer, /noopener noreferrer/);
  assert.match(renderer, /source\.replace/);
  assert.match(detailPage, /sandbox=/);
  assert.match(detailPage, /referrerPolicy=/);
  assert.match(detailPage, /youtube-nocookie\\.com/);
  assert.match(detailPage, /player\\.vimeo\\.com/);
});

test("database CI runs the knowledge content boundary probe", () => {
  assert.match(workflow, /knowledge_content_boundary_probe\\.sql/);
});
