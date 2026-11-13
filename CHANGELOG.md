# Changelog\n\n## 2026-11-13 — Live public property catalogue\n- Replaced the hard-coded empty catalogue with Supabase-backed published listings only.\n- Added public detail-page lookup by non-sequential reference, still restricted to published rows by RLS and query filters.\n- Mapped database data without exposing owner IDs, exact private location, private documents, or invented trust labels and images.\n- Added safe handling for lease listings and listings without a disclosed price.\n\n\n## 2026-11-13 — Seller submission and lifecycle enforcement\n- Added a seller submit-for-review action backed by a SECURITY INVOKER database RPC.\n- Added database lifecycle enforcement for seller, reviewer and publisher roles; direct unauthorized status changes are rejected.\n- Added atomic listing status history and audit records, required reasons for reviewer decisions, and role-separated publication.\n- Smoke-tested seller submission, reviewer intake/approval, reviewer publish denial, publisher publication and audit counts under authenticated RLS context; all test rows were rolled back.\n- No staff roles are assigned yet; reviewer/publisher UI and trusted role provisioning remain outstanding.\n\n\n## 2026-11-13 — Seller draft creation foundation\n- Added an authenticated private draft form and server action with owner ID derived from verified JWT claims.\n- Aligned listing validation with database constraints, including division, lease listings, supported area bases and fractional bathrooms.\n- Added private database triggers for generated public references and atomic initial status history.\n- Drafts are not published or verified; image upload, evidence upload, submission and moderation remain disabled.\n

All notable project changes should be recorded here. Use dates and link commits or pull requests where possible.

## 2026-11-13 — Auth profile bootstrap
- Added a hosted Supabase Auth trigger that creates the minimal profile row for each newly registered user.
- Kept the trigger function in the non-exposed `private` schema with an empty search path and no API-role execute grants.
- Added a transactional smoke test that inserted a temporary Auth user, verified its profile row, and rolled back; no test account was retained.
- Re-ran Supabase security advisors; no findings.
- Login UI, cookie-based SSR session handling, email verification UX, password reset and trusted staff-role provisioning remain outstanding.

## 2026-11-12 — Supabase backend foundation
- Created a separate Supabase Free project in the MRA account; existing MRA and Primary projects were left untouched.
- Added 11 PostgreSQL application tables, constraints, indexes and RLS policies.
- Added seller-owned listing access, published-only anonymous listing reads and trusted staff-role read claims.
- Separated private property details from public listing fields.
- Kept inquiries, service requests, private document metadata, consent and audit tables server-only.
- Created a private evidence bucket with a 15 MiB PDF/JPEG/PNG policy and no client Storage policies.
- Generated and committed database TypeScript types and the initial SQL migration source.
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
