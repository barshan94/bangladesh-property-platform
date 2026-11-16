-- Verify scan metadata is present exactly for terminal scan outcomes.
-- The local replay job runs as the database owner; replication-role mode disables
-- parent/FK triggers for synthetic rows while CHECK constraints remain enforced.
begin;
set local session_replication_role = replica;

do $scan_metadata_invariant$
declare
  v_id uuid;
begin
  -- A terminal result without timestamp/engine must be rejected.
  begin
    insert into public.private_documents (
      id, owner_user_id, purpose, listing_id, storage_key, original_filename,
      detected_mime_type, size_bytes, sha256_hex, scan_status, review_status
    ) values (
      gen_random_uuid(), gen_random_uuid(), 'listing_evidence', gen_random_uuid(),
      'scan-probe-terminal-null-' || gen_random_uuid(), 'probe.pdf',
      'application/pdf', 1024, repeat('a', 64), 'clean', 'pending'
    );
    raise exception 'SCAN_METADATA_TERMINAL_NULL_WAS_ACCEPTED';
  exception when check_violation then
    null;
  end;

  -- Pending rows must not carry only one half of the metadata pair.
  begin
    insert into public.private_documents (
      id, owner_user_id, purpose, listing_id, storage_key, original_filename,
      detected_mime_type, size_bytes, sha256_hex, scan_status, review_status,
      scanned_at
    ) values (
      gen_random_uuid(), gen_random_uuid(), 'listing_evidence', gen_random_uuid(),
      'scan-probe-pending-partial-' || gen_random_uuid(), 'probe.pdf',
      'application/pdf', 1024, repeat('b', 64), 'pending', 'pending',
      pg_catalog.clock_timestamp()
    );
    raise exception 'SCAN_METADATA_PENDING_PARTIAL_WAS_ACCEPTED';
  exception when check_violation then
    null;
  end;

  -- A pending document with no scan metadata remains valid.
  insert into public.private_documents (
    id, owner_user_id, purpose, listing_id, storage_key, original_filename,
    detected_mime_type, size_bytes, sha256_hex, scan_status, review_status
  ) values (
    gen_random_uuid(), gen_random_uuid(), 'listing_evidence', gen_random_uuid(),
    'scan-probe-pending-valid-' || gen_random_uuid(), 'probe.pdf',
    'application/pdf', 1024, repeat('c', 64), 'pending', 'pending'
  );

  -- Terminal results require both fields and a meaningful engine identifier.
  begin
    insert into public.private_documents (
      id, owner_user_id, purpose, listing_id, storage_key, original_filename,
      detected_mime_type, size_bytes, sha256_hex, scan_status, review_status,
      scanned_at, scan_engine
    ) values (
      gen_random_uuid(), gen_random_uuid(), 'listing_evidence', gen_random_uuid(),
      'scan-probe-short-engine-' || gen_random_uuid(), 'probe.pdf',
      'application/pdf', 1024, repeat('d', 64), 'infected', 'pending',
      pg_catalog.clock_timestamp(), 'x'
    );
    raise exception 'SCAN_METADATA_SHORT_ENGINE_WAS_ACCEPTED';
  exception when check_violation then
    null;
  end;

  insert into public.private_documents (
    id, owner_user_id, purpose, listing_id, storage_key, original_filename,
    detected_mime_type, size_bytes, sha256_hex, scan_status, review_status,
    scanned_at, scan_engine
  ) values (
    gen_random_uuid(), gen_random_uuid(), 'listing_evidence', gen_random_uuid(),
    'scan-probe-terminal-valid-' || gen_random_uuid(), 'probe.pdf',
    'application/pdf', 1024, repeat('e', 64), 'clean', 'pending',
    pg_catalog.clock_timestamp(), 'scanner-v1'
  );
end;
$scan_metadata_invariant$;

rollback;
