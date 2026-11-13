import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(
  new URL("../src/app/api/private-documents/route.ts", import.meta.url),
  "utf8",
);
const quotaMigration = await readFile(
  new URL("../supabase/migrations/20261113140000_atomic_private_document_quota.sql", import.meta.url),
  "utf8",
);
const quotaProbe = await readFile(
  new URL("../supabase/tests/private_document_quota_probe.sql", import.meta.url),
  "utf8",
);
const scanMigration = await readFile(
  new URL("../supabase/migrations/20261113150000_trusted_document_scan_transition.sql", import.meta.url),
  "utf8",
);
const uploadRateMigration = await readFile(
  new URL("../supabase/migrations/20261113160000_private_document_upload_rate_limit.sql", import.meta.url),
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
  assert.match(route, /4 \* 1024 \* 1024/);
  assert.match(route, /MAX_CONTENT_LENGTH = MAX_FILE_BYTES \+ 128 \* 1024/);
  assert.match(route, /readBoundedBody\(request\)/);
  assert.match(route, /total > MAX_CONTENT_LENGTH/);
  assert.match(route, /await reader\.cancel\(\)/);
  assert.match(route, /new Request\(request\.url[\s\S]*?body: boundedBody/);
  assert.match(route, /REQUEST_TOO_LARGE/);
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
  assert.match(route, /PRIVATE_STORAGE_UPLOAD_FAILED[\s\S]*?private_documents"\)\.delete/);
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

test("failed upload reservation follow-up or audit writes clean up metadata and stored bytes", () => {
  assert.match(route, /PRIVATE_STORAGE_UPLOAD_FAILED[\s\S]*?private_documents"\)\.delete/);
  assert.match(route, /if \(auditError\)[\s\S]*?private_documents"\)\.delete[\s\S]*?storage\.from\(BUCKET\)\.remove/);
});

test("database quota reservation serializes each owner and restricts execution to the server role", () => {
  assert.match(quotaMigration, /pg_advisory_xact_lock/);
  assert.match(quotaMigration, /scan_status = 'pending'/);
  assert.match(quotaMigration, /if v_pending_count >= 5/);
  assert.match(quotaMigration, /insert into public\.private_documents/);
  assert.match(quotaMigration, /security invoker/);
  assert.match(quotaMigration, /grant execute[\s\S]*?to service_role/);
  assert.match(quotaMigration, /from public, anon, authenticated/);
});

test("database CI exercises the five-document quota and denies a sixth reservation", () => {
  assert.match(quotaProbe, /has_function_privilege\('anon'/);
  assert.match(quotaProbe, /has_function_privilege\('authenticated'/);
  assert.match(quotaProbe, /set local role service_role/);
  assert.match(quotaProbe, /EXPECTED_PRIVATE_DOCUMENT_QUOTA_DENIAL_NOT_RAISED/);
  assert.match(quotaProbe, /PENDING_DOCUMENT_LIMIT_REACHED/);
  assert.match(quotaProbe, /count\(\*\)[\s\S]*?<> 5/);
});


test("trusted scan completion is server-only, digest-bound, one-way and audited", () => {
  assert.match(scanMigration, /security definer/);
  assert.match(scanMigration, /scan_status = 'pending'/);
  assert.match(scanMigration, /d\.sha256_hex = p_expected_sha256_hex/);
  assert.match(scanMigration, /PRIVATE_DOCUMENT_SCAN_TARGET_MISMATCH_OR_ALREADY_SCANNED/);
  assert.match(scanMigration, /grant execute/);
  assert.match(scanMigration, /to service_role/);
  assert.match(scanMigration, /from public, anon, authenticated/);
  assert.match(scanMigration, /action, purpose, request_id/);
  assert.match(quotaProbe, /complete_private_document_scan/);
  assert.match(quotaProbe, /EXPECTED_PRIVATE_DOCUMENT_SCAN_DIGEST_REJECTION_NOT_RAISED/);
  assert.match(quotaProbe, /PRIVATE_DOCUMENT_SCAN_AUDIT_NOT_RECORDED/);
});


test("private document uploads are throttled before multipart body parsing", () => {
  const rateCheck = route.indexOf('admin.rpc("consume_private_document_upload_rate_limit"');
  const bodyParse = route.indexOf("request.formData()");
  assert.ok(rateCheck >= 0);
  assert.ok(bodyParse > rateCheck);
  assert.match(route, /p_limit: 10/);
  assert.match(route, /p_window_seconds: 3600/);
  assert.match(route, /status: 429/);
  assert.match(route, /retry-after/);
  assert.match(uploadRateMigration, /security definer/);
  assert.match(uploadRateMigration, /p_limit < 1 or p_limit > 50/);
  assert.match(uploadRateMigration, /grant execute/);
  assert.match(uploadRateMigration, /to service_role/);
  assert.match(uploadRateMigration, /from public, anon, authenticated/);
  assert.match(quotaProbe, /PRIVATE_DOCUMENT_UPLOAD_RATE_LIMIT_DID_NOT_BLOCK_ELEVENTH_REQUEST/);
  assert.match(quotaProbe, /PRIVATE_DOCUMENT_RATE_LIMIT_CLIENT_EXECUTE_GRANT_PRESENT/);
});
