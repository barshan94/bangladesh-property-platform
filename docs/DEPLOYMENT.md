# Deployment Plan

## Status
No hosting provider, production domain, or deployment pipeline has been selected or configured.

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

## Provider selection
Evaluate pricing, free-tier limits, Bangladesh/Asia latency, data location, backups, access controls, portability, and operational complexity. Do not select a provider solely because a free tier exists.


## Environment and secret inventory

The Next.js application currently reads the following variables. Configure them in the selected hosting provider only after the provider and production origin are approved.

| Variable | Scope | Required for | Notes |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Auth, listings and service requests | Dedicated project URL; HTTPS outside localhost |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Browser/server Supabase clients | Publishable key only; never a secret/service-role key |
| `NEXT_PUBLIC_SITE_URL` | Public build/runtime | Auth redirect and canonical origin configuration | Exact origin; use HTTPS in production |
| `SUPABASE_SECRET_KEY` | Server only | Public inquiry and authenticated service-request persistence | Supabase secret key; never expose to browser or use a `NEXT_PUBLIC_` prefix |
| `INQUIRY_RATE_LIMIT_SECRET` | Server only | HMAC rate-limit key derivation for public inquiries | Generate an independent random secret of at least 32 characters; do not reuse the Supabase key |

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

These are used only by the guarded workflow to link the dedicated project and mark the four already-verified migration versions as applied. The workflow does not execute migration SQL. Its manual dispatch and successful final migration-list review remain outstanding.

## Pre-launch verification sequence

1. Select a hosting provider and confirm its current free-tier limits, data processing terms, region/latency, trusted proxy behavior, and rollback support.
2. Configure the environment variables above in the correct environment scopes; verify the public bundle contains no privileged key.
3. Configure Supabase Auth Site URL, exact callback allowlist, email delivery and CAPTCHA/bot controls as documented in [Authentication](./AUTHENTICATION.md).
4. Confirm the trusted ingress headers with a deployed request. If their provenance is uncertain, fail closed and do not expose public inquiry traffic.
5. Run a real signup, confirmation, login, password reset and logout test using a controlled mailbox.
6. Submit one consented test inquiry and one authenticated service request; verify generated references and database audit/consent rows, then remove test data under an approved test-data procedure.
7. Bootstrap the first administrator, remove the bootstrap secret, grant minimum required staff roles, and test each role with separate accounts.
8. Reconcile migration history using the manual workflow and confirm all local/remote versions align without running schema SQL.
9. Complete backup/restore, monitoring, incident response, legal/privacy approval, retention and operator assignment before accepting real client data.


## Reproducible npm installation

The repository does not yet contain a committed `package-lock.json`. Do not hand-write or guess dependency integrity hashes.

A guarded GitHub Actions workflow, `.github/workflows/generate-lockfile.yml`, generates the lockfile from the committed `package.json`, then verifies a clean `npm ci` installation, dependency audit, tests, TypeScript, ESLint and production build. Only after every check passes does it commit the generated lockfile to `main`.

To run it, open GitHub → Actions → **Generate and verify dependency lockfile** → **Run workflow** → select `main`. The workflow requires no repository secrets. Review the resulting commit and ensure the regular CI workflow passes on that commit. Until this workflow completes successfully and the lockfile is committed, the project still uses non-reproducible `npm install` in CI and must not be described as reproducibly installed.
