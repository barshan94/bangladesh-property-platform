import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(
  new URL("../src/app/api/private-documents/route.ts", import.meta.url),
  "utf8",
);

test("private document intake is authenticated and server-secret only", () => {
  assert.match(route, /userClient\.auth\.getClaims\(\)/);
  assert.match(route, /process\.env\.SUPABASE_SECRET_KEY/);
  assert.doesNotMatch(route, /NEXT_PUBLIC_.*SECRET|service_role/i);
});

test("cookie-authenticated private uploads require the configured same origin", () => {
  assert.match(route, /request\.headers\.get\("origin"\)/);
  assert.match(route, /process\.env\.NEXT_PUBLIC_SITE_URL/);
  assert.match(route, /CROSS_ORIGIN_REQUEST_BLOCKED/);
  assert.match(route, /SAME_ORIGIN_REQUIRED/);
});

test("private document intake validates parent ownership before storage upload", () => {
  const listingCheck = route.indexOf("listing.owner_user_id !== actorId");
  const requestCheck = route.indexOf("serviceRequest.requester_user_id !== actorId");
  const storageUpload = route.indexOf("admin.storage.from(BUCKET).upload");
  assert.ok(listingCheck >= 0);
  assert.ok(requestCheck >= 0);
  assert.ok(storageUpload > listingCheck);
  assert.ok(storageUpload > requestCheck);
});

test("private document intake bounds bytes and detects actual file signatures", () => {
  assert.match(route, /15 \* 1024 \* 1024/);
  assert.match(route, /file\.size > MAX_FILE_BYTES/);
  assert.match(route, /detectPrivateDocumentMimeType\(bytes\)/);
  assert.match(route, /PENDING_DOCUMENT_LIMIT_REACHED/);
});


test("private document quota is reserved atomically before Storage upload", () => {
  const reservation = route.indexOf('admin.rpc("reserve_private_document_slot"');
  const upload = route.indexOf("admin.storage.from(BUCKET).upload");
  assert.ok(reservation >= 0);
  assert.ok(upload > reservation);
  assert.doesNotMatch(route, /count: "exact"/);
  assert.match(route, /DOCUMENT_QUOTA_RESERVATION_FAILED/);
  assert.match(route, /PRIVATE_STORAGE_UPLOAD_FAILED[\\s\\S]*?private_documents"\\)\\.delete/);
});

test("private document intake stores pending evidence and audits upload", () => {
  assert.match(route, /scanStatus: "pending"/);
  assert.match(route, /document_access_events/);
  assert.match(route, /action: "upload"/);
  assert.match(route, /DOCUMENT_AUDIT_WRITE_FAILED/);
});

test("private document intake never returns a download or signed URL", () => {
  assert.doesNotMatch(route, /createSignedUrl|signedUrl|downloadUrl/);
  assert.match(route, /scanStatus: "pending"/);
  assert.match(route, /not available for download/);
});

test("failed metadata or audit writes trigger storage cleanup", () => {
  assert.match(route, /if \(metadataError\)[\s\S]*?storage\.from\(BUCKET\)\.remove/);
  assert.match(route, /if \(auditError\)[\s\S]*?private_documents"\)\.delete[\s\S]*?storage\.from\(BUCKET\)\.remove/);
});
