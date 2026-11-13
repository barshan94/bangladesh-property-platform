# Supabase migration-history reconciliation

## Current verified state

The dedicated Supabase project xpbjdeknjudurulogjkr is the only remote database in scope for this repository. Its migration history was reconciled for the first nine repository migrations and then checked read-only.

As of 2026-11-13:

- The repository contains **21 migration files**.
- The dedicated remote project records migrations **1–9**.
- Migrations **10–21 (12 migrations)** are present in the repository but are **not applied remotely**.
- A fresh isolated local Supabase replay of all 21 migrations completed successfully.
- The database-policy workflow passed the listing staff, service-request, private-document, listing-media intake/quota, listing-media review workspace, Knowledge Hub boundary and real Auth JWT/RLS probes on the latest verified migration set.
- The local replay does not alter the dedicated remote project. No remote schema changes were made.

A passing local replay is not proof that the live schema has the same preconditions or that applying the migrations remotely is risk-free. Remote schema drift remains unverified.

## Pending migrations

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

These migrations are code-only and remain unapplied remotely. Do not use the historical migration-repair workflow to mark versions 10–21 as applied.

## Previously reconciled history

The dedicated project records the first nine historical migration versions. The original guarded workflow reconciled four previously missing history entries after the corresponding schema was independently verified. A later read-only listing confirmed versions 1–9.

Do not add or alter historical version entries without repeating the corresponding live schema verification.

## Safe next steps

Before any remote application of migrations 10–21:

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

## Current decision

**Do not apply migrations 10–21 remotely yet.** They have passed local replay and policy probes, but remote drift comparison, recoverable backup verification and explicit authorization for the schema change remain release gates.
