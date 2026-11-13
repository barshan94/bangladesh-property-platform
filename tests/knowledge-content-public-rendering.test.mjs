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
  assert.ok(foundation.includes("create view public.published_knowledge_content"));
  assert.ok(publicBoundary.includes("security_invoker = true"));
  assert.ok(publicBoundary.includes("where status = 'published'"));
  const grant = publicBoundary.split("grant select (")[1]?.split(") on public.knowledge_content")[0] ?? "";
  assert.ok(grant.includes("body_markdown"));
  for (const field of ["source_notes", "review_note", "reviewer_user_id", "author_user_id"]) {
    assert.ok(!grant.includes(field), field + " must not be granted");
  }
  assert.ok(probe.includes("KNOWLEDGE_CONTENT_COLUMN_GRANTS_INVALID"));
  assert.ok(probe.includes("KNOWLEDGE_CONTENT_VIEW_NOT_SECURITY_INVOKER"));
  assert.ok(probe.includes("KNOWLEDGE_CONTENT_PUBLISHED_RLS_POLICY_MISSING"));
  assert.ok(probe.includes("KNOWLEDGE_CONTENT_INTERNAL_FIELDS_EXPOSED"));
});

test("public routes read only the published projection and fail closed on invalid records", () => {
  assert.ok(helper.includes("published_knowledge_content"));
  assert.ok(helper.includes('item.content_type === "article"'));
  assert.ok(helper.includes('"youtube"'));
  assert.ok(helper.includes('"vimeo"'));
  assert.ok(publicBoundary.includes("using (status = 'published')"));
  assert.ok(listPage.includes("getPublishedKnowledgeContent"));
  assert.ok(detailPage.includes("getPublishedKnowledgeEntry"));
  assert.ok(detailPage.includes("notFound()"));
});

test("Markdown renderer does not parse HTML or allow dangerous link protocols", () => {
  assert.ok(!renderer.includes("dangerouslySetInnerHTML"));
  assert.ok(renderer.includes('parsed.protocol === "https:"'));
  assert.ok(renderer.includes('rel="noopener noreferrer"'));
  assert.ok(renderer.includes('source.replace(/\\r\\n?/g'));
  assert.ok(detailPage.includes('sandbox="allow-scripts allow-same-origin allow-presentation"'));
  assert.ok(detailPage.includes('referrerPolicy="strict-origin-when-cross-origin"'));
  assert.ok(detailPage.includes("https://www.youtube-nocookie.com/embed/"));
  assert.ok(detailPage.includes("https://player.vimeo.com/video/"));
});

test("database CI runs the knowledge content boundary probe", () => {
  assert.ok(workflow.includes("knowledge_content_boundary_probe.sql"));
});
