# Supabase migration-history reconciliation

## Why this exists

The dedicated project `xpbjdeknjudurulogjkr` has schema changes that were applied directly through SQL before their migration-history entries were recorded. The repository has seven migration files, while the remote history currently records three versions.

Do not run `supabase db push`, reset the database, or manually insert rows into `supabase_migrations.schema_migrations` to solve this mismatch.

Supabase documents `supabase migration repair <versions> --status applied` for reconciling a migration history when the corresponding schema changes are already present. This command changes migration bookkeeping; it does not execute the migration SQL.

## Verified versions to reconcile

The following versions were absent from the remote history at the time of review and were verified against the live project before preparing the workflow:

- `20261112131600` — initial backend foundation
- `20261113100000` — public inquiry API
- `20261113120000` — authenticated service requests
- `20261113130000` — service-request staff workflow

The three already-recorded versions are intentionally not included.

Verification included the expected application tables, Auth profile bootstrap trigger, listing lifecycle triggers and RPC, inquiry rate-limit and persistence functions, service-request RPCs, staff assignment directory, RLS policies and role-scoped request history. The obsolete six-argument inquiry RPC was removed from both the database and the migration source.

## How to run the guarded workflow

1. In the GitHub repository settings, add two **Actions secrets**:
   - `SUPABASE_ACCESS_TOKEN` — a Supabase personal access token.
   - `SUPABASE_DB_PASSWORD` — the database password for this dedicated Supabase project.
2. Open GitHub Actions and select **Reconcile Supabase migration history**.
3. Choose **Run workflow** on the `main` branch.
4. Confirm the final migration list shows all seven local versions matched to remote versions.

The workflow is manual-only, pinned to Supabase CLI 3.1.0, links only to project ref `xpbjdeknjudurulogjkr`, and fails closed if either secret is missing. It marks only the four versions above as applied. It does not run schema SQL or touch any other Supabase project.

Do not add secrets to this document, source code, issues, or chat. If the final migration list is not aligned, stop and investigate rather than using `db push` or a database reset.
