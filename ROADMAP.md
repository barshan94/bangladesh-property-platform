# Roadmap

## Backend foundation — 2026-11-12
- [x] Create a separate Supabase project in the MRA account and ap-south-1 region; preserve the existing MRA project.
- [x] Create 11 core PostgreSQL tables for profiles, roles, listings, private property details, listing history, inquiries, service requests, private documents, access events, audit events and consent.
- [x] Enable RLS on all 11 application tables.
- [x] Restrict public listing reads to published listings and seller writes to their own unpublished listings.
- [x] Keep exact property location and confidential workflow tables outside public client access.
- [x] Create a private evidence bucket with PDF/JPEG/PNG allowlist and 15 MiB limit; leave client access disabled until scanning and server authorization exist.
- [x] Generate and commit Supabase TypeScript database types.
- [x] Commit the matching initial schema SQL to `supabase/migrations/`.
- [ ] Reconcile the committed migration with Supabase CLI local migration history and add migration validation to CI.
- [ ] Add real JWT-based RLS integration tests for anonymous, seller, reviewer, publisher and administrator roles.
- [x] Implement Next.js 15 Supabase SSR/browser clients, cookie refresh middleware and public environment validation.
- [x] Implement email/password sign-up, sign-in, PKCE email confirmation callback, password reset/update, sign-out and authenticated dashboard shell.
- [ ] Configure production Auth redirect URLs, email provider/templates, CAPTCHA and test flows against a real mailbox and HTTPS domain.
- [ ] Implement trusted staff role provisioning and revocation; never allow users to assign their own roles.
- [ ] Implement inquiry and service-request API routes with server validation, persistent rate limiting, spam protection, consent and audit records.
- [ ] Implement atomic listing submission, review decisions, publication and append-only status events.
- [ ] Implement trusted file-byte inspection, malware scanning, quarantine, private upload/download, short-lived signed URLs and access audit.
- [ ] Add staff assignment and scoped client/staff workspaces.
- [ ] Add content management and approved public media workflow.

## Private document quarantine policy — 2026-11-12
- [x] Add a strict pure policy utility for private evidence purpose, supported MIME types, 15 MiB maximum size and scan-state handling.
- [x] Reject infected, unsupported, invalid and oversized document metadata; keep pending or errored scans quarantined.
- [x] Add TypeScript declarations and automated policy tests.
- [ ] Implement trusted server-side byte inspection and malware scanning; never trust browser-supplied MIME or scan status.

## Production readiness (not yet achieved)
- [ ] Confirm Data API exposure settings and test access boundaries on deployed endpoints.
- [ ] Complete dependency lockfile and reproducible CI install.
- [ ] Complete accessibility, browser/device, security and penetration testing.
- [ ] Complete Bangladesh legal/privacy review and operational ownership.
- [ ] Configure deployment/domain, monitoring, alerting, retention, backup and restore drill.
- [ ] Verify all public content, contact channels, business identity, legal credentials and property inventory before publication.

The database foundation is implemented but the application is not production-ready. A passing schema check does not prove auth flows, API routes, malware scanning, legal compliance or deployment.
