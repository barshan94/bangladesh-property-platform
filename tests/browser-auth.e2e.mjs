import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "playwright";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
for (const [name, value] of Object.entries({
  SUPABASE_URL: url,
  SUPABASE_ANON_KEY: anonKey,
  SUPABASE_SERVICE_ROLE_KEY: serviceKey,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
})) {
  assert.ok(value, `${name} must be configured for browser authentication tests`);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const suffix = randomUUID().replaceAll("-", "").slice(0, 12);
const password = `Browser-E2E-${randomUUID()}-Aa9!`;
const createdUsers = [];
let server;
let browser;
let listingId;
const listingTitle = `Browser workflow test property ${suffix}`;
const listingDescription = "Temporary synthetic listing used to verify the seller, reviewer, publisher and administrator browser workflows.";

async function createRoleUser(label, role) {
  const email = `${label}-${suffix}@example.invalid`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    app_metadata: { roles: [role] },
  });
  assert.ifError(error);
  createdUsers.push(data.user.id);
  const { error: roleError } = await admin.from("user_roles").insert({
    user_id: data.user.id,
    role_code: role,
  });
  assert.ifError(roleError);
  return { id: data.user.id, email };
}

async function signIn(page, email) {
  await page.goto(`${baseUrl}/login`);
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${baseUrl}/dashboard`);
  await page.getByRole("heading", { name: "Welcome to your account." }).waitFor();
}

async function signOut(page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/login\?/);
}

async function waitForListingStatus(id, expectedStatus) {
  let actualStatus = "missing";
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const { data, error } = await admin
      .from("property_listings")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    assert.ifError(error);
    actualStatus = data?.status ?? "missing";
    if (actualStatus === expectedStatus) return;
    await delay(100);
  }
  assert.equal(actualStatus, expectedStatus, `listing should reach ${expectedStatus} before the workflow continues`);
}

async function assertNoAccessibilityViolations(page, pageName) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  const details = results.violations.map((violation) => {
    const targets = violation.nodes.map((node) => node.target.join(" ")).join("; ");
    return `${violation.id} [${violation.impact}]: ${violation.help} — ${targets}`;
  });
  assert.equal(
    results.violations.length,
    0,
    `${pageName} has automated WCAG violations:\n${details.join("\n")}`,
  );
  console.log(`Automated WCAG scan passed: ${pageName}.`);
}

try {
  const seller = await createRoleUser("seller", "seller");

  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", "3100", "-H", "127.0.0.1"], {
    env: { ...process.env, NEXT_PUBLIC_SITE_URL: baseUrl, APP_BASE_URL: baseUrl },
    stdio: "inherit",
  });

  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next.js server exited early with code ${server.exitCode}`);
    try {
      const response = await fetch(baseUrl);
      if (response.ok) { ready = true; break; }
    } catch {}
    await delay(1000);
  }
  assert.ok(ready, "Next.js production server should become ready");

  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(baseUrl);
  await assertNoAccessibilityViolations(page, "public homepage");

  await page.goto(`${baseUrl}/properties`);
  await assertNoAccessibilityViolations(page, "public property catalogue");

  await page.goto(`${baseUrl}/dashboard`);
  await page.waitForURL(/\/login\?/);
  assert.match(page.url(), /\/login\?/, "unauthenticated browser must be redirected to login");
  await assertNoAccessibilityViolations(page, "login page");

  // Confidential document exchange is deliberately excluded from this MVP.
  // Verify both anonymous and authenticated callers receive the same fixed
  // 410 response, without exercising or implying any document intake path.
  const disabledAnonymousDocumentRoute = await page.evaluate(async () => {
    const response = await fetch("/api/private-documents", { method: "POST" });
    return { status: response.status, body: await response.json() };
  });
  assert.equal(disabledAnonymousDocumentRoute.status, 410);
  assert.equal(disabledAnonymousDocumentRoute.body.error, "CONFIDENTIAL_DOCUMENT_EXCHANGE_EXCLUDED_FROM_MVP");

  await signIn(page, seller.email);
  await page.getByText(seller.email).waitFor();
  await assertNoAccessibilityViolations(page, "authenticated seller dashboard");

  const disabledAuthenticatedDocumentRoute = await page.evaluate(async () => {
    const form = new FormData();
    form.append("file", new File([new Uint8Array([1, 2, 3])], "must-not-be-uploaded.pdf", { type: "application/pdf" }));
    const response = await fetch("/api/private-documents", { method: "POST", body: form });
    return { status: response.status, body: await response.json() };
  });
  assert.equal(disabledAuthenticatedDocumentRoute.status, 410);
  assert.equal(disabledAuthenticatedDocumentRoute.body.error, "CONFIDENTIAL_DOCUMENT_EXCHANGE_EXCLUDED_FROM_MVP");

  // Seller journey: create a private draft, then submit it into the review queue.
  await page.goto(`${baseUrl}/dashboard/listings/new`);
  await page.getByLabel("Listing title").fill(listingTitle);
  await page.getByLabel("Description").fill(listingDescription);
  await page.getByLabel("Division").fill("Dhaka");
  await page.getByLabel("District").fill("Dhaka");
  await page.getByRole("button", { name: "Save private draft" }).click();
  await page.waitForURL(/\/dashboard\/listings\?created=/);
  await page.getByRole("heading", { name: listingTitle }).waitFor();
  await page.getByRole("button", { name: "Submit for review" }).click();
  await page.waitForURL(/\/dashboard\/listings\?submitted=1/);
  await page.getByText("Your listing was submitted for review. It is not published yet.").waitFor();

  const { data: listing, error: listingLookupError } = await admin
    .from("property_listings")
    .select("id,status,owner_user_id")
    .eq("owner_user_id", seller.id)
    .eq("headline", listingTitle)
    .single();
  assert.ifError(listingLookupError);
  listingId = listing.id;
  assert.equal(listing.status, "submitted", "seller submission must enter the submitted state");

  // Seller must not be able to open staff-only review or publication workspaces.
  await page.goto(`${baseUrl}/dashboard/review`);
  await page.waitForURL(/\/dashboard\?message=/);
  await page.goto(`${baseUrl}/dashboard/publish`);
  await page.waitForURL(/\/dashboard\?message=/);
  await signOut(page);
  console.log("Seller browser journey passed: create draft, submit listing, and deny staff-only queues.");

  // Reviewer journey: claim the queue item, then approve with a recorded reason.
  const reviewer = await createRoleUser("reviewer", "listing_reviewer");
  await signIn(page, reviewer.email);
  await page.goto(`${baseUrl}/dashboard/review`);
  const reviewCard = page.locator(".seller-listing-card").filter({ hasText: listingTitle });
  await reviewCard.waitFor();
  await reviewCard.getByRole("button", { name: "Start review" }).click();
  await page.waitForURL(/\/dashboard\/review\?updated=1/);
  await waitForListingStatus(listingId, "under_review");
  const activeReviewCard = page.locator(".seller-listing-card").filter({ hasText: listingTitle });
  await activeReviewCard.getByLabel("Decision reason (required)").fill("Synthetic E2E review: required fields and moderation boundaries checked.");
  await activeReviewCard.getByRole("button", { name: "Approve listing" }).click();
  await waitForListingStatus(listingId, "approved");
  await page.goto(`${baseUrl}/dashboard/publish`);
  await page.waitForURL(/\/dashboard\?message=/);
  await signOut(page);
  console.log("Reviewer browser journey passed: start review, approve with reason, and deny publisher workspace.");

  // Publisher journey: publish only after reviewer approval.
  const publisher = await createRoleUser("publisher", "listing_publisher");
  await signIn(page, publisher.email);
  await page.goto(`${baseUrl}/dashboard/publish`);
  const publishCard = page.locator(".seller-listing-card").filter({ hasText: listingTitle });
  await publishCard.waitFor();
  await publishCard.getByLabel("Publication note (required)").fill("Synthetic E2E publication: reviewer approval confirmed and public fields checked.");
  await publishCard.getByRole("button", { name: "Publish listing" }).click();
  await page.waitForURL(/\/dashboard\/publish\?published=1/);
  await waitForListingStatus(listingId, "published");
  await page.goto(`${baseUrl}/properties`);
  await page.getByText(listingTitle).waitFor();
  await signOut(page);
  console.log("Publisher browser journey passed: publish approved listing and verify public catalogue visibility.");

  // Administrator journey: confirm the real admin control panel and cross-seller
  // property directory can load using a separately provisioned administrator.
  const administrator = await createRoleUser("administrator", "administrator");
  await signIn(page, administrator.email);
  await page.goto(`${baseUrl}/dashboard/admin`);
  await page.getByRole("heading", { name: "Website management" }).waitFor();
  await page.goto(`${baseUrl}/dashboard/admin/properties`);
  await page.getByRole("heading", { name: "All property records" }).waitFor();
  await page.getByRole("heading", { name: listingTitle }).waitFor();
  await assertNoAccessibilityViolations(page, "administrator property directory");
  await signOut(page);
  console.log("Administrator browser journey passed: control panel and cross-seller property directory.");

  console.log("Full role workflow browser E2E passed: seller → reviewer → publisher → public catalogue, plus administrator access.");
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await Promise.race([new Promise(resolve => server.once("exit", resolve)), delay(5000)]);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
  // The workflow uses a disposable local Supabase database. Remove Auth users
  // explicitly as a second cleanup boundary; the entire local stack is stopped
  // by the workflow even if a failed browser assertion leaves test rows.
  if (createdUsers.length) {
    for (const userId of createdUsers) {
      try { await admin.auth.admin.deleteUser(userId); } catch {}
    }
  }
}
