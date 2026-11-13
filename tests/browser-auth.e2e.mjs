import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { createClient } from "@supabase/supabase-js";
import { chromium } from "playwright";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const baseUrl = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3100";
for (const [name, value] of Object.entries({ SUPABASE_URL: url, SUPABASE_ANON_KEY: anonKey, SUPABASE_SERVICE_ROLE_KEY: serviceKey, NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY })) {
  assert.ok(value, `${name} must be configured for browser authentication tests`);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const email = `browser-e2e-${randomUUID()}@example.invalid`;
const password = `Browser-E2E-${randomUUID()}-Aa9!`;
let userId;
let server;
let browser;

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

  await page.goto(`${baseUrl}/dashboard`);
  await page.waitForURL(/\/login\?/);
  assert.match(page.url(), /\/login\?/, "unauthenticated browser must be redirected to login");

  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(`${baseUrl}/dashboard`);
  await page.getByRole("heading", { name: "Welcome to your account." }).waitFor();
  await page.getByText(email).waitFor();

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
  if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {});
}
