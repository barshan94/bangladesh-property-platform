import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const forms = [
  {
    path: "src/app/contact/inquiry-form.tsx",
    prefix: "inquiry",
    fields: ["name", "email", "phone", "serviceCode", "country", "propertyDistrict", "message"],
  },
  {
    path: "src/app/dashboard/service-requests/service-request-form.tsx",
    prefix: "service-request",
    fields: ["name", "phone", "country", "serviceCode", "propertyDistrict", "summary"],
  },
];

for (const form of forms) {
  test(form.path + " associates server validation errors with their controls", () => {
    const source = readFileSync(new URL("../" + form.path, import.meta.url), "utf8");
    for (const field of form.fields) {
      const id = form.prefix + "-" + field.replace(/[A-Z]/g, (match) => "-" + match.toLowerCase()) + "-error";
      assert.match(source, new RegExp("aria-invalid=\\{Boolean\\(errors\\." + field + "\\?\\.length\\)\\}"));
      assert.ok(source.includes('aria-describedby={errors.' + field + '?.length ? "' + id + '" : undefined}'));
      assert.ok(source.includes('id="' + id + '"'));
    }
  });
}
