import test from "node:test";
import assert from "node:assert/strict";
import { buildPublicSitemapEntries } from "../src/lib/public-sitemap.mjs";

test("public sitemap includes static, service, knowledge and published property routes", () => {
  const entries = buildPublicSitemapEntries({
    siteUrl: "https://example.test",
    routes: ["/", "/knowledge", "/videos", "/services/title-and-record-review"],
    listings: [{ reference: "BD-2026-001", updatedAt: "2026-11-15T10:00:00.000Z" }],
    knowledge: [{ slug: "land-record-basics", published_at: "2026-11-10T00:00:00.000Z", reviewed_at: "2026-11-12T00:00:00.000Z" }],
  });
  const urls = entries.map((entry) => entry.url);
  assert.deepEqual(urls, [
    "https://example.test/",
    "https://example.test/knowledge",
    "https://example.test/videos",
    "https://example.test/services/title-and-record-review",
    "https://example.test/properties/BD-2026-001",
    "https://example.test/knowledge/land-record-basics",
  ]);
  assert.equal(entries[4].lastModified.toISOString(), "2026-11-15T10:00:00.000Z");
  assert.equal(entries[5].lastModified.toISOString(), "2026-11-12T00:00:00.000Z");
});

test("public sitemap encodes references, rejects malformed slugs and removes duplicate URLs", () => {
  const entries = buildPublicSitemapEntries({
    siteUrl: "https://example.test",
    routes: ["/", "/"],
    listings: [{ reference: "BD/26 01" }, { reference: "" }],
    knowledge: [{ slug: "valid-slug" }, { slug: "../private" }, { slug: "INVALID" }],
  });
  assert.deepEqual(entries.map((entry) => entry.url), [
    "https://example.test/",
    "https://example.test/properties/BD%2F26%2001",
    "https://example.test/knowledge/valid-slug",
  ]);
  assert.equal(entries[1].lastModified, undefined);
});

test("sitemap builder does not include arbitrary unpublished content unless passed", () => {
  const entries = buildPublicSitemapEntries({
    siteUrl: "https://example.test",
    routes: ["/"],
    listings: [],
    knowledge: [],
  });
  assert.deepEqual(entries.map((entry) => entry.url), ["https://example.test/"]);
});
