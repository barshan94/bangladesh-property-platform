#!/usr/bin/env bash
set -Eeuo pipefail
umask 077

: "${BACKUP_ARTIFACT_DIR:?Set BACKUP_ARTIFACT_DIR to the downloaded encrypted artifact directory}"
: "${BACKUP_ENCRYPTION_PASSPHRASE:?Set BACKUP_ENCRYPTION_PASSPHRASE from the protected repository secret}"
: "${LOCAL_DATABASE_URL:?Set LOCAL_DATABASE_URL to the isolated local Supabase database}"

# This drill is deliberately locked to the GitHub Actions local Supabase stack.
# It must never be pointed at a hosted or user-managed database.
expected_local_url="postgresql://postgres:postgres@127.0.0.1:54322/postgres"
if [[ "$LOCAL_DATABASE_URL" != "$expected_local_url" ]]; then
  echo "Refusing restore: target must be the isolated local Supabase database on 127.0.0.1:54322." >&2
  exit 1
fi

for command in openssl tar sha256sum psql awk; do
  command -v "$command" >/dev/null 2>&1 || {
    printf 'Required command not found: %s\n' "$command" >&2
    exit 1
  }
done

archive="$(find "$BACKUP_ARTIFACT_DIR" -maxdepth 1 -type f -name '*.tar.gz.enc' -print -quit)"
if [[ -z "$archive" ]]; then
  echo "Encrypted database backup archive not found in downloaded artifact." >&2
  exit 1
fi
checksum="${archive}.sha256"
if [[ ! -f "$checksum" ]]; then
  echo "Encrypted backup checksum file is missing." >&2
  exit 1
fi

expected_hash="$(awk 'NR == 1 { print $1 }' "$checksum")"
actual_hash="$(sha256sum "$archive" | awk '{ print $1 }')"
if [[ -z "$expected_hash" || "$expected_hash" != "$actual_hash" ]]; then
  echo "Encrypted backup checksum verification failed." >&2
  exit 1
fi

work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bpp-restore-drill.XXXXXX")"
cleanup() {
  rm -rf "$work_dir"
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -md sha256 \
  -pass env:BACKUP_ENCRYPTION_PASSPHRASE \
  -in "$archive" -out "$work_dir/backup.tar.gz"
tar -xzf "$work_dir/backup.tar.gz" -C "$work_dir"

for file in roles.sql schema.sql data.sql; do
  if [[ ! -f "$work_dir/$file" ]]; then
    printf 'Backup archive is missing required component: %s\n' "$file" >&2
    exit 1
  fi
done

# Fail closed if the local target already contains application tables.
existing_app_tables="$(psql "$LOCAL_DATABASE_URL" --no-psqlrc --tuples-only --no-align --set ON_ERROR_STOP=1 \
  --command "SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind IN ('r','p') AND c.relname IN ('property_listings','user_roles','inquiries','service_requests');")"
if [[ "$existing_app_tables" != "0" ]]; then
  echo "Refusing restore: local target already contains application tables." >&2
  exit 1
fi

# Match Supabase's documented restore prerequisite for preserving dumped grants.
psql "$LOCAL_DATABASE_URL" --no-psqlrc --set ON_ERROR_STOP=1 \
  --command "ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated;"

# Restore roles, schema and data in one transaction. Trigger suppression is
# applied only during the data import, matching Supabase's restore guidance.
psql --single-transaction --variable ON_ERROR_STOP=1 \
  --file "$work_dir/roles.sql" \
  --file "$work_dir/schema.sql" \
  --command 'SET session_replication_role = replica' \
  --file "$work_dir/data.sql" \
  --dbname "$LOCAL_DATABASE_URL"

psql "$LOCAL_DATABASE_URL" --no-psqlrc --set ON_ERROR_STOP=1 \
  --file "supabase/tests/backup_restore_verify.sql"

echo "Isolated database-only restore drill completed. Auth settings/users and Storage object bytes are outside this backup's scope."
