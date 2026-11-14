import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const route = await readFile(
  new URL("../src/app/api/private-documents/recovery/route.ts", import.meta.url),
  "utf8",
);

test("quarantine recovery is a server-only, cron-authenticated operation", () => {
  assert.ok(route.includes("process.env.CRON_SECRET"));
  assert.ok(route.includes("timingSafeEqual"));
  assert.ok(route.includes('authorization.startsWith("Bearer ")'));
  assert.ok(route.includes("process.env.SUPABASE_SECRET_KEY"));
  assert.ok(route.includes('secretKey.startsWith("sb_secret_"'));
});

test("recovery selects only stale pending, non-deleted, digest-bound documents in bounded batches", () => {
  assert.ok(route.includes("STALE_AFTER_HOURS = 24"));
  assert.ok(route.includes("MAX_BATCH_SIZE = 50"));
  assert.ok(route.includes('.eq("scan_status", "pending")'));
  assert.ok(route.includes('.is("deleted_at", null)'));
  assert.ok(route.includes('.not("sha256_hex", "is", null)'));
  assert.ok(route.includes('.lt("uploaded_at", cutoff)'));
  const digestFilter = route.indexOf('.not("sha256_hex", "is", null)');
  const batchLimit = route.indexOf(".limit(MAX_BATCH_SIZE)");
  assert.ok(digestFilter >= 0 && digestFilter < batchLimit);
});

test("recovery reuses the digest-bound audited transition and never deletes or serves objects", () => {
  assert.ok(route.includes("complete_private_document_scan"));
  assert.ok(route.includes("p_expected_sha256_hex: document.sha256_hex"));
  assert.ok(route.includes('p_scan_result: "error"'));
  assert.ok(route.includes('p_scan_engine: "quarantine-timeout"'));
  assert.ok(route.includes("p_request_id: randomUUID()"));
  assert.ok(!route.includes("manualReviewSkipped"));
  assert.ok(!route.includes("storage.from("));
  assert.ok(!route.includes("createSignedUrl"));
  assert.ok(!route.includes("createSignedUrls"));
  assert.ok(route.includes("Quarantine objects are retained"));
});

test("a thrown per-document RPC failure is counted and does not abort the recovery batch", () => {
  const loopStart = route.indexOf("for (const document of staleDocuments)");
  const rpcCall = route.indexOf('admin.rpc("complete_private_document_scan"', loopStart);
  const localCatch = route.indexOf("// One transient RPC exception", rpcCall);
  const failedCounter = route.indexOf("failed += 1;", localCatch);
  const loopEnd = route.indexOf("\n  }", localCatch);
  assert.ok(loopStart >= 0 && rpcCall > loopStart);
  assert.ok(localCatch > rpcCall && failedCounter > localCatch);
  assert.ok(loopEnd > failedCounter);
  assert.ok(route.includes("inspected: staleDocuments.length"));
  assert.ok(route.includes("recovered,\n    failed,"));
});

test("unexpected recovery dependency failures return a generic fail-closed response", () => {
  assert.ok(route.includes("async function handlePrivateDocumentRecovery(request: Request)"));
  assert.ok(route.includes("return await handlePrivateDocumentRecovery(request);"));
  assert.ok(route.includes('return respond(503, { error: "DOCUMENT_RECOVERY_UNAVAILABLE" });'));
  assert.ok(!route.includes("error.message"));
  assert.ok(!route.includes("exception.message"));
  assert.ok(!route.includes("err.message"));
});
