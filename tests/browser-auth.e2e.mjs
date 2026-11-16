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
const email = `browser-e2e-${randomUUID()}@example.invalid`;
const password = `Browser-E2E-${randomUUID()}-Aa9!`;
let userId;
let server;
let browser;

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
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(error);
  userId = data.user.id;

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
  const page = await browser.newPage();

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

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${baseUrl}/dashboard`);
  await page.getByRole("heading", { name: "Welcome to your account." }).waitFor();
  await page.getByText(email).waitFor();
  await assertNoAccessibilityViolations(page, "authenticated dashboard");

  const disabledAuthenticatedDocumentRoute = await page.evaluate(async () => {
    const form = new FormData();
    form.append("file", new File([new Uint8Array([1, 2, 3])], "must-not-be-uploaded.pdf", { type: "application/pdf" }));
    const response = await fetch("/api/private-documents", { method: "POST", body: form });
    return { status: response.status, body: await response.json() };
  });
  assert.equal(disabledAuthenticatedDocumentRoute.status, 410);
  assert.equal(disabledAuthenticatedDocumentRoute.body.error, "CONFIDENTIAL_DOCUMENT_EXCHANGE_EXCLUDED_FROM_MVP");

  console.log("Confidential document MVP exclusion E2E passed: anonymous and authenticated callers are rejected with HTTP 410.");
  await page.getByRole("button", { name: "Sign out" }).click();
  await page.waitForURL(/\/login\?/);
  assert.match(page.url(), /\/login\?/, "sign-out must clear the session and return to login");
  console.log("Browser auth E2E passed: protected-route redirect, real email/password sign-in, dashboard session and sign-out.");
} finally {
  if (browser) await browser.close();
  if (server && server.exitCode === null) {
    server.kill("SIGTERM");
    await Promise.race([new Promise(resolve => server.once("exit", resolve)), delay(5000)]);
    if (server.exitCode === null) server.kill("SIGKILL");
  }
  if (userId) {
    try { await admin.auth.admin.deleteUser(userId); } catch {}
  }
}
