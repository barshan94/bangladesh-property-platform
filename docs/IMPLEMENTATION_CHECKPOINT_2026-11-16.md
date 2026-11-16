# Implementation checkpoint — 2026-11-16

Repository: `barshan94/bangladesh-property-platform`  
Branch at review: `main`  
Latest verified main commit at checkpoint: `3c528b681acc7b4a58564c2bd9ee9bac23da464d`

## Verified since the previous delivery assessment

- GitHub Actions CI run [43814148277](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43814148277) completed successfully on the latest main commit. The run passed dependency audit, domain policy tests, TypeScript validation, ESLint and the production build.
- The manual Supabase backup workflow was corrected in PR [#4](https://github.com/barshan94/bangladesh-property-platform/pull/4): Supabase CLI setup is pinned to action `supabase/setup-cli@v3.2.0` and CLI `3.1.0`, avoiding the prior `latest` release lookup that hit a GitHub API rate limit.
- The backup workflow's old run [43813779411](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43813779411) failed during CLI installation, before database connection or export. That failure does not validate or invalidate the two repository secrets.
- Corrected backup workflow run [43852061867](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43852061867) completed successfully on `main`; export/encryption and artifact upload steps both passed.
- Artifact `supabase-encrypted-db-backup` (14,458 bytes) exists, is not expired, and has SHA-256 `f47270de1d1c18f5234ce73033cb07ab2cc70f7604dd5acc980d3ca3ebea9e32`. GitHub retention expires it at `2026-11-23T10:49:55Z` (7 days after upload).
- The workflow decrypted the archive in-run and successfully read its tar index. This verifies archive integrity, not a full restore or off-site retention.
- The Supabase security advisor currently reports no security lint findings.
- The performance advisor reports one warning for two permissive UPDATE policies on `public.property_listings` and 20 informational unused-index findings. Do not remove indexes or alter the two policies merely to silence these findings; there is no meaningful production workload yet.

## Current remote database facts

- Supabase project: `xpbjdeknjudurulogjkr`.
- Remote migration ledger: 10 recorded migrations.
- Repository migration files: 28.
- Pending migrations: 18 (versions 10–27).
- The database-only backup workflow exports PostgreSQL roles, schema and application data, encrypts and verifies the archive, then uploads a seven-day GitHub artifact.
- That backup is not a complete Supabase project recovery set. It excludes managed Auth and Storage schemas and Storage object bytes. A restore rehearsal and separate Auth/Storage recovery plan remain required.
- Do not apply migrations 10–27, run `supabase db push`, reset the database, or manipulate migration-history rows until the recovery and schema-drift gates in [DATABASE_MIGRATION_RECONCILIATION.md](DATABASE_MIGRATION_RECONCILIATION.md) are satisfied.

## Remaining release blockers

1. Download the verified GitHub artifact to durable, secure storage before its seven-day retention expires; then complete an isolated restore drill.
2. Establish and test separate Auth configuration/user and Storage bucket/object recovery procedures, then complete a restore rehearsal.
3. Compare the live schema, functions, grants, policies, triggers and Storage configuration with the pending migration preconditions. Resolve documented source issues using a reviewed forward-only migration and isolated replay.
4. Obtain explicit authorization before any remote schema change; apply only the reviewed migrations in a controlled process and run post-migration authorization probes.
5. Complete production Auth/email/abuse-control setup, first-admin bootstrap, named least-privilege staff provisioning and role-revocation tests.
6. Run deployed smoke tests for the live listing, media, Knowledge Hub, inquiry, site-visit and service-request paths only after their database migrations are safely installed.
7. Keep confidential document exchange excluded (the related endpoints are disabled); do not accept identity, title, ownership or case documents.
8. Resolve commercial hosting compliance before client/public access. The current Vercel Hobby plan is not suitable for this paid commercial deployment; keep SSO protection enabled until a compliant hosting decision is made.
9. Obtain verified business identity, approved property inventory/content, Bangladesh legal/privacy review, accessibility/security testing and a named operational owner.

## Release decision

**NO-GO for public production or real customer data.** The source package and latest CI are healthy, but the database is materially behind the application source and the backup/recovery, operator, legal and hosting gates remain open. A green CI run is not production acceptance.
\n\n## Latest continuation update — 2026-11-16\n\n- Current `main` is `35c3ea8bbed448057eccf402a3b9218037fd70f9`. CI run [43861427242](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43861427242) passed on this exact commit.\n- Database policy replay and authorization probes [43859804770](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43859804770) passed on commit `07bba6fd1f06013f9826ff2d71fc41b42cea0bba`, including the publisher-role separation migration. Browser authentication E2E [43860719104](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43860719104) passed on application commit `7145faafde5b243099c2d5863ccbd606408f530c`; PR #13 after that was documentation-only.\n- The repository now contains **29 migration files**, not 28. Against the last recorded remote ledger of 10 migrations, **19 repository migration files are pending**: migrations 10–27 plus `20261116110000_listing_media_publisher_role_separation.sql`. The remote ledger count is a prior verified snapshot, not a fresh query in this update.\n- Source audit confirms an unresolved CHECK-constraint gap in `20261113150000_trusted_document_scan_transition.sql`: terminal scan statuses can have null `scanned_at` and `scan_engine`. It requires a CLI-generated forward-only migration plus isolated replay. Do not hand-author a migration filename, alter historical migration files, or apply the affected pending set remotely before this correction is verified.\n- A live Supabase read-only recheck could not be completed through the currently connected Supabase tools because the project returned a permission-denied response. No live schema or data was changed.\n- No Vercel, hosting, SSO or live database changes were made.\n