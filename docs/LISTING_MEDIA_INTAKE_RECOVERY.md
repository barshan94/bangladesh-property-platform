# Listing media intake recovery runbook

**Status: operator procedure draft.** This is not an automated recovery job and does not authorize production cleanup. Listing media intake uses a private quarantine bucket; public delivery remains disabled.

## Why this is needed

The upload route uploads the canonical WebP to private quarantine before inserting the `listing_media` reservation. If Storage reports an upload error, the route attempts to remove the expected object key; if the subsequent metadata insert fails, it attempts to remove the already-uploaded object; if the audit insert fails, it attempts to remove both the Storage object and the reservation. These are best-effort compensating operations, not a single transaction. A transient failure can therefore leave either:

- a database reservation whose quarantine object is missing; or
- a quarantine object with no corresponding database reservation.

A successful HTTP error response does not prove that compensation completed. Do not infer successful cleanup from `LISTING_MEDIA_QUARANTINE_UPLOAD_FAILED` or `LISTING_MEDIA_AUDIT_FAILED`.

## Access and safety requirements

- Only an explicitly assigned platform operator with approved production access may perform this procedure.
- Use the dedicated project only. Never point commands at another Supabase project.
- Do not expose storage keys, owner IDs, filenames, or audit summaries in public tickets or chat.
- Do not delete a pending media row merely because it is old. It may represent a legitimate upload awaiting review.
- Do not delete a Storage object while a database row references it.
- Do not make the quarantine bucket public, create signed URLs, or copy objects into a public bucket as a recovery shortcut.
- Before any write or delete, obtain a verified backup/recovery point and record the incident, operator, timestamp, reason, and affected media IDs in the restricted incident log.
- If the cause is unclear, preserve both records and escalate. Availability is secondary to preserving evidence.

## Read-only reconciliation

Run these queries only against the dedicated project's SQL editor with a read-only operational role. They reveal internal identifiers and storage keys; keep results restricted.

### Reservations without a matching quarantine object

```sql
select
  lm.id as media_id,
  lm.created_at,
  lm.moderation_status,
  lm.size_bytes,
  lm.sha256_hex
from public.listing_media lm
left join storage.objects so
  on so.bucket_id = 'listing-media-quarantine'
 and so.name = lm.quarantine_storage_key
where so.id is null
order by lm.created_at asc;
```

A missing object may indicate failed upload or cleanup, but can also indicate manual intervention or storage inconsistency. Verify the upload/audit incident before taking action.

### Quarantine objects without a matching reservation

```sql
select
  so.name as quarantine_storage_key,
  so.created_at,
  so.metadata
from storage.objects so
left join public.listing_media lm
  on lm.quarantine_storage_key = so.name
where so.bucket_id = 'listing-media-quarantine'
  and lm.id is null
order by so.created_at asc;
```

An unmatched object is not automatically safe to delete. Confirm its bucket, namespace, creation time, and incident context. Do not print metadata into public logs.

### Reservations with no upload audit event

```sql
select
  lm.id as media_id,
  lm.created_at,
  lm.moderation_status
from public.listing_media lm
where not exists (
  select 1
  from public.audit_events ae
  where ae.resource_type = 'listing_media'
    and ae.resource_id = lm.id
    and ae.action = 'listing_media.uploaded'
)
order by lm.created_at asc;
```

This is a diagnostic signal, not proof of a failed upload. Review the audit schema and related incident records before drawing conclusions.

## Manual handling decision

For each mismatch:

1. Capture the media ID or quarantine object key in the restricted incident record.
2. Check the corresponding upload failure response, audit event, Storage state, and listing ownership/status history.
3. Determine whether the object bytes exist and, where applicable, compare their SHA-256 digest with the immutable `listing_media.sha256_hex`.
4. If the row is valid and the object is missing, do not approve or publish it. Keep it pending only if an operator can safely arrange a seller re-upload; otherwise escalate for a reviewed database correction.
5. If an object has no row, preserve it until its origin and lack of a valid reservation are confirmed. Then use a reviewed, least-privilege Storage deletion procedure and record the result.
6. If a row must be removed, do so only through a separately reviewed database procedure after confirming no object remains and preserving the audit/incident evidence. The current schema intentionally restricts ordinary browser access; do not bypass that boundary.
7. Re-run both read-only reconciliation queries and attach restricted evidence to the incident record.

## What is not implemented

- No automated orphan scanner or cleanup worker exists.
- No durable cleanup ledger records which compensation step failed.
- No retry queue or operator dashboard exists for failed compensation.
- No remote SQL cleanup or Storage deletion has been run as part of this documentation change.

These gaps remain a production-readiness blocker. A future implementation should add an explicit, audited recovery state machine and idempotent cleanup RPC/worker before enabling public image delivery. Any schema change must be introduced through a new forward migration, tested in an isolated database, reviewed, backed up, and explicitly approved before remote application.
