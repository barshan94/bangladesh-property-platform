#!/usr/bin/env bash
set -euo pipefail
umask 077

: "${SUPABASE_DB_URL:?Set SUPABASE_DB_URL in your private shell (do not commit it)}"
: "${BACKUP_AGE_RECIPIENT:?Set BACKUP_AGE_RECIPIENT to an age public recipient}"

for command in supabase age tar sha256sum; do
  command -v "$command" >/dev/null 2>&1 || {
    printf 'Required command not found: %s\n' "$command" >&2
    exit 1
  }
done

project_ref="xpbjdeknjudurulogjkr"
if [[ "$SUPABASE_DB_URL" != postgresql://* && "$SUPABASE_DB_URL" != postgres://* ]]; then
  echo "SUPABASE_DB_URL must be a PostgreSQL connection URL." >&2
  exit 1
fi
if [[ "$SUPABASE_DB_URL" != *"$project_ref"* ]]; then
  echo "Connection URL does not identify the dedicated Bangladesh Property Platform project." >&2
  exit 1
fi
backup_root="backups/supabase"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
work_dir="$(mktemp -d "${TMPDIR:-/tmp}/bpp-db-backup.XXXXXX")"
archive=""
encrypted=""
backup_complete=0
cleanup() {
  rm -rf "$work_dir"
  if [[ -n "$archive" ]]; then rm -f "$archive"; fi
  if [[ "$backup_complete" -ne 1 && -n "$encrypted" ]]; then
    rm -f "$encrypted" "${encrypted}.sha256"
  fi
}
trap cleanup EXIT
trap 'exit 129' HUP
trap 'exit 130' INT
trap 'exit 143' TERM

mkdir -p "$backup_root"
chmod 700 "$backup_root"

# Dump roles, schema, and application data separately. Supabase CLI excludes
# managed auth/storage schemas; this is intentionally a database-only export.
supabase db dump --remote="$SUPABASE_DB_URL" -f "$work_dir/roles.sql" --role-only
supabase db dump --remote="$SUPABASE_DB_URL" -f "$work_dir/schema.sql"
supabase db dump --remote="$SUPABASE_DB_URL" -f "$work_dir/data.sql" --data-only --use-copy \
  -x "storage.buckets_vectors" -x "storage.vector_indexes"

archive="$backup_root/${project_ref}-${timestamp}.tar.gz"
encrypted="${archive}.age"
tar -czf "$archive" -C "$work_dir" roles.sql schema.sql data.sql
age --encrypt --recipient "$BACKUP_AGE_RECIPIENT" --output "$encrypted" "$archive"
rm -f "$archive"
sha256sum "$encrypted" > "${encrypted}.sha256"
chmod 600 "$encrypted" "${encrypted}.sha256"
backup_complete=1

printf 'Encrypted database export created: %s\n' "$encrypted"
printf 'Checksum file: %s\n' "${encrypted}.sha256"
printf 'This export excludes Auth users/settings and Storage object bytes. See docs/BACKUP_AND_RECOVERY.md.\n'
