# Supabase migration-history reconciliation

## Current verified state

The dedicated Supabase project xpbjdeknjudurulogjkr is the only remote database in scope for this repository. Its first nine historical migration versions were reconciled; a targeted permission migration was later applied separately after live production logs identified a missing privilege.

As of 2026-11-16:

- The repository contains **29 migration files**.
- The dedicated remote project records **10 migrations**: the original nine plus the targeted anonymous-read permission migration `20261116050502_grant_anon_select_user_roles_for_public_listing_policy`.
- The last recorded remote ledger contains 10 migrations. Against the current 29-file repository inventory, **19 files are pending remotely**: the 18 migrations dated 20261113140000 through 20261115110000 (the documented sequence 10–27), plus `20261116110000_listing_media_publisher_role_separation.sql`. The targeted permission migration `20261116050502_grant_anon_select_user_roles_for_public_listing_policy` is separately applied and recorded remotely.
- The earlier 26-migration snapshot passed isolated replay. The targeted permission migration was included in the subsequent database-policy workflow [run 43807945424](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43807945424), which passed migration replay and authorization probes.
- The database-policy workflow passed the listing staff, service-request, private-document, listing-media intake/quota, listing-media review workspace, Knowledge Hub boundary and real Auth JWT/RLS probes on the latest verified migration set.
- The isolated local replay does not alter the remote project. Separately, the targeted grant migration was applied remotely after live PostgREST logs showed `permission denied for table user_roles` on the public listing query. No other pending migration was applied.

A passing local replay is not proof that the live schema has the same preconditions or that applying the migrations remotely is risk-free. Remote schema drift remains unverified.

## Pending migrations

The original detailed table below covers migrations 10–21. Six additional migrations (22–27) are present and remain pending remotely; the subsequent publisher-role migration is listed separately below:

| Version | Purpose | Local verification |
| --- | --- | --- |
| 22 · 20261113270000 | Publisher-controlled listing-media publication workflow | Isolated replay and publication authorization probe |
| 23 · 20261113280000 | Public listing-media projection/delivery boundary | Isolated replay and public media projection probe |
| 24 · 20261114110000 | Private-document parent ownership enforcement | Isolated replay and ownership probe |
| 25 · 20261114120000 | Private-document parent-row locking/guard | Isolated replay and parent guard probe |
| 26 · 20261115100000 | Public property map projection with rounded coordinates | Isolated replay and map privacy probe |
| 27 · 20261115110000 | Public site-visit inquiry support | Isolated replay and inquiry authorization probe |

| Version | Purpose | Local verification |
| --- | --- | --- |
| 10 · 20261113140000 | Atomic private-document pending-slot reservation | Isolated replay and quota probe |
| 11 · 20261113150000 | Digest-bound one-way private-document scan transition | Isolated replay and scan authorization/digest probes |
| 12 · 20261113160000 | Per-owner private-document upload rate limiting | Isolated replay and rate-limit authorization probe |
| 13 · 20261113170000 | Active listing staff-role helper for RLS policies | Isolated replay and real-JWT authorization probe |
| 14 · 20261113180000 | Private listing-media quarantine, metadata and moderation RPC | Isolated replay and media boundary probe |
| 15 · 20261113200000 | Knowledge Hub article/video editorial lifecycle | Isolated replay and content boundary probe |
| 16 · 20261113210000 | Authenticated CMS list/save RPCs | Isolated replay and CMS RPC grants probe |
| 17 · 20261113220000 | Published-only Knowledge Hub read boundary | Isolated replay and public-column/RLS probe |
| 18 · 20261113230000 | Listing-media per-owner rate limit and serialized pending quota | Isolated replay and intake quota probe |
| 19 · 20261113240000 | Reviewer-only pending media queue projection | Isolated replay and reviewer workspace probe |
| 20 · 20261113250000 | Prevent media owners from reviewing their own uploads | Isolated replay and reviewer independence probe |
| 21 · 20261113260000 | Exclude reviewers' own pending uploads from their queue | Isolated replay and reviewer queue probe |

The 18 migrations in the numbered sequence 10–27 and the additional publisher-role separation migration are code-only and remain pending remotely according to the last recorded ledger. The database-policy workflow [run 43859804770](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43859804770) passed on commit `07bba6fd1f06013f9826ff2d71fc41b42cea0bba`, which includes the publisher-role migration. Do not use the historical migration-repair workflow to mark any pending migration as applied.

| Additional pending file | Purpose | Local verification |\n| --- | --- | --- |\n| `20261116110000_listing_media_publisher_role_separation.sql` (29th repository file) | Restrict listing-media publication and its queue to the dedicated publisher role; administrator is not a publisher bypass | Included in isolated migration replay and publication authorization probe, database-policy run [43859804770](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43859804770) on commit `07bba6fd1f06013f9826ff2d71fc41b42cea0bba` |\n\n## Previously reconciled history

The dedicated project records the first nine historical migration versions plus the separately applied targeted permission migration. The targeted grant was verified by the production listing query returning HTTP 200 and by an anonymous-role SQL check returning zero visible `user_roles` rows. The original guarded workflow reconciled four previously missing history entries after the corresponding schema was independently verified. The targeted grant migration is a new, separately applied forward-only change; it does not mark any of the pending migrations as applied.

Do not add or alter historical version entries without repeating the corresponding live schema verification.

## Safe next steps

Before any remote application of the 19 pending repository migrations (the numbered sequence 10–27 plus publisher-role separation):

1. Obtain explicit authorization for a remote schema change. Local source review is not authorization.
2. Take and verify a recoverable backup of the dedicated project, including a separate plan for Auth configuration and Storage object bytes. A database dump alone is incomplete.
3. Compare the actual remote schema, functions, grants, RLS policies, Storage buckets and triggers with the exact migration preconditions. Stop on any unexpected drift.
4. Review the exact migration SQL and deployment order again against the live schema.
5. Apply only the approved migrations through a controlled, logged process. Do not use supabase db reset.
6. Verify the resulting migration list, function grants, RLS behavior and application smoke tests.
7. Record the operator, timestamp, migration versions, command/output evidence and any rollback/recovery actions.

Do not run supabase db push, reset the database, or manually insert rows into supabase_migrations.schema_migrations to bypass an unexplained mismatch.

## Credentials and isolation

The historical migration-history reconciliation workflow uses GitHub Actions secrets:

- SUPABASE_ACCESS_TOKEN
- SUPABASE_DB_PASSWORD

These credentials must remain in GitHub's encrypted Actions secrets and must never be copied into source code, issues, documentation or chat. The workflow is scoped to project ref xpbjdeknjudurulogjkr; do not point it at either of the user's other Supabase projects.

The workflow is manual-only and does not execute migration SQL. Its purpose is migration-history bookkeeping for previously verified schema changes—not deployment of pending migrations.

## Additional scan-transition review finding

A follow-up source audit identified a constraint gap in migration `20261113150000_trusted_document_scan_transition.sql`.

The current `private_documents_scan_metadata_consistent` CHECK accepts rows where `scan_status` is terminal (`clean`, `infected` or `error`) while both `scanned_at` and `scan_engine` are null, because its first OR branch permits both metadata fields to be null without restricting the status to `pending`. The trusted completion RPC itself writes all three fields atomically, but the table constraint does not independently enforce that invariant against other privileged writes or future code paths.

Required correction: permit the null-metadata branch only for `scan_status = 'pending'`; require terminal scan states to have a non-null timestamp and a 3–80 character engine value. Before applying the correction, verify existing rows satisfy the tightened constraint.

The isolated SQL probe now also checks that a completed scan cannot be replayed and that replay does not create a duplicate scan audit event (commits `25376e3` and `bbb0e88`). GitHub did not expose a CI run or status for the latest probe commit, so this is committed coverage, not a confirmed passing run.

Two older route tests were found to be stale after the scanner callback and recovery implementations were refactored to shared helpers. `tests/private-document-scanner-callback.test.mjs` now checks the shared HMAC verifier and bounded-body helper; `tests/private-document-recovery-route.test.mjs` now checks that digestless records are excluded before the batch limit. Their source assertions were replayed against the fetched route/helper files and all matched. This is static source verification only; the Node test runner and CI have not been run for these commits.

The required forward-only migration has **not** been created: the available repository tools do not provide the Supabase CLI workflow required to create a migration safely. Do not hand-author a migration filename or edit the existing applied-history source as a shortcut. Resolve this when the CLI-backed migration workflow is available, then replay all migrations and probes locally.

## Current decision

**Do not apply the 19 pending repository migrations remotely yet.** They have passed local replay and policy probes, but remote drift comparison, recoverable backup verification and explicit authorization for the schema change remain release gates.


## Critical service-request RPC defect — 2026-11-13

A source review found a positional mismatch in the `INSERT INTO public.service_requests` statement in historical migration `20261113120000_authenticated_service_requests.sql`. The supplied values were shifted: `btrim(p_contact_name)` occupied the `property_listing_id` position, and the listing UUID was supplied in the district position.

**Important correction to the initial audit note:** this defect is already corrected in the forward-only migration `20261113130000_service_request_staff_workflow.sql`. Its replacement function places `p_property_listing_id` third, followed by the trimmed contact name, and maps the remaining values to their intended columns. Do not create a duplicate fix migration or edit the historical migration.

However, migration 13 is among the repository's pending migrations 10–27 and has not been applied to the dedicated remote project. The remote project therefore still records the earlier migration history, and the corrected function must not be assumed live. Authenticated service-request creation remains a remote release blocker until the pending migration set is safely reconciled and applied under the documented approval, backup and drift-check gates.

### Live private-document schema spot-check — 2026-11-13

A read-only query against the dedicated remote project confirmed that `public.private_documents` currently has `scan_status`, but does **not** yet have `scanned_at` or `scan_engine`. Its current CHECK constraints include the scan-status enum but do not include `private_documents_scan_metadata_consistent`. This matches the migration ledger: migration 11 is pending remotely, so the metadata CHECK defect described below is a defect in pending migration source, not a constraint currently installed on the remote database. No remote schema was changed.

CI run #656 for commit `3833eab8e9e457e1c5e083a10300166a30766458` completed successfully on 2026-11-13. Its job passed dependency audit, domain policy tests, TypeScript validation, ESLint and the production build. This does not execute the pending SQL migrations against the remote project or close the remote schema drift and backup gates.

The probe `supabase/tests/service_request_rpc_probe.sql` has now been extended to invoke `public.create_service_request` under `service_role` and verify the null-property-reference case: requester, service code, contact name, normalized email, phone, country, district, summary, consent version, initial status, consent record, audit event and initial status-history event. Assertions use `IS DISTINCT FROM` so unexpected null values cannot silently pass. A non-null property-reference case remains to be added once the probe can create a valid listing fixture from the actual required listing schema. The updated probe has been committed but has not been run in this environment; run it after a fresh local migration replay before considering the correction verified.

A source-contract gate, `tests/service-request-rpc-mapping-gate.test.mjs`, checks the API's named RPC argument mapping, the forward migration's target-column/value order, the service-role-only function grant, and the SQL probe's key assertions. The gate's assertions were statically replayed against the fetched source and all eight checks matched. This is not a substitute for running the repository's Node test suite or executing the SQL probe against PostgreSQL. A fresh local migration replay and actual SQL probe run are still required before considering the correction verified.

The correction exists in pending source code; it has **not** been verified on the live remote database. Do not hand-edit historical migration history, create a duplicate migration, or bypass the Supabase CLI migration workflow.
