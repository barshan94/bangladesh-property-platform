-- Trusted scanner completion primitive. This does not install or claim to run a scanner.
-- A future callback must authenticate the scanner before invoking this server-only RPC.
begin;

alter table public.private_documents
  add column scanned_at timestamptz,
  add column scan_engine text;

alter table public.private_documents
  add constraint private_documents_scan_metadata_consistent check (
    (scan_status = 'pending' and scanned_at is null and scan_engine is null)
    or (scan_status in ('clean','infected','error')
        and scanned_at is not null
        and scan_engine is not null
        and char_length(scan_engine) between 3 and 80)
  );

create or replace function private.complete_private_document_scan(
  p_document_id uuid,
  p_expected_sha256_hex text,
  p_scan_result text,
  p_scan_engine text,
  p_request_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_document_id uuid;
begin
  if p_document_id is null
     or p_expected_sha256_hex is null
     or p_expected_sha256_hex !~ '^[a-f0-9]{64}$'
     or p_scan_result not in ('clean','infected','error')
     or p_scan_engine is null
     or char_length(p_scan_engine) not between 3 and 80
     or p_request_id is null
     or char_length(p_request_id) not between 1 and 128 then
    raise exception 'INVALID_PRIVATE_DOCUMENT_SCAN_RESULT';
  end if;

  update public.private_documents d
     set scan_status = p_scan_result,
         scanned_at = pg_catalog.clock_timestamp(),
         scan_engine = p_scan_engine
   where d.id = p_document_id
     and d.sha256_hex = p_expected_sha256_hex
     and d.scan_status = 'pending'
     and d.deleted_at is null
  returning d.id into v_document_id;

  if v_document_id is null then
    raise exception 'PRIVATE_DOCUMENT_SCAN_TARGET_MISMATCH_OR_ALREADY_SCANNED';
  end if;

  insert into public.document_access_events(
    document_id, actor_user_id, action, purpose, request_id
  ) values (
    v_document_id, null, 'scan',
    'trusted_scanner:' || p_scan_engine,
    p_request_id
  );
end;
$$;

revoke all on function private.complete_private_document_scan(uuid,text,text,text,text)
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.complete_private_document_scan(uuid,text,text,text,text)
  to service_role;

create or replace function public.complete_private_document_scan(
  p_document_id uuid,
  p_expected_sha256_hex text,
  p_scan_result text,
  p_scan_engine text,
  p_request_id text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.complete_private_document_scan(
    p_document_id, p_expected_sha256_hex, p_scan_result, p_scan_engine, p_request_id
  );
$$;

revoke all on function public.complete_private_document_scan(uuid,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.complete_private_document_scan(uuid,text,text,text,text)
  to service_role;

commit;
