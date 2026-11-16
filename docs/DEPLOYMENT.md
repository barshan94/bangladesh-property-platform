# Deployment Plan

## Status
A Vercel project is configured and has a READY Production deployment at `https://bangladesh-property-platform.vercel.app`. The default Vercel domain is attached; a client-owned custom domain is not configured. Vercel SSO protection is limited to Preview deployments, so the Production target is intended to be publicly accessible. Full production operation remains blocked by pending database migrations and operator setup.

## Environment separation
- Local development: synthetic data and isolated credentials.
- Preview/staging: non-production data and restricted access where needed.
- Production: approved domain, production secrets, monitoring, backup, and controlled staff access.

## Deployment requirements
- Reproducible builds and pinned dependencies.
- CI checks for lint, type checking, unit tests, and security-sensitive tests.
- Protected production branch and reviewed changes.
- Secrets managed outside source control.
- Database migrations reviewed and applied through a controlled process.
- Health checks, error monitoring, and rollback plan.
- Private storage permissions validated after deployment.
- DNS, TLS, email domain authentication, and privacy notices configured.
- No production launch until legal, security, operations, and support gates are signed off.

## Upload boundary

Confidential document upload is explicitly excluded from this MVP. The upload, scanner-callback and recovery endpoints return HTTP 410; do not configure document-scanner or document-recovery secrets and do not accept confidential customer files.

Listing-image intake is a separate feature in source code. Its request-size and host-runtime behavior must be verified on Vercel before enabling it for real sellers. The Production deployment exists at the default `vercel.app` domain; no client-owned custom domain is connected. Pending database migrations and Auth configuration still block full production operation.

## Provider selection
Evaluate pricing, free-tier limits, Bangladesh/Asia latency, data location, backups, access controls, portability, and operational complexity. Do not select a provider solely because a free tier exists.


## Environment and secret inventory

The Next.js application currently reads the following variables. Configure them in the selected hosting provider only after the provider and production origin are approved.

| Variable | Scope | Required for | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Auth, listings and service requests | Dedicated project URL; HTTPS outside localhost |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Browser/server Supabase clients | Publishable key only; never a secret/service-role key |
| `NEXT_PUBLIC_SITE_URL` | Public build/runtime | Auth redirect and canonical origin configuration | Configured in Vercel for all environments as `https://bangladesh-property-platform.vercel.app`; update if a custom domain is approved |
| `SUPABASE_SECRET_KEY` | Server only | Public inquiry, authenticated service requests, listing-media intake and reviewer-only private image previews | Sensitive Vercel environment entry exists; verify it with a server-side smoke test. Never expose it to browser code |
| `INQUIRY_RATE_LIMIT_SECRET` | Server only | HMAC rate-limit key derivation for public inquiries | Generated and configured as a sensitive Vercel environment variable; do not reuse the Supabase key |

Do not copy values from this document into production. Use separate credentials for local, preview and production environments. If the selected host cannot provide a trusted client-IP header, the public inquiry endpoint must remain disabled; do not accept a client-controlled `x-forwarded-for` fallback. The endpoint currently accepts `x-real-ip` or `x-vercel-forwarded-for`, and those headers must be confirmed as overwritten/set by the actual trusted ingress proxy.

### Supabase Edge Function secrets

The deployed `manage-staff-role` function requires:
- `SUPABASE_URL` — project URL (normally supplied by Supabase Edge Functions).
- `SUPABASE_SERVICE_ROLE_KEY` — server-managed privileged key, set only in Supabase Edge Function secrets.
- `STAFF_BOOTSTRAP_ADMIN_USER_ID` — one-time UUID for the intended first administrator. Set only for bootstrap, then remove after successful role creation.

Never put Edge Function secrets in GitHub Actions, the Next.js environment, `.env.example`, or client code. The function's existence does not mean the first administrator has been provisioned.

### GitHub Actions secrets

The manual migration-history reconciliation workflow requires:
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

These are used only by the guarded historical workflow to link the dedicated project and reconcile previously verified migration-history entries. The workflow does not execute migration SQL and must not be used to mark 18 pending migrations (versions 10–27) as applied.

## Pre-launch verification sequence

1. Confirm Vercel Hobby limits, data processing terms, region/latency, trusted proxy behavior, and rollback support; connect a client-owned custom domain if the client has one.
2. Configure the environment variables above in the correct environment scopes; verify the public bundle contains no privileged key.
3. Configure Supabase Auth Site URL, exact callback allowlist, email delivery and CAPTCHA/bot controls as documented in [Authentication](./AUTHENTICATION.md).
4. Confirm the trusted ingress headers with a deployed request. If their provenance is uncertain, fail closed and do not expose public inquiry traffic.
5. Run a real signup, confirmation, login, password reset and logout test using a controlled mailbox.
6. Submit one consented test inquiry and one authenticated service request; verify generated references and database audit/consent rows, then remove test data under an approved test-data procedure.
7. Bootstrap the first administrator, remove the bootstrap secret, grant minimum required staff roles, and test each role with separate accounts.
8. After separately approved migration application and schema verification, confirm the remote migration list and local/remote schema state. Use the historical reconciliation workflow only for previously verified bookkeeping; never use it to bypass unapplied migrations.
9. Complete backup/restore, monitoring, incident response, legal/privacy approval, retention and operator assignment before accepting real client data.


## Reproducible npm installation

**Completed:** `package-lock.json` is committed to `main`. The regular CI workflow uses `npm ci` and has passed dependency installation, `npm audit --audit-level=high`, domain-policy tests, TypeScript validation, ESLint and the production build on the latest verified commit.

The old lockfile-generation workflow is historical and is not required for normal development or deployment. Any dependency change must update `package-lock.json` in the same reviewed commit; CI must continue using `npm ci`.
