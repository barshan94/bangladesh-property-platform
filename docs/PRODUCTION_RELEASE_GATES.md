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
- [ ] Apply pending migrations 10–21 only through the documented controlled process; never mark them applied through migration-history bookkeeping.
- [ ] Verify migration history, grants, RLS behavior and application smoke tests after application.

**Current verified state:** 21 migrations replayed successfully in an isolated local Supabase stack. The dedicated remote project records migrations 1–9; migrations 10–21 remain unapplied. Remote drift comparison and a verified recovery backup are outstanding. Do not run `supabase db push`, `supabase db reset`, or manually insert migration-history rows to bypass a mismatch.

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

- [ ] Select and approve a real malware-scanning service and document its confidential-data processing terms, retention, location and subprocessors.
- [ ] Connect the scanner using an independently generated webhook secret and verify signature, replay, digest and failure behavior.
- [ ] Complete full parser validation and remaining malformed, polyglot and failure-injection tests. Current bounded screening enforces a 4 MiB document inspection ceiling, 4,096 PNG chunks and 8,192 JPEG markers, but is not a complete parser or malware scan.
- [ ] Implement authorized private downloads, short-lived scoped URLs, download audit and safe quarantine cleanup.
- [ ] Verify actual hosting request-body limits and upload behavior on the deployed platform.
- [x] Implement publisher-controlled listing-media publication state and audit RPCs, owner-independence checks and an application delivery route backed by private Storage. Source, isolated migration replay, SQL authorization/projection probes and CI are complete; remote migration application and deployed-host verification remain pending.
- [ ] Keep confidential document intake and public listing images disabled until every relevant control is deployed and tested. Do not create a public evidence bucket.

**Current behavior:** private-document intake is quarantine-only; no malware scanner or authorized download path is deployed. Listing media now has private intake, reviewer moderation, separate publisher-controlled publication, and a public delivery route that re-checks both media and parent-listing publication and serves canonical WebP from private quarantine. The code and isolated database probes are implemented, but the required migrations remain unapplied to the remote database and the deployed runtime is unverified; therefore public listing images remain disabled in production.

**Evidence required:** scanner contract and test report, deployed upload/download authorization tests, audit evidence and verified publication-state tests.

## Gate 4 — Hosting, operations and recovery

- [ ] Select a free-tier-compatible host only after checking current limits, region, data terms, request-body ceiling, trusted proxy behavior and rollback support.
- [ ] Configure production secrets in the host's secret manager; never place privileged keys in browser variables or source control.
- [ ] Configure HTTPS, DNS, email-domain authentication, monitoring, alerting and log redaction.
- [ ] Establish retention and deletion schedules, incident response, credential rotation and support ownership.
- [ ] Export encrypted backups including Storage objects; perform and record a restore rehearsal.
- [ ] Define and test recovery time and recovery point objectives (RTO/RPO).

**Evidence required:** deployed health checks, smoke tests, alert test, backup manifest, restore report and named operational owner.

## Gate 5 — Legal, content and business verification

- [ ] Obtain Bangladesh legal/privacy review for the actual services, notices, consent, retention, cross-border processing and property-assistance claims.
- [ ] Verify business identity, contact channels, staff credentials and service scope.
- [ ] Verify every real property listing and obtain evidence/authorization before publication. Never fabricate inventory, testimonials, legal credentials or verification badges.
- [ ] Add reviewed Knowledge Hub content; editorial migrations must be safely applied before the CMS is enabled in production.
- [ ] Complete accessibility, keyboard, screen-reader, contrast, mobile-device, browser and security/penetration testing.
- [ ] Assign a named person responsible for customer support, moderation, incidents and legal escalation.

**Evidence required:** signed review, approved notices, verified business records, content approvals, test reports and named owner.

## Latest source verification — 2026-11-15

- Commit `361149a59781fdcc7e2066e5f7da00cc14a90f71` added the 4 MiB document-inspection ceiling and 8,192-marker JPEG budget, with boundary tests. CI `43678342722`, database policy tests `43678342730`, and browser-auth E2E `43678342783` all passed on that exact commit.
- Documentation refresh commit `3ece619891d7d54a1c76b0cae30d34fc6b9a15dc` records the verified source limits and handoff. Its CI, database and browser workflows are pending at the time of this update.

## Release decision

Launch is permitted only when all applicable gates have evidence, unresolved high-severity findings are closed, and the accountable operator records a go-live decision. Until then:

- Do not advertise the platform as production-ready.
- Do not accept confidential ownership, identity or case documents.
- Do not imply that a listing or moderation decision proves title, ownership, legal clearance or property condition.
- Do not enable public listing images or live customer workflows that depend on unapplied migrations.
- Keep development and test data synthetic.

A green CI run is necessary, but it is not a production approval.


## Read-only live Supabase baseline — 2026-11-13

The connected dedicated project was inspected without changing its schema or data:

- The remote migration-history endpoint returned nine recorded versions. The repository's migration reconciliation document remains the source of truth for pending migration tracking; no migration was applied during this inspection.
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
