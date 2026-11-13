-- Atomically reserve a pending private-document slot before Storage upload.
-- The per-owner transaction lock prevents concurrent requests from exceeding
-- the five-pending-document quota. Failed Storage uploads remove the reservation.

begin;

create or replace function private.reserve_private_document_slot(
  p_document_id uuid,
  p_owner_user_id uuid,
  p_purpose text,
  p_listing_id uuid,
  p_service_request_id uuid,
  p_storage_key text,
  p_original_filename text,
  p_detected_mime_type text,
  p_size_bytes bigint,
  p_sha256_hex text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_pending_count integer;
begin
  if p_document_id is null
     or p_owner_user_id is null
     or p_purpose is null or p_purpose not in ('listing_evidence','client_case')
     or p_storage_key is null
     or p_original_filename is null
     or p_detected_mime_type not in ('application/pdf','image/jpeg','image/png')
     or p_size_bytes is null or p_size_bytes not between 1 and 15728640
     or p_sha256_hex is null or p_sha256_hex !~ '^[a-f0-9]{64}$'
     or (p_purpose = 'listing_evidence' and (p_listing_id is null or p_service_request_id is not null))
     or (p_purpose = 'client_case' and (p_service_request_id is null or p_listing_id is not null)) then
    raise exception 'INVALID_PRIVATE_DOCUMENT_RESERVATION';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_owner_user_id::text, 719204)
  );

  select count(*)::integer into v_pending_count
  from public.private_documents d
  where d.owner_user_id = p_owner_user_id
    and d.scan_status = 'pending'
    and d.deleted_at is null;

  if v_pending_count >= 5 then
    raise exception 'PENDING_DOCUMENT_LIMIT_REACHED';
  end if;

  insert into public.private_documents (
    id, owner_user_id, purpose, listing_id, service_request_id,
    storage_key, original_filename, detected_mime_type, size_bytes,
    sha256_hex, scan_status, review_status
  ) values (
    p_document_id, p_owner_user_id, p_purpose, p_listing_id, p_service_request_id,
    p_storage_key, p_original_filename, p_detected_mime_type, p_size_bytes,
    p_sha256_hex, 'pending', 'pending'
  );
end;
$$;

revoke all on function private.reserve_private_document_slot(
  uuid,uuid,text,uuid,uuid,text,text,text,bigint,text
) from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.reserve_private_document_slot(
  uuid,uuid,text,uuid,uuid,text,text,text,bigint,text
) to service_role;

create or replace function public.reserve_private_document_slot(
  p_document_id uuid,
  p_owner_user_id uuid,
  p_purpose text,
  p_listing_id uuid,
  p_service_request_id uuid,
  p_storage_key text,
  p_original_filename text,
  p_detected_mime_type text,
  p_size_bytes bigint,
  p_sha256_hex text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.reserve_private_document_slot(
    p_document_id, p_owner_user_id, p_purpose, p_listing_id,
    p_service_request_id, p_storage_key, p_original_filename,
    p_detected_mime_type, p_size_bytes, p_sha256_hex
  );
$$;

revoke all on function public.reserve_private_document_slot(
  uuid,uuid,text,uuid,uuid,text,text,text,bigint,text
) from public, anon, authenticated;
grant execute on function public.reserve_private_document_slot(
  uuid,uuid,text,uuid,uuid,text,text,text,bigint,text
) to service_role;

commit;
