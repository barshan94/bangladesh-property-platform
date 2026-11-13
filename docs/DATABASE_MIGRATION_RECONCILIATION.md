# Supabase migration-history reconciliation

## Current verified state

The dedicated Supabase project `xpbjdeknjudurulogjkr` is the only remote database in scope for this repository. Its migration history was reconciled for the first nine repository migrations and then checked read-only.

As of 2026-11-13:

- The repository contains **13 migration files**.
- The dedicated remote project records migrations **1–9**.
- Migrations **10–13** are present in the repository but are **not applied remotely**.
- All four pending migrations were reviewed, replayed in an isolated local Supabase environment and exercised by local SQL probes/real Supabase Auth JWT CI.
- Source review found no blocking issue in function grants, SECURITY DEFINER boundaries, digest binding or RLS policy scope.
- No remote schema changes were made by that review.

A passing local replay is not proof that the live schema has the same preconditions or that applying the migrations remotely is risk-free. Remote schema drift remains unverified.

## Pending migrations

| Version | Purpose | Current evidence |
| --- | --- | --- |
| `20261113140000` | Atomic private-document pending-slot reservation | Isolated replay and quota probe passed |
| `20261113150000` | Server-only, digest-bound one-way scan-result transition and audit | Isolated replay and scan authorization/digest probes passed |
| `20261113160000` | Per-owner private-document upload rate limiting | Isolated replay and rate-limit authorization probe passed |
| `20261113170000` | Private active-listing-staff-role helper for RLS policies | Isolated replay and real-JWT authorization CI passed |

These migrations are intentionally **not** included in the historical migration-repair workflow. That workflow repairs bookkeeping only for schema changes already verified as present; it must not be used to mark these four unapplied migrations as applied.

## Previously reconciled history

The dedicated project records the first nine historical migration versions. The original guarded workflow reconciled four previously missing history entries after the corresponding schema was independently verified. The historical run completed and a later read-only listing confirmed versions 1–9.

Do not add or alter historical version entries without repeating the corresponding live schema verification.

## Safe next steps

Before any remote application of migrations 10–13:

1. Obtain explicit authorization for a remote schema change. Local source review is not authorization.
2. Take and verify a recoverable backup of the dedicated project, including a separate plan for Auth configuration and Storage object bytes. The current backup runbook documents that a database dump alone is incomplete.
3. Compare the actual remote schema, functions, grants and RLS policies with the exact migration preconditions. Stop on any unexpected drift.
4. Review the exact migration SQL and deployment order again against the live schema.
5. Apply only the approved migrations through a controlled, logged process. Do not use `supabase db reset`.
6. Verify the resulting migration list, function grants, RLS behavior and application smoke tests.
7. Record the operator, timestamp, migration versions, command/output evidence and any rollback/recovery actions.

Do not run `supabase db push`, reset the database, or manually insert rows into `supabase_migrations.schema_migrations` to bypass an unexplained mismatch.

## Credentials and isolation

The historical reconciliation workflow uses GitHub Actions secrets:

- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_DB_PASSWORD`

These credentials must remain in GitHub's encrypted Actions secrets and must never be copied into source code, issues, documentation or chat. The workflow is scoped to project ref `xpbjdeknjudurulogjkr`; do not point it at either of the user's other Supabase projects.

The workflow is manual-only and does not execute migration SQL. Its purpose is migration-history bookkeeping for previously verified schema changes—not deployment of pending migrations.

## Current decision

**Do not apply migrations 10–13 remotely yet.** They have passed local verification and source review, but remote drift comparison, recoverable backup verification and explicit authorization for the schema change remain release gates.
