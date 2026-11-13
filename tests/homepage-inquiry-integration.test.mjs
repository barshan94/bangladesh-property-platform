import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("homepage contact section uses the live validated inquiry form", async () => {
  const source = await readFile(new URL("../src/app/page.tsx", import.meta.url), "utf8");
  assert.match(source, /import \{ InquiryForm \} from "@\/app\/contact\/inquiry-form"/);
  assert.match(source, /<InquiryForm \/>/);
  assert.doesNotMatch(source, /Secure inquiry form coming soon/);
  assert.doesNotMatch(source, /type="button" disabled/);
});

test("shared inquiry form submits only through the public inquiry API", async () => {
  const source = await readFile(new URL("../src/app/contact/inquiry-form.tsx", import.meta.url), "utf8");
  assert.match(source, /fetch\("\/api\/inquiries"/);
  assert.match(source, /name: String\(values\.get\("name"/);
  assert.match(source, /consent: values\.get\("consent"\) === "on"/);
  assert.match(source, /Do not submit NID\/passport numbers/);
  assert.doesNotMatch(source, /type="file"/);
});
