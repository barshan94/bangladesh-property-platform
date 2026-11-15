# Client handoff — Bangladesh Property Platform

**Handoff status: developer implementation is packaged; all three automated workflows passed on the latest verified application-source commit; production activation is not included.** This is a draft pull request, not a deployed website or an approved production release.

This document records what is in the repository, the exact source snapshot checked, how a developer can prepare the project, and what the client/operator must still do. Do not interpret a green CI run as a live-site or legal/security approval.

## 1. Current source and review status

- Repository: `barshan94/bangladesh-property-platform`
- Pull request: [#1 — Add audited publisher-controlled property image decisions](https://github.com/barshan94/bangladesh-property-platform/pull/1)
- Working branch: `feature/listing-media-publication`
- Latest verified application-source commit: `0b13fb81aa1410d5473ffeccbff5e383dc98d355`. The current PR head may be a later documentation-only commit.
- Latest catalogue implementation adds combined keyword/location, district, property type, sale/rent/lease, minimum/maximum price, unit-safe minimum area, bedroom/bathroom and evidence-backed status filters. It includes six regression tests for filter combinations, null prices, area-unit safety, room facts, evidence labels and invalid numeric input.
- PR state at handoff refresh: open, draft, unmerged.
- Production deployment: not performed.
- Remote Supabase migrations: not applied beyond the existing first nine recorded versions.

The application source at the exact commit above passed all three required GitHub Actions workflows. The handoff and roadmap documents are being refreshed separately; do not confuse their documentation-only commits with the verified application commit.

## 2. Delivered capabilities

| Area | Delivered in source | Limits / dependencies |
| --- | --- | --- |
| Public marketplace | Homepage, published-only catalogue and property detail pages with keyword/location, district, type, purpose, price range, unit-aware area, bedroom/bathroom and evidence-status filters | Live inventory is empty; no demo listings, reviews or testimonials are fabricated |
| Property maps | Optional seller-entered coordinates stored in private listing details; public projection returns coordinates rounded to two decimal places; property detail embeds an OpenStreetMap pin and nearby mapped streets/landmarks | Only listings with coordinates show a pin. The map is approximate (roughly kilometre scale, varying by latitude), not a precise meeting point. No geocoder or paid map API is configured |
| Authentication | Supabase SSR email/password signup, login, confirmation callback, password reset/update, logout and protected dashboard | Production domain, redirect allowlist, email delivery and CAPTCHA/bot controls require operator setup |
| Seller workflow | Seller-owned listing drafts, submission and owner-scoped views | Real staff accounts and roles must be provisioned |
| Moderation/publication | Reviewer decisions, separate publisher-controlled listing/media publication, required reasons and audit events | Depends on migrations pending on the remote database |
| Listing images | Authenticated image intake, canonical WebP processing, private quarantine, reviewer preview and publisher-controlled public delivery | Do not enable public delivery on the live site until migrations are applied and deployed behavior is verified |
| Inquiries | Validated public inquiry API, consent/audit persistence and atomic database rate limiting | Production secrets, trusted ingress headers and deployed smoke tests required |
| Service requests | Authenticated requests, requester boundaries, staff assignment and status history | Production secrets, migrations and staff setup required |
| Knowledge Hub | Editor workflow, administrator review/publication and published-only public routes | Editorial migrations are not applied remotely; reviewed content is not supplied |
| Confidential documents | Explicitly excluded from this MVP; upload, scanner callback and recovery routes return HTTP 410 | No confidential evidence is accepted, scanned, OCR-processed, stored or downloadable |
| Verification | Automated domain tests, dependency audit, TypeScript, ESLint, production build, isolated Supabase migration/policy probes and browser authentication E2E | These are automated source/local-environment checks, not penetration testing or production acceptance |

## 3. Verified checks

All three required GitHub Actions workflows completed successfully on the exact application commit `0b13fb81aa1410d5473ffeccbff5e383dc98d355`:

| Workflow | Run | Result |
| --- | --- | --- |
| CI — dependency audit, domain tests, TypeScript, lint and production build | [run 43740014248](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43740014248) | **Passed** |
| Database policy tests — isolated Supabase migration replay and authorization probes | [run 43740014252](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43740014252) | **Passed** |
| Browser authentication E2E — local Supabase and browser flow | [run 43740014292](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43740014292) | **Passed** |

The latest catalogue change adds regression coverage for combined filters, price ranges, unit-safe area comparisons, bedroom/bathroom facts, evidence-backed status labels and invalid numeric input. The suite reported 269 passing domain tests; TypeScript, ESLint, production build, isolated database policy probes and browser authentication E2E also passed on the same application commit.

These are automated source/local-environment checks, not deployed-host verification, penetration testing, legal approval or production acceptance. A successful isolated migration replay does not prove that applying pending migrations to the client's remote database is safe.

## 4. Developer setup

Requirements: Node.js 20 or newer, npm, Git. Docker and the Supabase CLI are required if the developer wants to run the local Supabase integration/database workflows.

1. Clone the repository and check out the reviewed branch:
   ```bash
   git clone https://github.com/barshan94/bangladesh-property-platform.git
   cd bangladesh-property-platform
   git checkout feature/listing-media-publication
   ```
2. Install the locked dependencies:
   ```bash
   npm ci
   ```
3. Create a local environment file:
   ```bash
   cp .env.example .env.local
   ```
   Set the Supabase URL and publishable key for an isolated development project that the developer is authorized to use. Keep `NEXT_PUBLIC_SITE_URL=http://localhost:3000` for local development. The example file contains placeholders and a project URL; verify every value before use. Never put a secret/service-role key in a `NEXT_PUBLIC_*` variable or commit real credentials.
4. Run the application checks:
   ```bash
   npm test
   npm run typecheck
   npm run lint
   npm run build
   npm run dev
   ```
   Open `http://localhost:3000`.
5. Use synthetic property/user data only. Do not upload confidential evidence; document exchange is disabled and out of scope.
6. For database integration testing, use a disposable local Supabase stack (Docker + Supabase CLI) and the repository's database-policy workflow/probes. Do not point local tests at the client's production project.

### Environment variables

The current application template includes:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — publishable key only.
- `NEXT_PUBLIC_SITE_URL` — exact application origin; localhost during local development.
- `SUPABASE_SECRET_KEY` — server-only key required by inquiry, service-request and listing-media server operations; never expose to browser code.
- `INQUIRY_RATE_LIMIT_SECRET` — independent random server-only secret, at least 32 characters, for inquiry IP HMAC derivation.

Do not configure scanner or document-recovery secrets for this MVP. Confidential document routes are disabled. The Edge Function's `SUPABASE_SERVICE_ROLE_KEY` and one-time `STAFF_BOOTSTRAP_ADMIN_USER_ID` are configured only in Supabase Edge Function secrets when an authorized operator performs first-admin bootstrap; remove the bootstrap secret immediately after use. GitHub migration workflow credentials belong only in GitHub Actions secrets and must never be copied into local app variables.

## 5. Database and deployment status

The repository currently contains **26 migration files**. The dedicated remote Supabase project `xpbjdeknjudurulogjkr` records migrations 1–9. Migrations 10–26 (17 migrations, including service-request staff workflows, dormant document schema, listing-media intake/review/publication, Knowledge Hub and public property map projection) remain unapplied remotely.

A full local replay and SQL probes passed in the isolated database workflow above. The remote schema has not been fully compared with all pending migration preconditions, and a verified recoverable backup has not been recorded. Therefore:

- Do not run `supabase db push`, `supabase db reset`, or manually insert migration-history rows as a shortcut.
- Do not apply migrations remotely until the authorized operator has reviewed schema drift, verified a recoverable backup including Auth configuration and Storage objects, approved the exact migration set, and recorded the change.
- No production host/domain has been selected or configured. No production deployment or deployed HTTPS smoke test has been performed.
- Public listing-media delivery and map projection cannot be assumed live until the relevant migrations are deliberately applied and the deployed runtime is verified.

## 6. Explicit exclusions and limitations

### Confidential document exchange — excluded

Confidential document exchange is out of scope for this submitted MVP.

The upload, scanner-callback and recovery routes return HTTP 410. No confidential identity, title, ownership or case evidence can be uploaded, scanned, OCR-processed, downloaded or safely exchanged through this MVP. Dormant database/schema and earlier processing code do not constitute an enabled feature. Do not ask customers to send these files through inquiries, service-request text, email or another improvised channel.

A future document-exchange phase requires separate scope and implementation: isolated worker, malware scanner, parser/OCR controls, resource/time limits, digest verification, authorization, audited downloads, retention/deletion and operational hosting.

### Map limitations

Map pins are optional and depend on sellers entering both valid coordinates. Public coordinates are rounded to two decimal places before delivery; this intentionally sacrifices precision to reduce exact-address exposure. It is not a substitute for address privacy review or a geocoding-quality check. The OpenStreetMap embed requires network access to OpenStreetMap; map tiles/availability are controlled by that external service. The project does not currently configure a paid map provider, automatic geocoding, routing, travel-time calculation or a comprehensive landmark database. Verify the intended public location and provider attribution/terms before launch.

### Other operational limitations

- No verified property inventory, business identity, testimonials, staff credentials or reviewed Knowledge Hub content has been populated.
- No production Auth email provider, CAPTCHA, monitoring/alerting, retention enforcement, incident response, encrypted backup/restore rehearsal or named production operator has been accepted.
- Bangladesh legal/privacy review, terms/notices/consent, cross-border processing and property-related claims need qualified local review.
- Accessibility (screen reader/contrast/real-device), browser/device, security/penetration and deployed performance testing remain client acceptance activities.
- Moderation or publication does not prove property ownership, title clearance, legal eligibility, physical condition or transaction safety.

## 7. Freelance source-handoff acceptance

The freelance source-code handoff can be reviewed and accepted without deploying the site or applying migrations to the client's live Supabase project. The following items define the developer deliverable:

- [ ] Client reviews and accepts the open draft PR and the documented MVP scope.
- [ ] Client confirms that confidential document exchange, payments, escrow and live inventory population are not included unless separately contracted.
- [ ] Client or receiving developer can follow the setup instructions, install dependencies and run the documented local checks with their own authorized development credentials.
- [ ] Client receives the repository, source branch, architecture/setup documentation, environment-variable inventory, test evidence and known limitations.
- [ ] Client confirms receipt of the handoff and records any separately agreed defects or change requests.

The following are **not prerequisites for accepting the source-code deliverable**; they are required only before the client operates a live public service: selecting hosting/domain, reviewing remote database drift and authorizing migrations, configuring production secrets/email/CAPTCHA, provisioning staff, supplying verified listings and approved content, legal/privacy approval, monitoring/backup/restore, and deployed accessibility/security/device checks. They must not be represented as completed by the developer simply because source CI passes.

## 8. Client/operator activation checklist

- [ ] Review the draft PR and formally accept the source scope and limitations.
- [ ] Select hosting/domain; verify plan limits, region, data terms, request-body behavior, trusted proxy headers and rollback.
- [ ] Compare remote Supabase schema/functions/grants/RLS/Storage against migrations 10–26.
- [ ] Verify a recoverable backup (database, Auth configuration and Storage bytes), obtain written authorization and apply only approved migrations through a controlled process.
- [ ] Configure production environment secrets and Supabase Auth Site URL, exact redirect allowlist, email templates/provider and CAPTCHA.
- [ ] Provision the first administrator using the restricted bootstrap flow; remove the one-time secret; provision named least-privilege staff roles.
- [ ] Run deployed HTTPS smoke tests for signup/confirmation/login/password reset/logout, inquiries, service requests, role boundaries, listing publication, images and approximate map pins.
- [ ] Supply verified property records and seller-authorized coordinates; check the displayed map area does not reveal an unintended exact address.
- [ ] Add reviewed Knowledge Hub content and approved business/contact details.
- [ ] Complete legal/privacy, accessibility, browser/device and security reviews.
- [ ] Configure monitoring, alerting, incident response, retention, encrypted backup/restore and name an operational owner.
- [ ] Record client go-live approval and rollback contact before public traffic.

## 9. Submission package index

- [README and project overview](../README.md)
- [Product requirements](PRODUCT_REQUIREMENTS.md)
- [Roadmap and implementation status](../ROADMAP.md)
- [Architecture and database schema](../ARCHITECTURE.md) · [schema reference](DATABASE_SCHEMA.md)
- [Security and privacy](SECURITY_AND_PRIVACY.md)
- [Listing-media workflow and release limits](LISTING_MEDIA_PIPELINE.md)
- [Knowledge Hub editorial workflow](KNOWLEDGE_CONTENT_WORKFLOW.md)
- [Migration inventory and safe-apply procedure](DATABASE_MIGRATION_RECONCILIATION.md)
- [Deployment and environment inventory](DEPLOYMENT.md)
- [Backup and recovery](BACKUP_AND_RECOVERY.md)
- [Bangladesh legal review register](BANGLADESH_LEGAL_COMPLIANCE.md)
- [Production release gates](PRODUCTION_RELEASE_GATES.md)

## 10. Handoff decision

**Current decision: source handoff candidate; production NO-GO.** The draft PR must be reviewed and accepted by the repository owner. The client/operator must complete the migration, hosting, secrets, staff, legal, inventory, operational and deployed acceptance steps above. A passing CI run is evidence about tested code paths, not proof of production readiness.
