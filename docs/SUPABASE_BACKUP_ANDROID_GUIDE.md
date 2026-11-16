# Supabase backup from an Android phone

This repository includes a manually triggered GitHub Actions workflow. GitHub's hosted runner performs the database export; the phone is only used to configure secrets, start the run, and download the encrypted artifact.

## What this backup includes

The workflow exports PostgreSQL roles, schema, and application data from the Bangladesh Property Platform Supabase project, then encrypts the archive with AES-256-CBC using PBKDF2 before uploading it as a GitHub Actions artifact.

**It is not a complete Supabase project backup.** Supabase CLI database dumps exclude managed Auth and Storage schemas. Storage file bytes, Auth users/settings, Edge Function secrets, and dashboard configuration require separate backup/recovery procedures. Do not treat this database export alone as permission to apply pending production migrations.

## One-time setup on Android

1. Open the repository in GitHub: https://github.com/barshan94/bangladesh-property-platform
2. Go to **Settings → Secrets and variables → Actions → New repository secret**.
3. Add the secret named exactly `SUPABASE_DB_URL`. In Supabase, open project `xpbjdeknjudurulogjkr`, then **Connect → Connection string → URI**. Choose **Session pooler** if the dashboard offers connection methods. Copy the PostgreSQL URI, not the Project URL, API URL, anon key, or publishable key.
4. Replace the URI's password placeholder locally with the database password. Do not include placeholder brackets. If the password contains URI-reserved characters (for example `@`, `/`, `:`, `#`, or `%`), percent-encode those characters before inserting it. Keep the full URI on one line. Its beginning must be `postgresql://` or `postgres://`, and it must identify project `xpbjdeknjudurulogjkr`.
5. Save that complete URI as the value of the `SUPABASE_DB_URL` GitHub secret. Never paste it into a chat, issue, pull request, or screenshot.
6. Add `BACKUP_ENCRYPTION_PASSPHRASE`: a unique, randomly generated passphrase of at least 32 characters. Save it in a password manager. It is needed to decrypt the backup; losing it makes the artifact unusable. Do not reuse the database password.
7. Open the repository's **Actions** tab, select **Supabase manual encrypted backup**, tap **Run workflow**, keep branch **main**, and run it.
8. Wait for the run to finish green. Open the run, scroll to **Artifacts**, and download `supabase-encrypted-db-backup`. GitHub keeps this artifact for 7 days, so download it promptly.
9. Keep the encrypted `.enc` file and its `.sha256` checksum together in secure storage. Do not upload either file publicly. Keep the encryption passphrase separately from the backup file.

## Troubleshooting the URI validation error

If the workflow says **“SUPABASE_DB_URL must be a PostgreSQL connection URI”**, the secret is not being supplied in the expected format. The most common mistake is saving the Supabase dashboard Project URL (which starts with `https://`) instead of the database Connection string URI (which starts with `postgresql://`).

Edit the existing `SUPABASE_DB_URL` secret and replace its value with the complete PostgreSQL URI from the dashboard. Keep the secret name unchanged. Do not change `BACKUP_ENCRYPTION_PASSPHRASE` to fix this error. After saving, start a **new** workflow run on `main`; do not rerun an old failed run from before the workflow fix.

If the error changes to an authentication or connection error, do not share the URI or password. Share only the error text with credentials removed.

## Safety and limitations

- The workflow is manual-only and refuses to run from a branch other than `main`.
- Secrets are read from GitHub Actions secrets and are not written to the repository.
- The workflow checks that the connection URI identifies project `xpbjdeknjudurulogjkr`.
- The archive is encrypted and a decrypt/list verification is performed before upload.
- Artifact retention is 7 days. Download it to durable secure storage promptly.
- This workflow does not restore data. A separate controlled restore drill is still required before production schema changes.
- Never paste the connection URI, database password, encryption passphrase, or decrypted SQL into ChatGPT, GitHub issues, pull requests, or public storage.
