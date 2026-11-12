# Project Memory

## 2026-11-12 — Supabase backend foundation
- Selected Supabase Free only; no paid plans, add-ons or branches.
- Created project `bangladesh-property-platform` in the separately connected MRA account.
- Project ref: `xpbjdeknjudurulogjkr`; organization: `jaydlyntvzyssqnbrjxs`; region: `ap-south-1`; status verified `ACTIVE_HEALTHY`.
- The existing `MRA Project` in the same organization was not modified.
- Applied the initial PostgreSQL schema: 11 tables, RLS on all 11, explicit least-privilege grants and policies, indexes, and a private `private-evidence` bucket.
- Anonymous users can query only the public listing table; its RLS policy returns published listings only.
- Authenticated sellers can read their own listings and create/update their own unpublished listings. They cannot publish or approve.
- Staff listing read access uses trusted signed `app_metadata.roles` claims. Role provisioning is not implemented; no self-service role changes are allowed.
- Exact addresses/coordinates are separated into `listing_private_details`.
- Inquiries, service requests, private document metadata, document access events, audit events and consent records are server-only with explicit client-deny policies and no client grants.
- Private evidence bucket is non-public and limited to PDF/JPEG/PNG and 15 MiB. No client Storage policies exist; uploads/downloads remain disabled pending byte inspection, malware scanning and scoped server authorization.
- Generated database types committed at `src/types/database.types.ts`; schema source committed at `supabase/migrations/20261112131600_initial_backend_foundation.sql`.
- Initial verification found 11/11 tables with RLS enabled; anonymous listing SELECT grant present; anonymous inquiry access and authenticated private-document metadata access absent; private bucket present.
- First advisor pass found five missing FK indexes and two RLS initplan warnings; those were fixed. Explicit deny policies were added for server-only tables to make fail-closed intent auditable. Re-run advisors after docs/CI commit.
- Supabase changelog checked: new public tables are no longer automatically exposed through the Data API on new projects (effective October 30, 2026). Explicit grants are applied only to intended tables; project exposure settings still need confirmation.
- This milestone does not implement Auth UI, API routes, staff provisioning, malware scanning, file upload/download, listing moderation transactions, deployment or production operations.

## 2026-11-12 — Private document quarantine policy
- Added `src/lib/private-document-policy.mjs`, its TypeScript declaration and `tests/private-document-policy.test.mjs`.
- Policy permits only `listing_evidence` and `client_case`, PDF/JPEG/PNG, and files from 1 byte through 15 MiB.
- Clean scan state passes policy; pending/error states are quarantined; infected, unsupported and oversized inputs are rejected.
- GitHub Actions run 43232286730 passed dependency audit, domain policy tests, TypeScript, ESLint and production build at commit 726ac96981b3ebaa7f64b8180f03d4a2a9687bc1.
- Scope limitation: this utility does not inspect bytes, authenticate, scan malware, upload/store files, authorize downloads, issue signed URLs or persist audit records. Trusted server-side inspection and scanning are prerequisites.


## 2026-11-13 — Initial authentication implementation
- Pinned `@supabase/ssr@0.12.7` and `@supabase/supabase-js@2.119.0` after checking current package releases and Supabase's Next.js SSR documentation.
- Added typed browser/server Supabase clients and Next.js 15 `middleware.ts` session refresh using `auth.getClaims()`.
- Added email/password registration and login, PKCE confirmation callback, password reset and update, sign-out and a JWT-validated minimal dashboard.
- No service-role key is used or exposed. User-editable metadata is not used for roles.
- Dashboard is an account shell only; property, inquiry and staff workflows are not connected.
- Production Auth URL allowlist, email provider/template delivery, CAPTCHA, real-mailbox end-to-end tests, and a committed package lockfile remain outstanding.
