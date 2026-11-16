# Supabase backup from an Android phone

This repository includes a manually triggered GitHub Actions workflow. GitHub's hosted runner performs the database export; the phone is only used to configure secrets, start the run, and download the encrypted artifact.

## What this backup includes

The workflow exports PostgreSQL roles, schema, and application data from the Bangladesh Property Platform Supabase project, then encrypts the archive with AES-256-CBC using PBKDF2 before uploading it as a GitHub Actions artifact.

**It is not a complete Supabase project backup.** Supabase CLI database dumps exclude managed Auth and Storage schemas. Storage file bytes, Auth users/settings, Edge Function secrets, and dashboard configuration require separate backup/recovery procedures. Do not treat this database export alone as permission to apply pending production migrations.

## One-time setup on Android

1. Open the repository in GitHub: https://github.com/barshan94/bangladesh-property-platform
2. Go to **Settings → Secrets and variables → Actions → New repository secret**.
3. Add `SUPABASE_DB_URL`. In Supabase, open project `xpbjdeknjudurulogjkr`, then **Project Settings → Database → Connection string**. Choose the **Session pooler** URI (not a password pasted into chat). Replace the password placeholder locally with the database password. If the password contains URL-special characters, URL-encode it before using it in the URI.
4. Add `BACKUP_ENCRYPTION_PASSPHRASE`: a unique, randomly generated passphrase of at least 32 characters. Save it in a password manager. It is needed to decrypt the backup; losing it makes the artifact unusable. Do not reuse the database password.
5. Open the repository's **Actions** tab, select **Supabase manual encrypted backup**, tap **Run workflow**, keep branch **main**, and run it.
6. Wait for the run to finish green. Open the run, scroll to **Artifacts**, and download `supabase-encrypted-db-backup`. GitHub keeps this artifact for 7 days, so download it promptly.
7. Keep the encrypted `.enc` file and its `.sha256` checksum together in secure storage. Do not upload either file publicly. Keep the encryption passphrase separately from the backup file.

## Safety and limitations

- The workflow is manual-only and refuses to run from a branch other than `main`.
- Secrets are read from GitHub Actions secrets and are not written to the repository.
- The workflow checks that the connection URI identifies project `xpbjdeknjudurulogjkr`.
- The archive is encrypted and a decrypt/list verification is performed before upload.
- Artifact retention is 7 days. Download it to durable secure storage promptly.
- This workflow does not restore data. A separate controlled restore drill is still required before production schema changes.
- Never paste the connection URI, database password, encryption passphrase, or decrypted SQL into ChatGPT, GitHub issues, pull requests, or public storage.

If the workflow fails, share only the visible error message with secrets removed.
