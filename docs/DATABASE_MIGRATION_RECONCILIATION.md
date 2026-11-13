# Supabase migration-history reconciliation

## Why this exists

The dedicated project `xpbjdeknjudurulogjkr` has schema changes that were applied directly through SQL before their migration-history entries were recorded. At the time of the original reconciliation, the repository had nine migration files and the remote history recorded five versions. The guarded workflow repaired four entries; a later read-only migration listing verified all nine historical migrations. The repository now contains a tenth migration (`20261113140000_atomic_private_document_quota.sql`), which has passed isolated local replay but is **not applied remotely**.

Do not run `supabase db push`, reset the database, or manually insert rows into `supabase_migrations.schema_migrations` to solve this mismatch.

Supabase documents `supabase migration repair <versions> --status applied` for reconciling migration history when the corresponding schema changes are already present. This command changes migration bookkeeping; it does not execute migration SQL.

## Verified versions to reconcile

The following four versions remain absent from the remote history and were verified against the live project before preparing the guarded workflow:

- `20261112131600` — initial backend foundation
- `20261113100000` — public inquiry API
- `20261113120000` — authenticated service requests
- `20261113130000` — service-request staff workflow

The five already-recorded versions are intentionally not included:

- `20261112180757` — profile bootstrap trigger
- `20261112192928` — listing reference and initial status event
- `20261112193926` — listing lifecycle transitions
- `20261113055034` — bounded inquiry rate-limit cleanup
- `20261113060119` — active database role required for listing staff access

The `20261113055034` maintenance migration was applied before the older inquiry migration history was reconciled. Its source is guarded so it safely skips when its base table/function do not yet exist on a fresh database; the base inquiry migration `20261113100000` also contains the final cleanup implementation.

The active-listing-staff-role migration is timestamped `20261113060119` because that is the version recorded by the Supabase migration tool when it was applied. It sorts before the public inquiry migration but depends only on the earlier initial backend foundation tables (`property_listings`, `listing_status_events`, and `user_roles`), which are created by `20261112131600`. It does not depend on the inquiry or service-request migrations.

Verification included the expected application tables, Auth profile bootstrap trigger, listing lifecycle triggers and RPC, inquiry rate-limit and persistence functions, service-request RPCs, staff assignment directory, RLS policies and role-scoped request history. The obsolete six-argument inquiry RPC was removed from both the database and the migration source.

## How to run the guarded workflow

1. In GitHub repository settings, add two **Actions secrets**:
   - `SUPABASE_ACCESS_TOKEN` — a Supabase personal access token.
   - `SUPABASE_DB_PASSWORD` — the database password for this dedicated Supabase project.
2. Open GitHub Actions and select **Reconcile Supabase migration history**.
3. Choose **Run workflow** on the `main` branch.
4. The original run confirmed the nine historical migration versions matched. Do not expect the new tenth migration to appear remotely until its SQL is deliberately applied.

The workflow is manual-only, pinned to Supabase CLI 3.1.0, links only to project ref `xpbjdeknjudurulogjkr`, and fails closed if either secret is missing. It marks only the four previously verified versions above as applied. It does not run schema SQL or touch any other Supabase project. The new atomic quota migration is intentionally outside this history-repair workflow.

Do not add secrets to this document, source code, issues, or chat. If the final migration list is not aligned, stop and investigate rather than using `db push` or a database reset.
