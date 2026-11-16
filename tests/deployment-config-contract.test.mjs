import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("deployment documentation lists every server secret used by inquiry and service-request APIs", async () => {
  const [inquiry, serviceRequests, deployment, envExample] = await Promise.all([
    readFile(new URL("../src/app/api/inquiries/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../src/app/api/service-requests/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../docs/DEPLOYMENT.md", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);
  for (const variable of ["NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SECRET_KEY", "INQUIRY_RATE_LIMIT_SECRET"]) {
    assert.ok(inquiry.includes(variable) || serviceRequests.includes(variable), `API must reference ${variable}`);
    assert.ok(deployment.includes(variable), `Deployment guide must document ${variable}`);
  }
  assert.match(envExample, /^SUPABASE_SECRET_KEY=/m);
  assert.match(envExample, /^INQUIRY_RATE_LIMIT_SECRET=/m);
  assert.doesNotMatch(envExample, /^NEXT_PUBLIC_(?:SUPABASE_)?(?:SECRET|SERVICE_ROLE)/m);
  assert.match(deployment, /x-vercel-forwarded-for/);
  assert.match(deployment, /trusted ingress proxy/);
});

test("confidential document exchange is excluded rather than exposing a partial upload pipeline", async () => {
  const [uploadRoute, deployment, handoff] = await Promise.all([
    readFile(new URL("../src/app/api/private-documents/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../docs/DEPLOYMENT.md", import.meta.url), "utf8"),
    readFile(new URL("../docs/CLIENT_HANDOFF.md", import.meta.url), "utf8"),
  ]);
  assert.match(uploadRoute, /CONFIDENTIAL_DOCUMENT_EXCHANGE_EXCLUDED_FROM_MVP/);
  assert.match(uploadRoute, /status: 410/);
  assert.doesNotMatch(uploadRoute, /formData\(|storage\.from\(|reserve_private_document_slot/);
  assert.match(deployment, /A Vercel project is configured and has a READY Production deployment/i);
  assert.match(deployment, /client-owned custom domain is not configured/i);
  assert.match(deployment, /Full production operation remains blocked/i);
  assert.match(handoff, /out of scope for this submitted MVP/i);
});
