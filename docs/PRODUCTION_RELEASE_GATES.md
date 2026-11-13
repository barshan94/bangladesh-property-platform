# Production release gates

**Decision: NO-GO.** This repository is not ready to accept live customers, confidential evidence, property transactions, or public launch traffic.

This document turns the current roadmap into verifiable release gates. A checkbox is not complete merely because source code exists; each gate needs evidence from the target production environment and an identified operator.

## Gate 0 — Repository and supply-chain hygiene

- [ ] Confirm repository visibility is intentional. The repository is currently public, although the original setup plan specified private visibility. Review every committed file and Git history for secrets, personal data, internal-only material and unsafe operational detail before deciding whether to change visibility.
- [x] Commit `package-lock.json` and use `npm ci` in CI.
- [x] Confirm CI run #657 passes on exact commit `a5e7f0c18d9feb2e43a00e6fb4157250f9253c24` (dependency audit, domain tests, TypeScript, ESLint and production build).
- [ ] Review dependency audit findings and overrides; do not treat a successful install as proof that dependencies are vulnerability-free.
- [ ] Protect the release branch and require reviewed changes.

**Evidence recorded:** CI run [#657](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43469331274) passed on `a5e7f0c18d9feb2e43a00e6fb4157250f9253c24`. This closes only the exact-commit CI checkbox; repository visibility, history/secret review, dependency audit review and branch protection remain open.

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
- [ ] Complete full parser validation and malformed, polyglot, resource-exhaustion and failure-injection tests.
- [ ] Implement authorized private downloads, short-lived scoped URLs, download audit and safe quarantine cleanup.
- [ ] Verify actual hosting request-body limits and upload behavior on the deployed platform.
- [ ] Implement publisher-controlled listing-media publication state and audit RPCs, owner-independence checks and an application delivery route backed by private Storage.
- [ ] Keep confidential document intake and public listing images disabled until every relevant control is deployed and tested. Do not create a public evidence bucket.

**Current behavior:** document intake is quarantine-only; no malware scanner or authorized download path is deployed. Listing media has private intake and reviewer preview source code, but no publisher-controlled public promotion. Public listing images remain disabled.

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
