import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [packageJson, packageLock, security, roadmap] = await Promise.all([
  readFile(new URL("../package.json", import.meta.url), "utf8"),
  readFile(new URL("../package-lock.json", import.meta.url), "utf8"),
  readFile(new URL("../docs/LISTING_MEDIA_PIPELINE.md", import.meta.url), "utf8"),
  readFile(new URL("../ROADMAP.md", import.meta.url), "utf8"),
]);

test("listing media intake remains blocked until a locked image decoder is installed", () => {
  const manifest = JSON.parse(packageJson);
  const lock = JSON.parse(packageLock);
  const hasDirectSharp = Object.hasOwn(manifest.dependencies ?? {}, "sharp");
  const hasLockedDirectSharp = Object.hasOwn(lock.packages?.[""]?.dependencies ?? {}, "sharp");
  assert.equal(hasDirectSharp, hasLockedDirectSharp, "direct image processor dependency and lockfile root must agree");
  if (!hasDirectSharp) {
    assert.match(security, /no upload route/i);
    assert.match(roadmap, /server-side image upload/i);
  }
});

test("media processing requirements reject originals and require canonical re-encoding", () => {
  assert.match(security, /no upload route/i);
  assert.match(security, /public listing pages must continue to return no images/i);
  assert.match(roadmap, /Keep public listing images empty/i);
});
