> **Authoritative live-status update — 2026-11-17 (supersedes earlier status snapshots below):** PR [#21](https://github.com/barshan94/bangladesh-property-platform/pull/21) is merged into `main` at `16b36d299b3120e906e8f72c134fb5c586b71e0b`. Latest PR-head CI, isolated database-policy and browser-authentication workflows passed before merge (runs [43910469780](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43910469780), [43910469596](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43910469596), [43910469717](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43910469717)). Vercel Production deployment `dpl_GH37BudsHVzHWKq3SCLkux1bgxm3` is `READY` from that merge commit; the default domain remains SSO-protected.
>
> **Supabase access restored and live database inspected read-only on 2026-11-17.** Existing project `xpbjdeknjudurulogjkr` (`bangladesh-property-platform`, `ap-south-1`) is `ACTIVE_HEALTHY`. The remote migration ledger contains **33 migrations**, through `20261116150000_admin_property_edit_and_inquiry_status`; the expected PR #20/#21 tables and functions are present. No live migration or data change was made during this inspection. All public tables have RLS enabled. The two private Storage buckets are `listing-media-quarantine` and `private-evidence`.
>
> **Important live blockers/findings:** there are currently **zero active user-role rows and zero active administrators**, so first-admin bootstrap and authenticated admin workflows remain untested/unavailable. Supabase Security Advisor reports leaked-password protection disabled; two public-schema tables have RLS but no policies (direct table access is revoked and their intended access is through guarded server/RPC paths); two public projection RPCs are executable by anon/authenticated as SECURITY DEFINER; their live definitions were reviewed and return only published listings, with listing media further restricted to approved and published media (map coordinates are rounded to two decimals). Direct SELECT on the underlying private tables is denied to anon/authenticated. Staff-only SECURITY DEFINER RPCs are executable by authenticated users but their function bodies check the active staff role. Performance Advisor reports six unindexed foreign keys and a multiple-permissive-policy warning on property listing UPDATE, plus unused-index information. These findings need a documented review and targeted remediation; do not indiscriminately revoke RPC grants or add broad RLS policies.
>
> **Release remains NO-GO for public customer operation.** Auth email delivery and leaked-password protection are not configured/verified; no administrator is bootstrapped; live transactional smoke tests, client-owned domain, commercially permitted hosting, approved business/legal content, manual accessibility/security review and named operational/recovery ownership remain open. Keep Vercel SSO protection enabled. Vercel Hobby is not suitable for this paid commercial client deployment; arrange compliant hosting before public release.
>
> **Handoff limits:** merged source and documentation are suitable for technical review/staging handoff only with limitations disclosed. Do not represent the site as a fully operational public marketplace or accept live customer/property transactions yet. Inquiry replies open a prepared email draft and are not sent by the website; payments/escrow and confidential document exchange are excluded. Confidential document upload/scanner/recovery routes return HTTP 410. Historical migration counts and prior database-access statements below are superseded by this update.
>
## 1. Current source and review status

- Repository: `barshan94/bangladesh-property-platform`
- Pull request: [#1 — merged](https://github.com/barshan94/bangladesh-property-platform/pull/1)
- Integrated branch: `main`
- Merge commit: `725f7c19aa88a393b2b4cdc0dee72be204ab46cd`
- PR head verified before merge: `ce118695b47d89f96ffd7073cb569be1835888e8`.
- Latest catalogue implementation adds combined keyword/location, district, property type, sale/rent/lease, minimum/maximum price, unit-safe minimum area, bedroom/bathroom and evidence-backed status filters. It includes six regression tests for filter combinations, null prices, area-unit safety, room facts, evidence labels and invalid numeric input.
- PR state: closed and merged.
- Production deployment: Vercel target `production`, READY, at [bangladesh-property-platform.vercel.app](https://bangladesh-property-platform.vercel.app). The homepage and `/properties` returned HTTP 200 after the targeted listing-read permission fix when inspected through authorized Vercel access. The default domain is currently SSO-protected, so public client access is not enabled. The custom domain is not configured.
- Remote Supabase migrations: 10 recorded (the original nine plus `grant_anon_select_user_roles_for_public_listing_policy`); 18 repository migrations, versions 10–27, remain unapplied. The targeted grant resolved the production anonymous catalogue query error without weakening RLS.

The PR head passed all three required GitHub Actions workflows before merge. Handoff documentation was then reconciled on `main`; documentation-only commits do not change the application implementation.

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

The latest catalogue change adds regression coverage for combined filters, price ranges, unit-safe area comparisons, bedroom/bathroom facts, evidence-backed status labels and invalid numeric input. The latest merged revision passed CI and browser authentication E2E. Earlier on this same implementation sequence, isolated Supabase migration replay and transactional authorization probes also passed. These checks cover the source and isolated test environment, not production acceptance.

### Post-merge production repair — 2026-11-16

Production logs showed the public listing RLS policy failed because the anonymous PostgREST role lacked table-level `SELECT` on `public.user_roles`. A narrow forward-only grant migration, `20261116050502_grant_anon_select_user_roles_for_public_listing_policy`, was applied and committed. RLS remains enabled and anonymous users see zero `user_roles` rows. After the fix, the homepage and `/properties` returned HTTP 200 and displayed the honest empty-inventory state. The migration replay/policy workflow passed (run 43807945424), browser-auth E2E passed (run 43807945347), and the latest full CI suite passed (run 43808323177). A Vercel Production deployment is READY on commit `4a86f7756df24c94b79d6ccb0fdbfbdd02ac5d46`.

These are automated source/local-environment checks, not deployed-host verification, penetration testing, legal approval or production acceptance. A successful isolated migration replay does not prove that applying pending migrations to the client's remote database is safe.

## 4. Developer setup

Requirements: Node.js 20 or newer, npm, Git. Docker and the Supabase CLI are required if the developer wants to run the local Supabase integration/database workflows.

1. Clone the repository and check out the reviewed branch:
   ```bash
   git clone https://github.com/barshan94/bangladesh-property-platform.git
   cd bangladesh-property-platform
   git checkout main
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

The live Supabase project `xpbjdeknjudurulogjkr` was inspected read-only on 2026-11-17. It is `ACTIVE_HEALTHY` and its migration ledger contains **33 recorded migrations**, through `20261116150000_admin_property_edit_and_inquiry_status`. The expected service-page, inquiry-admin and property-admin tables/functions exist. No production migration was applied during this inspection. The current live inventory has zero listings, zero inquiries and zero service requests; one Auth user exists but there are zero active staff roles and zero administrators.

A new forward-only optimization migration is proposed in [PR #22](https://github.com/barshan94/bangladesh-property-platform/pull/22): six covering indexes for live unindexed foreign keys and consolidation of the two equivalent permissive property-listing UPDATE policies. It is not yet merged or applied to production.

- Do not run `supabase db push`, `supabase db reset`, or manually insert migration-history rows as a shortcut.
- Do not apply PR #22 or any other production migration until the exact migration is reviewed, a recoverable backup including Auth configuration and Storage objects is verified, and the authorized operator approves the change.
- The Vercel Production deployment is READY but the default domain remains SSO-protected. No client-owned custom domain is configured. The connected Vercel Hobby plan is not suitable for this paid commercial freelance project; choose Vercel Pro or a host whose free plan permits commercial use before public release. Authenticated transactions, inquiry submission and staff workflows still need deployed end-to-end smoke tests.
- Public listing-media delivery and map projection must be smoke-tested against the live deployment; do not assume the production database migration ledger alone proves application functionality.

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

- [ ] Client reviews the merged deliverable and accepts the documented MVP scope.
- [ ] Client confirms that confidential document exchange, payments, escrow and live inventory population are excluded unless separately contracted.
- [ ] Client or receiving developer can follow the setup instructions, install dependencies and run the documented local checks with their own authorized development credentials.
- [ ] Client receives the repository, source branch, architecture/setup documentation, environment-variable inventory, test evidence and known limitations.
- [ ] Client confirms receipt of the handoff and records any separately agreed defects or change requests.

The following are **not prerequisites for accepting the source-code deliverable**; they are required only before the client operates a live public service: selecting hosting/domain, reviewing remote database drift and authorizing migrations, configuring production secrets/email/CAPTCHA, provisioning staff, supplying verified listings and approved content, legal/privacy approval, monitoring/backup/restore, and deployed accessibility/security/device checks. They must not be represented as completed by the developer simply because source CI passes.

## 8. Client/operator activation checklist

- [ ] Review the merged source deliverable and formally accept the source scope and limitations.
- [ ] Select hosting/domain; verify plan limits, region, data terms, request-body behavior, trusted proxy headers and rollback.
- [ ] Compare remote Supabase schema/functions/grants/RLS/Storage against the 18 pending repository migrations (versions 10–27).
- [ ] Verify a recoverable backup (database, Auth configuration and Storage bytes), obtain written authorization and apply only approved migrations through a controlled process.
- [ ] Configure production environment secrets and Supabase Auth Site URL, exact redirect allowlist, email templates/provider and CAPTCHA.
- [ ] Provision the first administrator using the restricted bootstrap flow; remove the one-time secret; provision named least-privilege staff roles.
- [ ] Run deployed HTTPS smoke tests for signup/confirmation/login/password reset/logout, inquiries, service requests, role boundaries, listing publication, images and approximate map pins.
- [ ] Supply verified property records and seller-authorized coordinates; check the displayed map area does not reveal an unintended exact address.
- [ ] Add reviewed Knowledge Hub content and approved business/contact details.
- [ ] Complete legal/privacy, accessibility, browser/device and security reviews.
- [ ] Configure monitoring, alerting, incident response, retention, encrypted backup/restore and name an operational owner.
- [ ] Record client go-live approval and rollback contact before public traffic.

## 9. User and staff instructions

The repository now includes plain-language operating instructions:

- [Website user guide](USER_GUIDE.md) explains browsing, inquiries, account access, seller drafts, service requests, Knowledge Hub access and the features that are not supported.
- [Client and staff operating guide](CLIENT_STAFF_GUIDE.md) explains staff roles, listing moderation/publication, media workflow, service-request handling, editorial review and operational boundaries.

These guides describe intended use while clearly flagging workflows that remain unavailable until the remote migrations and production release gates are completed. They are not evidence of a live deployment.

## 10. Submission package index

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

## 11. Handoff decision

**Current decision: source implementation merged; preliminary Vercel Production deployment exists; client acceptance pending; production operation remains NO-GO.** The merged deliverable must be reviewed and accepted by the client/repository owner. The client/operator must complete the migration, hosting, secrets, staff, legal, inventory, operational and deployed acceptance steps above. A passing CI run is evidence about tested code paths, not proof of production readiness.
