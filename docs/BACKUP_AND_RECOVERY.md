# Backup and Recovery

## Free-plan limitation and current risk

This project uses Supabase Free. The Free plan does **not** include automatic daily database backups or Point-in-Time Recovery. Do not assume Supabase is keeping a downloadable daily backup for this project. The project currently has no configured backup schedule and no completed restore drill.

Supabase recommends exporting Free-plan databases with the Supabase CLI and keeping copies off-site. A database dump is not a complete platform backup:

- The CLI database dump excludes Supabase-managed `auth` and `storage` schemas and extension-created schemas.
- Storage object bytes are separate from database metadata. A database dump cannot restore deleted files.
- Auth settings, API keys, Edge Function secrets, DNS, SMTP and provider configuration need separate secure records/reconfiguration.
- The current private evidence bucket must remain unavailable for user uploads until a complete document security workflow is implemented.

Official references:
- [Supabase database backups](https://supabase.com/docs/guides/platform/backups)
- [Supabase backup and restore using the CLI](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore)
- [Supabase CLI db dump reference](https://supabase.com/docs/reference/cli/supabase-db-dump)

## Manual encrypted database export (free tools)

The repository includes `scripts/backup-supabase-free.sh`. It exports database roles, schema and application data from the dedicated project, creates a compressed archive, encrypts it using the open-source `age` tool, writes a SHA-256 checksum, and removes the temporary plaintext SQL files.

Prerequisites:
- Supabase CLI installed and available as `supabase`.
- Docker running (the CLI runs `pg_dump` in a container).
- `age` and `sha256sum` installed.
- The database connection string copied from the dedicated project's Supabase Dashboard > Connect. Never commit it or paste it into chat.
- An age recipient public key whose corresponding private identity is stored separately and securely.

Run from the repository root in a private terminal:

```bash
export SUPABASE_DB_URL='postgresql://...'
export BACKUP_AGE_RECIPIENT='age1...'
./scripts/backup-supabase-free.sh
```

The script writes only encrypted archive and checksum files under the ignored local `backups/supabase/` directory. It does not upload anything, create a cloud schedule, or modify the database. Keep at least one encrypted copy outside the computer and outside this GitHub repository. Do not upload plaintext SQL or commit backup artifacts.

Run a backup:
- At least weekly once the service is accepting real data.
- Immediately before every production schema migration or high-risk configuration change.
- After a major data import or operational milestone.

A successful export command is not proof of recoverability. Verify the checksum after copying the encrypted archive.

## Separate data and configuration recovery

The database export above is only one part of the recovery set. Before accepting real client data, document and test a separate process for:

1. **Auth users and settings:** export/retain only through a reviewed, access-controlled process. The standard `supabase db dump` deliberately excludes the managed `auth` schema. Do not assume SQL dump files contain user accounts or password hashes.
2. **Storage files:** enumerate every bucket and object, download object bytes separately using an authorized private process, preserve paths/content types/metadata, and encrypt the copy. The database dump contains Storage metadata only, not file bytes.
3. **Edge Functions:** keep reviewed function source in this repository; securely record required secret names and re-provision values in Supabase after recovery. Never store secret values in Git.
4. **Project configuration:** record Auth redirect allowlists, SMTP, CAPTCHA, enabled extensions, bucket policies, Edge Function settings and other non-secret settings. Store sensitive values in a password manager, not this repository.
5. **Encryption keys:** if Vault or column encryption is ever used, follow Supabase's documented root-key recovery procedure. Never rotate or overwrite a root key casually.

At present, there are no enabled user document uploads and no complete Auth/Storage backup process. Therefore the current export script must not be described as a full platform backup.

## Restore drill (not yet completed)

Before launch, restore the encrypted export into an isolated local Supabase environment or a separately approved non-production project. Do not restore over the live project for a test.

Example high-level sequence:

1. Verify the encrypted archive checksum.
2. Decrypt it with the separately stored age identity into a private temporary directory.
3. Start a compatible isolated Postgres/Supabase environment and enable the required extensions.
4. Restore roles and schema, then data, using the vendor's documented restore procedure. Review privilege/default-role caveats before execution.
5. Reconfigure Auth and Edge Functions separately; restore Storage objects separately if any exist.
6. Run application-level checks: migrations, RLS, RPC permissions, listing visibility, inquiry/service-request tables, staff roles and audit history.
7. Record restore date, operator, archive age, elapsed time, missing items, test results and corrective actions.
8. Securely delete temporary plaintext SQL and the temporary restored environment after validation.

Do not run a restore against the live project as part of a drill. Do not create another paid resource. A local restore drill is acceptable as the first verification, but it does not test cloud-provider recovery or prove that all Auth/Storage state is recoverable.

## Recovery objectives and operational ownership

No measured RPO or RTO exists yet. Proposed initial targets for review (not achieved guarantees):
- Database RPO: no more than 7 days once weekly exports are actually scheduled and monitored; before the first successful export, RPO is undefined.
- RTO: unmeasured until a timed restore drill is completed.
- Storage/Auth RPO: undefined until separate export procedures exist and are tested.

Assign a named operator and backup custodian before launch. The custodian must monitor backup completion, verify off-site copies, protect the age private identity, and record restore-drill evidence. If nobody owns this work, the project is not ready to hold important client records.

## Incident response

Document who can declare an incident, isolate affected systems, rotate credentials, restore data, communicate with affected parties, and approve return to service.

## Current status

- [x] Encrypted database export script committed.
- [ ] First real export run against the dedicated project.
- [ ] Off-site encrypted copy verified.
- [ ] Auth users/settings recovery procedure tested.
- [ ] Storage object backup procedure tested.
- [ ] Isolated restore drill completed.
- [ ] RPO/RTO measured and accepted.
- [ ] Named backup operator assigned.

**Status: backup implementation is partially prepared; backup operation and restore readiness remain unverified.**
