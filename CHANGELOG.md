## 2026-11-13 — Authenticated service-request workflow
- Added a signed-in client workspace to create and view the account's own service requests.
- Derived requester identity and email from verified Supabase Auth claims; browser-supplied account identity is ignored.
- Added an atomic database RPC that creates the request, consent record and audit event together.
- Added a per-user 5-per-15-minute rate limit protected by a transaction advisory lock.
- Added a district field and aligned the current service taxonomy while preserving legacy service codes.
- Kept client-side request mutations denied; users can read only their own requests, while trusted intake/case roles can read for handling.
- No attachments or confidential evidence are accepted; private deployment secret and live authenticated smoke test remain pending.

## 2026-11-13 — Public contact form connected
- Replaced the contact-page placeholder with an accessible inquiry form connected to `POST /api/inquiries`.
- Added supported service, country and property-district fields, explicit consent, submission feedback and generated reference display.
- Kept document uploads and confidential identity/property evidence out of the public form.
- Clarified that successful receipt does not guarantee operator review or a response.
- Updated the roadmap; private deployment secrets and live smoke testing remain pending.

## 2026-11-13 — Public inquiry API foundation
- Added a server-only public inquiry endpoint with strict allowlisted validation and bounded request size.
- Added persistent atomic per-IP HMAC rate limiting in PostgreSQL (5 requests / 15 minutes).
- Inquiry, consent provenance and audit event are persisted in one database transaction.
- The endpoint fails closed until private deployment secrets are configured; no service-role key is committed.

## 2026-11-13 — Secure staff role management function
- Added a JWT-verified Supabase Edge Function for audited staff role grant/revoke operations.
- Uses Supabase's server-managed service-role secret; no privileged key is added to the app or repository.
- Added a single-identity, self-only first-administrator bootstrap gate and last-administrator revocation protection.
- Requires active administrator state in both trusted JWT app metadata and the role table.
- Documents deployment, secret setup, bootstrap and compensating rollback limitations.

# Changelog

## 2026-11-13 — Staff listing moderation workspace
- Added a server-rendered reviewer queue limited to submitted and in-review listings.
- Added reviewer-only server actions for intake, change requests, approval and rejection through the existing database lifecycle RPC.
- Required a bounded decision reason for reviewer decisions; the database trigger remains the final enforcement layer.
- Kept reviewer approval separate from publisher-only publication.
- Updated roadmap and role documentation to match implemented behavior.

## 2026-11-13 — Live public property catalogue
- Replaced the hard-coded empty catalogue with Supabase-backed published listings only.
- Added public detail-page lookup by non-sequential reference, still restricted to published rows by RLS and query filters.
- Mapped database data without exposing owner IDs, exact private location, private documents, or invented trust labels and images.
- Added safe handling for lease listings and listings without a disclosed price.

## 2026-11-13 — Seller submission and lifecycle enforcement
- Added a seller submit-for-review action backed by a SECURITY INVOKER database RPC.
- Added database lifecycle enforcement for seller, reviewer and publisher roles; direct unauthorized status changes are rejected.
- Added atomic listing status history and audit records, required reasons for reviewer decisions, and role-separated publication.
- Smoke-tested seller submission, reviewer intake/approval, reviewer publish denial and audit counts under authenticated RLS context; all test rows were rolled back.
- No staff roles are assigned yet; reviewer/publisher UI and trusted role provisioning remain outstanding.

## 2026-11-13 — Seller draft creation foundation
- Added an authenticated private draft form and server action with owner ID derived from verified JWT claims.
- Aligned listing validation with database constraints, including division, lease listings, supported area bases and fractional bathrooms.
- Added private database triggers for generated public references and atomic initial status history.
- Drafts are not published or verified; image upload, evidence upload, submission and moderation remain disabled.

## 2026-11-13 — Auth profile bootstrap
- Added a hosted Supabase Auth trigger that creates the minimal profile row for each newly registered user.
- Kept the trigger function in the non-exposed private schema with an empty search path and no API-role execute grants.
- Added a transactional smoke test that inserted a temporary Auth user, verified its profile row, and rolled back; no test account was retained.
- Re-ran Supabase security advisors; no findings.

## 2026-11-12 — Supabase backend foundation
- Created a separate Supabase Free project in the MRA account; existing MRA and Primary projects were left untouched.
- Added 11 PostgreSQL application tables, constraints, indexes and RLS policies.
- Added seller-owned listing access, published-only anonymous listing reads and trusted staff-role read claims.
- Separated private property details from public listing fields.
- Kept inquiries, service requests, private document metadata, consent and audit tables server-only.
- Created a private evidence bucket with a 15 MiB PDF/JPEG/PNG policy and no client Storage policies.
- Generated and committed database TypeScript types and the initial schema migration source.
- Verification confirmed all 11 tables have RLS enabled and private client access is denied. Security and health advisors returned no findings; performance advisor reported unused-index notices on the empty database.
- This is a backend foundation only; authentication UI, server routes, scanning, document handling, moderation transactions and deployment are not complete.

## 2026-11-12 — Documentation foundation
- Added project charter, product requirements, feature scope, roles, user flows, service catalogue, verification policy, compliance review checklist, architecture proposal, security guidance, data/API design principles, UX/content strategy, testing, deployment, backup, and open questions.
- No production deployment, legal-service capability, verified property inventory or live contact channel is claimed.

## 2026-11-13 — Initial authentication implementation
- Added Supabase SSR/browser clients and session-refresh middleware for Next.js 15.
- Added email/password registration and sign-in, email confirmation callback, password reset/update, sign-out and a protected dashboard shell.
- Pinned Supabase SDK dependencies and added environment configuration template and authentication setup documentation.
- Production redirect URLs, email delivery configuration, bot protection and end-to-end mailbox verification remain outstanding.
