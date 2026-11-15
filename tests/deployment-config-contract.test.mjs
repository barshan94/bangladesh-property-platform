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


test("private-document HTTP intake stays below the documented conservative request budget", async () => {
  const [uploadRoute, deployment] = await Promise.all([
    readFile(new URL("../src/app/api/private-documents/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../docs/DEPLOYMENT.md", import.meta.url), "utf8"),
  ]);
  const fileLimit = uploadRoute.match(/const MAX_FILE_BYTES = (\d+) \* 1024 \* 1024;/);
  const requestOverhead = uploadRoute.match(/const MAX_CONTENT_LENGTH = MAX_FILE_BYTES \+ (\d+) \* 1024;/);
  assert.ok(fileLimit, "private upload file limit must remain explicit");
  assert.ok(requestOverhead, "multipart overhead budget must remain explicit");
  const maxRequestBytes = Number(fileLimit[1]) * 1024 * 1024 +
    Number(requestOverhead[1]) * 1024;
  assert.ok(Number.isSafeInteger(maxRequestBytes));
  assert.ok(maxRequestBytes < 4.5 * 1024 * 1024,
    "private upload request budget must remain below the 4.5 MiB conservative ceiling");
  assert.match(deployment, /No production host has been selected or deployed/i);
  assert.match(deployment, /verify on the chosen host/i);
  assert.match(deployment, /4\.5 MiB/i);
});
