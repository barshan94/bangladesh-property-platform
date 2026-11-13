# Roadmap

## Implemented foundation and seller marketplace
- [x] Create a separate Supabase Free project in the MRA account and ap-south-1 region; preserve the existing MRA project.
- [x] Create 11 core PostgreSQL tables and enable RLS on all application tables.
- [x] Restrict anonymous listing reads to published listings and seller writes to their own eligible drafts.
- [x] Keep exact property location, evidence metadata, inquiries, service requests, consent and audit data outside public client access.
- [x] Create a private evidence bucket with a PDF/JPEG/PNG allowlist and 15 MiB limit; client uploads/downloads remain disabled pending scanning and server authorization.
- [x] Generate and commit Supabase TypeScript database types and initial schema migrations.
- [x] Implement Next.js 15 Supabase SSR/browser clients, cookie refresh middleware and environment validation.
- [x] Implement email/password sign-up, sign-in, confirmation callback, password reset/update, sign-out and protected account dashboard.
- [x] Implement authenticated seller draft creation, database-generated public references, atomic initial status events and seller-owned listing views.
- [x] Enforce listing lifecycle transitions in PostgreSQL, including seller submission, reviewer decisions, publisher-only publication, atomic status history and audit events.
- [x] Connect public catalogue and detail pages to published database listings only.
- [x] Add seller listing validation and automated domain tests.
- [x] Add a passing CI workflow for dependency audit, domain tests, TypeScript, ESLint and production build.

## Staff moderation and access control
- [x] Add a claims-gated reviewer queue for submitted and in-review listings.
- [x] Add reviewer actions to start review, request changes, approve or reject with a mandatory reason, using the database transition RPC.
- [x] Implement a JWT-verified Supabase Edge Function for audited staff role provisioning/revocation, including restricted first-admin bootstrap logic (deployment and bootstrap configuration still required).
- [x] Implement a publisher-only queue for approved listings with reasoned publication through the database lifecycle RPC.
- [x] Add database-backed service-request staff assignment, validated staff assignees, constrained status transitions, and append-only status/audit events. (Staff interface and live role-context tests remain pending.)
- [ ] Add assignment-based staff access and real JWT/RLS integration tests for anonymous, seller, reviewer, publisher and administrator roles.
- [ ] Reconcile committed migrations with Supabase CLI local migration history and add migration validation to CI.

## Client operations and property evidence
- [x] Implement public inquiry persistence, atomic consent/audit records, PostgreSQL rate limiting, and a public contact form connected to the API. (Private deployment secrets and live smoke test remain pending.)
- [x] Implement authenticated service-request creation and owner/staff read boundaries, atomic consent/audit records, and per-user rate limiting. (Private deployment secret and live authenticated smoke test remain pending.)
- [x] Add a role-gated staff service-request queue with self-assignment, reasoned status updates and recent status history. (Named staff assignment, notifications and live role tests remain pending.)
- [ ] Implement trusted file-byte inspection, malware scanning, quarantine, private upload/download, short-lived signed URLs and access audit.
- [ ] Add public media metadata, image moderation and approved listing-image publication.
- [ ] Add reviewed knowledge/video content and content-management workflow.

## Production readiness — not yet achieved
- [ ] Configure production Auth redirect URLs, email provider/templates, CAPTCHA and test flows against a real mailbox and HTTPS domain.
- [ ] Confirm Data API exposure settings and test access boundaries on deployed endpoints.
- [ ] Generate and commit a reproducible dependency lockfile.
- [ ] Complete accessibility, browser/device, security and penetration testing.
- [ ] Complete Bangladesh legal/privacy review and assign an operational owner.
- [ ] Configure free-tier-compatible deployment/domain, monitoring, alerting, retention, backup and restore drill.
- [ ] Verify business identity, contact channels, legal credentials and real property inventory before public launch.

The repository has a working foundation, authentication flow, seller draft/submission workflow, published-only catalogue, public inquiry intake and authenticated service-request intake. It is not production-ready. A passing CI build does not prove live email delivery, staff authorization setup, document scanning, legal compliance, populated inventory, configured server secrets or deployed runtime behavior.
