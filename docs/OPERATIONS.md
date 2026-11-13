# Operations and recovery runbook

**Status:** Prepared for pre-production use; no production deployment or backup/restore drill has been performed.

## Current operating constraints

- The application is not production-ready. Use synthetic data only.
- The Supabase project is on the Free plan. Free projects do not receive automatic daily database backups; the owner must create and retain manual exports. See the [Supabase Free-plan backup FAQ](https://supabase.com/kb/faqs/platform/free-plan-backups) and [Database Backups guide](https://supabase.com/docs/guides/platform/backups).
- Database dumps do **not** include objects stored through the Supabase Storage API. Storage object data needs a separate, independently verified export. A database restore alone cannot recover missing evidence files.
- Supabase Free projects can pause after a week of low activity. The dashboard owner receives warning/confirmation emails; resume from the project dashboard. See [Free project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).
- Do not create a second hosted Supabase project for backup or QA. Use an isolated local Postgres/Supabase stack for restore rehearsal, and never import real confidential documents into CI.

## Roles and access

Before any live data is accepted, name a primary operator and a backup operator. Grant only the minimum Supabase organization/project access. Store recovery credentials in an approved password manager, never in GitHub issues, chat, repository files or CI logs. Rotate credentials after operator changes or suspected exposure.

## Manual database backup procedure (Free plan)

1. Confirm the target project is the dedicated `bangladesh-property-platform` project. Never use the existing MRA application database for this project.
2. Confirm the database is healthy and pause application writes during a consistent export window if practical.
3. Use a trusted workstation with current Supabase CLI and PostgreSQL client tools. Check exact CLI syntax with `supabase db dump --help` for the installed pinned CLI version before running it.
4. Create a schema dump and a data dump using the supported CLI workflow. Do not include role passwords or privileged credentials in the export.
5. Separately export the Storage objects and their required metadata using a reviewed, authenticated process. The database dump only contains Storage metadata, not the underlying object bytes.
6. Encrypt both exports before moving them off the workstation. Use a separate encryption key, restrict access, and do not commit exports or keys to the repository.
7. Record timestamp, project reference, migration version list, dump tool versions, object counts, file checksums and operator in a backup log. Do not record secrets.
8. Upload encrypted artifacts to an independently controlled off-site destination with retention and access controls. If no such destination is configured, the backup is not complete.

## Restore rehearsal (local only)

1. Obtain a recent encrypted database export and its separately stored Storage export. Verify checksums before decrypting.
2. Start a disposable local Postgres/Supabase environment; do not create another hosted Supabase project.
3. Restore the database into the disposable environment following the exact restore instructions for the dump format and CLI version. Apply no production credentials.
4. Restore Storage objects separately and verify object paths, byte sizes and checksums against the database metadata.
5. Run migrations/status checks, RLS/JWT policy probes, domain tests and the browser authentication E2E against the isolated environment.
6. Verify representative public listing reads, seller ownership isolation, staff role restrictions, inquiry/service-request integrity, private bucket non-public access and audit continuity.
7. Record restore duration, missing objects, errors and corrective actions. Destroy the disposable local environment and securely remove decrypted artifacts after the rehearsal.

A successful database restore without the corresponding Storage object restore is a **failed full recovery test**.

## Incident response and restore decision

- Stop writes and isolate affected credentials when compromise or corruption is suspected.
- Preserve relevant logs and timestamps; do not delete potentially relevant evidence.
- Identify the last known-good database dump and matching Storage export. Confirm checksums and migration versions.
- Restore into an isolated environment first and validate it. Do not overwrite the only live project as an initial experiment.
- Document the data-loss window and obtain the designated operator's approval before any live restore or cutover.
- Rotate database, API, scanner, cron and operator credentials as applicable.
- After recovery, validate Auth, RLS, Storage privacy, audit events, staff access and critical workflows before reopening traffic.

## Current completion state

- [ ] Off-site encrypted backup destination selected and configured.
- [ ] Manual database export completed and verified.
- [ ] Storage object export completed and verified.
- [ ] Local restore rehearsal completed and documented.
- [ ] Recovery time objective (RTO) and recovery point objective (RPO) approved.
- [ ] Primary and backup operators assigned.
- [ ] Retention and secure deletion policy approved.

Until these items are completed, backups and recovery are **not verified** and the system must not accept real client records.
