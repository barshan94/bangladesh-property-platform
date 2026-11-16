# Production release gates

**Decision: NO-GO.** This repository is not ready to accept live customers, confidential evidence, property transactions, or public launch traffic.

This document turns the current roadmap into verifiable release gates. A checkbox is not complete merely because source code exists; each gate needs evidence from the target production environment and an identified operator.

## Gate 0 — Repository and supply-chain hygiene

- [ ] Confirm repository visibility is intentional. The repository is currently public, although the original setup plan specified private visibility. Review every committed file and Git history for secrets, personal data, internal-only material and unsafe operational detail before deciding whether to change visibility.
- [x] Commit `package-lock.json` and use `npm ci` in CI.
- [x] Confirm CI run #658 passes on exact commit `36d8336c88cb04c15d1ab333b9353879a7ca2769` (dependency audit, domain tests, TypeScript, ESLint and production build).
- [ ] Review dependency audit findings and overrides; do not treat a successful install as proof that dependencies are vulnerability-free.
- [ ] Protect the release branch and require reviewed changes.

**Evidence recorded:** CI run [#658](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43469773993) passed on `36d8336c88cb04c15d1ab333b9353879a7ca2769`. This closes only the exact-commit CI checkbox; repository visibility, history/secret review, dependency audit review and branch protection remain open.

## Gate 1 — Supabase schema safety

- [ ] Compare the live schema, functions, grants, RLS policies, triggers and Storage configuration against all committed migrations.
- [ ] Resolve any schema drift before migration execution.
- [ ] Obtain and verify a recoverable backup of database data, Auth configuration and Storage object bytes. A database dump alone is not a complete backup.
- [ ] Obtain explicit authorization for the remote schema change.
- [ ] Apply the 18 pending repository migrations (versions 10–27) only through the documented controlled process; never mark them applied through migration-history bookkeeping.
- [ ] Verify migration history, grants, RLS behavior and application smoke tests after application.

**Current verified state:** the repository contains 28 migration files. The dedicated remote project records 10 migrations (original nine plus the targeted anonymous-read permission fix); 18 repository migrations (versions 10–27) remain unapplied. The targeted migration passed isolated database replay and authorization probes in [run 43807945424](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43807945424). Browser authentication E2E also passed in [run 43807945347](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43807945347). The latest full CI suite passed in [run 43808323177](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43808323177). Remote drift comparison and a verified recovery backup are outstanding. Do not run `supabase db push`, `supabase db reset`, or manually insert migration-history rows to bypass a mismatch.

**Evidence required:** reviewed schema diff, backup/restore evidence, approval record, migration output, post-migration probes and operator/timestamp record.

## Gate 2 — Authentication and staff operations

- [ ] Configure the production site URL, exact Auth redirect allowlist, email provider/templates and CAPTCHA or equivalent abuse controls.
- [ ] Test signup, email confirmation, login, password reset and logout through the deployed HTTPS origin using a controlled mailbox.
- [ ] Bootstrap the first administrator using the restricted one-time process, then remove the bootstrap secret.
- [ ] Provision named staff with least-privilege roles and verify reviewer, publisher, intake, case-manager and administrator boundaries using separate accounts.
- [ ] Verify revoked roles lose access and assignment-scoped case managers cannot access another person's cases.
- [ ] Confirm trusted ingress IP headers are set by the hosting proxy; do not trust client-supplied forwarding headers.

**Evidence required:** redacted test results, role matrix, bootstrap removal confirmation and deployed authorization tests.

## Gate 3 — Private documents and listing media

- [x] Explicitly exclude confidential document exchange from the submitted MVP. Upload, scanner-callback and recovery API routes return HTTP 410 before reading request bodies, accessing credentials, or touching Supabase/Storage.
- [x] State clearly in the README, security/privacy documentation and client handoff that no identity, title, ownership or client-case evidence is accepted, processed, stored or downloadable.
- [ ] If the client commissions a future document-exchange phase, implement and deploy the isolated ClamAV + qpdf + Poppler + Tesseract worker, atomic job leases, resource limits, signature freshness checks, digest verification, retries/idempotency, authorized downloads, audit-before-response, retention and safe cleanup. This is not part of the current MVP.
- [x] Implement publisher-controlled listing-media publication state and audit RPCs, owner-independence checks and a public delivery route backed by private Storage. Source, isolated migration replay, SQL authorization/projection probes and CI are complete; remote migration application and deployed-host verification remain pending.
- [ ] Keep public listing images disabled until the applicable migrations and deployed-host verification are complete.

**Current behavior:** confidential document exchange is not supported by this MVP. The document upload, scanner callback and recovery routes are disabled (HTTP 410); the database schema and processing design are dormant future-phase foundations only. Listing media has private intake, reviewer moderation, separate publisher-controlled publication, and a public delivery route that re-checks media and parent-listing publication. Required migrations remain unapplied remotely and the deployed runtime is unverified; public listing images remain disabled in production.

**Evidence required:** automated tests proving all document endpoints reject requests without reading or persisting payloads, plus handoff/security documentation confirming the exclusion. Future document exchange requires a separate acceptance gate.


## Gate 4 — Hosting, operations and recovery

- [ ] Confirm Vercel Hobby plan limits, function/request-body constraints, region, data terms, trusted proxy behavior and rollback support; select and connect a client-owned custom domain if required.
- [ ] Verify each server-side production secret through non-disclosing deployed smoke tests; never place privileged keys in browser variables or source control.
- [x] Vercel default domain has HTTPS and is attached to the project.
- [x] SSO protection is enabled for all non-custom domains while commercial hosting compliance is unresolved.
- [ ] Select a commercially permitted plan/provider. Vercel Hobby is personal/non-commercial only; use Vercel Pro or migrate to a commercially permitted free host before public client access.
- [ ] Connect the client's custom domain and configure DNS/email-domain authentication, monitoring, alerting and log redaction.
- [ ] Establish retention and deletion schedules, incident response, credential rotation and support ownership.
- [ ] Export encrypted backups including Storage objects; perform and record a restore rehearsal.
- [ ] Define and test recovery time and recovery point objectives (RTO/RPO).

**Current hosting state:** Vercel Production deployment exists at `https://bangladesh-property-platform.vercel.app`; its default domain is SSO-protected. No client-owned custom domain is configured. The connected Hobby plan is not permitted for this paid freelance deployment; choose Pro or a commercially permitted host before public release. The site remains `noindex` while real business identity/content/legal approval are outstanding. Monitoring, backup/restore rehearsal and named operator are not configured.

**Evidence required:** deployed health checks, smoke tests, alert test, backup manifest, restore report and named operational owner.

## Gate 5 — Legal, content and business verification

- [ ] Obtain Bangladesh legal/privacy review for the actual services, notices, consent, retention, cross-border processing and property-assistance claims.
- [ ] Verify business identity, contact channels, staff credentials and service scope.
- [ ] Verify every real property listing and obtain evidence/authorization before publication. Never fabricate inventory, testimonials, legal credentials or verification badges.
- [ ] Add reviewed Knowledge Hub content; editorial migrations must be safely applied before the CMS is enabled in production.
- [ ] Complete accessibility, keyboard, screen-reader, contrast, mobile-device, browser and security/penetration testing.
- [ ] Assign a named person responsible for customer support, moderation, incidents and legal escalation.

**Evidence required:** signed review, approved notices, verified business records, content approvals, test reports and named owner.

## Latest source verification — 2026-11-15 (PR head `eb845f254a331cc7eb4ea198911fb28f5811ac31`)

- Commit `361149a59781fdcc7e2066e5f7da00cc14a90f71` added the 4 MiB document-inspection ceiling and 8,192-marker JPEG budget, with boundary tests. CI `43678342722`, database policy tests `43678342730`, and browser-auth E2E `43678342783` all passed on that exact commit.
- The exact PR head `eb845f254a331cc7eb4ea198911fb28f5811ac31` passed all required workflows: CI [#876 / 43734292406](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43734292406), database policy tests [#267 / 43734292386](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43734292386), and browser authentication E2E [#264 / 43734292501](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43734292501). The database workflow replays committed migrations in an isolated local Supabase stack; this does not approve applying migrations 10–27 to the remote project.

## Release decision

Launch is permitted only when all applicable gates have evidence, unresolved high-severity findings are closed, and the accountable operator records a go-live decision. Until then:

- Do not advertise the platform as production-ready.
- Do not accept confidential ownership, identity or case documents; document exchange is excluded from this MVP.
- Do not imply that a listing or moderation decision proves title, ownership, legal clearance or property condition.
- Do not enable public listing images or live customer workflows that depend on unapplied migrations.
- Keep development and test data synthetic.

A green CI run is necessary, but it is not a production approval.


## Read-only live Supabase baseline — 2026-11-13

The connected dedicated project was inspected without changing its schema or data:

- Historical read-only baseline returned nine recorded versions. Since then, a single targeted grant migration (`20261116050502_grant_anon_select_user_roles_for_public_listing_policy`) was applied after production logs identified the public listing query failure. The current remote ledger records ten migrations; the 18 pending migrations remain unapplied.
- All 13 tables returned by the public-schema table inventory reported RLS enabled. The inventory showed zero rows in each table at inspection time; this is only a point-in-time row estimate and not a security proof.
- Security advisor: no lint findings returned.
- Health advisor: no lint findings returned.
- Performance advisor: one warning for multiple permissive UPDATE policies on `public.property_listings` (`listings_update_own_unpublished` and `listings_update_staff`), plus 21 INFO findings for unused indexes.

The duplicate UPDATE policies appear to represent distinct seller and staff paths, and PostgreSQL combines permissive policies with OR semantics. Do not delete either policy or change authorization behavior just to silence the warning. A future optimization may consolidate them into one policy only after a forward migration and seller/reviewer/publisher JWT/RLS probes prove the exact same USING and WITH CHECK boundaries. The unused-index findings are not a removal recommendation: the tables currently have no recorded rows and production query workload has not been established.

Advisor references:
- [Multiple permissive policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)
- [Unused index](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)

This is an advisor snapshot, not a complete remote schema-drift comparison, penetration test, or production approval.


## Latest document-workflow verification — 2026-11-15

The current draft PR head `54e211a29423d3eb9d86e1bf7e99c05e2b6cfba8` passed all three required GitHub Actions workflows: CI #824, database policy #215 and browser authentication E2E #212. This verifies the source and isolated test environment only.

**Provider decision remains open:** no real malware scanner or document-processing/OCR model is selected or configured. The existing scanner callback is an authenticated, digest-bound completion boundary; it does not scan or process files. The current PDF/PNG/JPEG checks are bounded structural screening, not full parser validation. Do not enable confidential document intake for customers or implement downloads until provider privacy terms, retention, residency, subprocessors, operator ownership and deployed failure behavior have been approved and tested.


## Free scanner and OCR architecture decision — 2026-11-15

The project has selected a free, self-hosted open-source processing stack instead of a commercial scanner or external AI/OCR API:

- ClamAV for malware scanning.
- qpdf for PDF structural validation.
- Poppler pdftotext for text extraction.
- Tesseract 5 for local OCR.

This decision removes per-document vendor/API charges and avoids transferring private property evidence to an external scanning or AI processor. It does not make compute, storage, backups, monitoring or operator time free. A continuously available client/operator-controlled worker host is still required.

Remaining release gates: implement the isolated non-root/no-network worker; enforce CPU, memory, file, page, pixel, output and timeout limits; refresh and verify ClamAV signatures; add atomic job leases and retry/idempotency; verify the exact original SHA-256 before and after processing; use the existing HMAC callback only for authenticated digest-bound results; implement authorized downloads and audit-before-response; test failure and recovery behavior on the actual worker host. Until all gates pass, confidential evidence intake and downloads remain disabled.

Do not claim that a selected open-source component is installed, running or production-accepted merely because it is named in this architecture decision.


## Latest source snapshot — 2026-11-16

- Reviewed main commit: `56070389de38e266b08131efc55ea531e60e89a2`.
- Full CI run [43808959813](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43808959813) completed successfully on that exact commit.
- Vercel production-target deployment [dpl_CsqM35MVwcrZGwsxgrE2Uykm3QSu](https://vercel.com/barshan-s-team/bangladesh-property-platform/CsqM35MVwcrZGwsxgrE2Uykm3QSu) is READY; its default domain remains SSO-protected.
- Current remote migration ledger records 10 migrations; 18 repository migrations remain unapplied. The security advisor returned no lint findings. The performance advisor reports one multiple-permissive-UPDATE-policy warning on `public.property_listings` and informational unused-index findings.
- See [Final Delivery Status](FINAL_DELIVERY_STATUS.md) for the concise handoff assessment and evidence. The release decision remains **NO-GO** until applicable gates are closed.
