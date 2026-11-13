# Roadmap

## Implemented foundation and seller marketplace
- [x] Create a separate Supabase Free project in the MRA account and ap-south-1 region; preserve the existing MRA project.
- [x] Create 11 core PostgreSQL tables and enable RLS on all application tables.
- [x] Restrict anonymous listing reads to published listings and seller writes to their own eligible drafts.
- [x] Keep exact property location, evidence metadata, inquiries, service requests, consent and audit data outside public client access.
- [x] Create a private evidence bucket with a PDF/JPEG/PNG allowlist and 15 MiB limit; browser upload/download policies remain disabled.
- [x] Generate and commit Supabase TypeScript database types and initial schema migrations.
- [x] Implement Next.js 15 Supabase SSR/browser clients, cookie refresh middleware and environment validation.
- [x] Implement email/password sign-up, sign-in, confirmation callback, password reset/update, sign-out and protected account dashboard.
- [x] Implement authenticated seller draft creation, database-generated public references, atomic initial status events and seller-owned listing views.
- [x] Enforce listing lifecycle transitions in PostgreSQL, including seller submission, reviewer decisions, publisher-only publication, atomic status history and audit events.
- [x] Connect public catalogue and detail pages to published database listings only.
- [x] Add seller listing validation and automated domain tests.
- [x] Add a passing CI workflow for dependency audit, domain tests, TypeScript, ESLint and production build.
- [x] Commit `package-lock.json` and enforce reproducible CI installation with `npm ci`.

## Staff moderation and access control
- [x] Add a claims-gated reviewer queue for submitted and in-review listings.
- [x] Add reviewer actions to start review, request changes, approve or reject with a mandatory reason, using the database transition RPC.
- [x] Implement a JWT-verified Supabase Edge Function for audited staff role provisioning/revocation, including restricted first-admin bootstrap logic (deployment and bootstrap configuration still required).
- [x] Implement a publisher-only queue for approved listings with reasoned publication through the database lifecycle RPC.
- [x] Add database-backed service-request assignment, active-role checks, role-specific status transitions, and append-only status/audit events.
- [x] Enforce assignment-based staff reads for case managers and active-role validation for intake/admin access.
- [x] Run a transactional live RLS probe for request owners, two separately assigned case managers, intake coordinators and revoked case managers; synthetic users, roles, requests and history rows are rolled back.
- [x] Run a transactional live RPC authorization probe for intake assignment, assigned case-manager progress, cross-case-manager denial, assignment denial, administrator transition denial and revoked-role denial; verify matching history/audit records and roll back all synthetic data.
- [ ] Add live JWT/RLS integration tests for anonymous, seller, reviewer, publisher and administrator roles, plus end-to-end browser authentication.
- [x] Run the guarded, manual Supabase CLI migration-history reconciliation workflow; verified all nine repository migrations are recorded in the dedicated remote project (workflow run 43383757509).
- [x] Add isolated local Supabase migration replay and transactional authorization probes to CI; all ten migrations and all four probes pass.
- [x] Capture a read-only live Supabase security, performance and health advisor baseline; security and health returned no findings (performance notices documented).
- [ ] Add non-production remote migration drift validation after history reconciliation.

## Client operations and property evidence
- [x] Implement public inquiry persistence, atomic consent/audit records, PostgreSQL rate limiting, and a public contact form connected to the API. (Private deployment secrets and live smoke test remain pending.)
- [x] Implement authenticated service-request creation and owner/staff read boundaries, atomic consent/audit records, and per-user rate limiting. (Private deployment secret and live authenticated smoke test remain pending.)
- [x] Add a role-gated staff service-request queue with intake/admin assignment, case-manager assignment-scoped handling, reasoned status updates and recent status history. (Named-staff assignment is implemented; notifications and live JWT tests remain pending.)
- [x] Add authenticated, same-origin, owner-checked server-side document intake into private quarantine with PDF/JPEG/PNG signature checks, SHA-256 metadata and upload audit events.
- [x] Replace the race-prone pending-file count check with an atomic per-owner database reservation enforcing the five-pending-file quota; failed Storage writes release the reservation. CI now exercises five successful reservations, sixth-file denial and server-only RPC grants.
- [ ] Add broader upload rate controls and configure/verify platform-level request-body limits.
- [x] Add a server-only, SHA-256-bound, one-way scan-completion RPC with atomic scan audit; CI verifies client roles cannot call it, digest mismatches are rejected, and successful results are recorded. (This is only a database primitive—not a deployed scanner or authenticated scanner callback.)\n- [ ] Integrate a real malware scanner with authenticated callback/signature verification, quarantine recovery/cleanup, authorized private download, short-lived signed URLs and download audit.
- [ ] Add full document format validation and live end-to-end upload tests.
- [ ] Add public media metadata, image moderation and approved listing-image publication.
- [ ] Add reviewed knowledge/video content and content-management workflow.

## Production readiness — not yet achieved
- [ ] Configure production Auth redirect URLs, email provider/templates, CAPTCHA and test flows against a real mailbox and HTTPS domain.
- [ ] Confirm Data API exposure settings and test access boundaries on deployed endpoints.
- [x] Generate and commit a reproducible dependency lockfile.
- [ ] Complete accessibility, browser/device, security and penetration testing.
- [ ] Complete Bangladesh legal/privacy review and assign an operational owner.
- [ ] Configure free-tier-compatible deployment/domain, monitoring, alerting, retention, backup and restore drill.
- [ ] Verify business identity, contact channels, legal credentials and real property inventory before public launch.

The repository has a working foundation, authentication flow, seller draft/submission workflow, published-only catalogue, inquiry and service-request intake, and a private document quarantine intake endpoint. It is not production-ready. Quarantined documents are not downloadable and no malware scanner is deployed. A passing CI build does not prove live email delivery, staff authorization setup, document safety, legal compliance, populated inventory, configured server secrets or deployed runtime behavior.
