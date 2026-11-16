import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const [action, listingPage, editPage, lifecycle] = await Promise.all([
  readFile(new URL("../src/app/dashboard/listings/actions.ts", import.meta.url), "utf8"),
  readFile(new URL("../src/app/dashboard/listings/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../src/app/dashboard/listings/[listingId]/edit/page.tsx", import.meta.url), "utf8"),
  readFile(new URL("../supabase/migrations/20261112193926_enforce_listing_lifecycle_transitions.sql", import.meta.url), "utf8"),
]);

test("seller can edit only an owned draft or changes-requested listing", () => {
  assert.match(action, /updateListingDraft/);
  assert.match(action, /\.eq\("owner_user_id", userId\)/);
  assert.match(action, /\.in\("status", \["draft", "changes_requested"\]\)/);
  assert.match(editPage, /listing\.status === "draft" \|\| listing\.status === "changes_requested"/);
  assert.match(lifecycle, /old\.status not in \('draft','changes_requested'\)/);
});

test("listing edits update content without bypassing lifecycle transitions", () => {
  assert.match(action, /\.from\("property_listings"\)\s*\.update\(/);
  assert.doesNotMatch(action.slice(action.indexOf("export async function updateListingDraft")), /status\s*:/);
  assert.match(lifecycle, /EDIT_CONTENT_SEPARATELY_FROM_STATUS_TRANSITION/);
});

test("seller edit form preserves existing property values and private coordinates", () => {
  for (const field of ["headline", "description", "division", "district", "price_amount", "area_value", "bedrooms", "bathrooms"]) {
    assert.ok(editPage.includes("value." + field), "missing prefilled field " + field);
  }
  assert.match(editPage, /listing_private_details/);
  assert.match(editPage, /defaultValue=\{field\(privateDetails\?\.latitude\)\}/);
  assert.match(editPage, /defaultValue=\{field\(privateDetails\?\.longitude\)\}/);
});

test("eligible seller listings show a safe edit link", () => {
  assert.match(listingPage, /dashboard\/listings\/\$\{listing\.id\}\/edit/);
  assert.match(listingPage, /listing\.status === "draft" \|\| listing\.status === "changes_requested"/);
  assert.match(listingPage, /form action=\{submitListing\}/);
});
