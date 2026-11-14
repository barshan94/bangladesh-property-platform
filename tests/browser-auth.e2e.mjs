import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
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
let listingId;
let documentId;
let storageKey;
let server;
let browser;

try {
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
  assert.ifError(error);
  userId = data.user.id;

  const { data: listing, error: listingError } = await admin.from("property_listings").insert({
    owner_user_id: userId,
    listing_kind: "sale",
    property_type: "apartment",
    headline: "Synthetic evidence upload test listing",
    description: "A synthetic listing created only for the isolated upload integration test.",
    division: "Dhaka",
    district: "Dhaka",
  }).select("id").single();
  assert.ifError(listingError);
  listingId = listing.id;

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

  const pdfBytes = new TextEncoder().encode("%PDF-1.7\n1 0 obj <<>> endobj\nstartxref\n9\n%%EOF\n");
  const upload = await page.evaluate(async ({ parentId, bytes }) => {
    const form = new FormData();
    form.append("file", new File([new Uint8Array(bytes)], "synthetic-evidence.pdf", { type: "application/pdf" }));
    form.append("purpose", "listing_evidence");
    form.append("listingId", parentId);
    const response = await fetch("/api/private-documents", { method: "POST", body: form });
    return { status: response.status, body: await response.json() };
  }, { parentId: listingId, bytes: [...pdfBytes] });
  assert.equal(upload.status, 202, `private document upload should return 202: ${JSON.stringify(upload.body)}`);
  assert.equal(upload.body.scanStatus, "pending");
  assert.ok(upload.body.documentId);
  documentId = upload.body.documentId;
  storageKey = `quarantine/${userId}/${documentId}`;

  const { data: storedDocument, error: documentError } = await admin.from("private_documents")
    .select("id, owner_user_id, listing_id, storage_key, detected_mime_type, size_bytes, sha256_hex, scan_status")
    .eq("id", documentId).single();
  assert.ifError(documentError);
  assert.equal(storedDocument.owner_user_id, userId);
  assert.equal(storedDocument.listing_id, listingId);
  assert.equal(storedDocument.storage_key, storageKey);
  assert.equal(storedDocument.detected_mime_type, "application/pdf");
  assert.equal(storedDocument.size_bytes, pdfBytes.byteLength);
  assert.equal(storedDocument.sha256_hex, createHash("sha256").update(pdfBytes).digest("hex"));
  assert.equal(storedDocument.scan_status, "pending");

  const { data: bucket, error: bucketError } = await admin.storage.getBucket("private-evidence");
  assert.ifError(bucketError);
  assert.equal(bucket.public, false, "private evidence bucket must not be public");

  const { data: storedObject, error: objectError } = await admin.storage.from("private-evidence").download(storageKey);
  assert.ifError(objectError);
  assert.deepEqual([...new Uint8Array(await storedObject.arrayBuffer())], [...pdfBytes]);

  const { data: auditEvents, error: auditError } = await admin.from("document_access_events")
    .select("action, actor_user_id, purpose").eq("document_id", documentId);
  assert.ifError(auditError);
  assert.equal(auditEvents.length, 1);
  assert.equal(auditEvents[0].action, "upload");
  assert.equal(auditEvents[0].actor_user_id, userId);

  console.log("Private document upload E2E passed: real browser session, owner-bound draft listing, bounded PDF intake, private Storage persistence, digest metadata and upload audit.");
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
  if (documentId) {
    await admin.storage.from("private-evidence").remove([storageKey]).catch(() => {});
    await admin.from("document_access_events").delete().eq("document_id", documentId).catch(() => {});
    await admin.from("private_documents").delete().eq("id", documentId).catch(() => {});
  }
  if (listingId) {
    await admin.from("listing_status_events").delete().eq("listing_id", listingId).catch(() => {});
    await admin.from("property_listings").delete().eq("id", listingId).catch(() => {});
  }
  if (userId) await admin.auth.admin.deleteUser(userId).catch(() => {});
}
