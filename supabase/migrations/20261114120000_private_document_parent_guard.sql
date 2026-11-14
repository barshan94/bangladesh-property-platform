-- Enforce private-document parent ownership at the table boundary as well
-- as in the reservation RPC. This protects future privileged insertion/update
-- paths and serializes association checks against concurrent parent changes.

begin;

create or replace function private.enforce_private_document_parent_ownership()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_parent_owner uuid;
begin
  if new.purpose = 'listing_evidence' then
    select l.owner_user_id
      into v_parent_owner
    from public.property_listings l
    where l.id = new.listing_id
    for share;

    if not found or v_parent_owner is distinct from new.owner_user_id then
      raise exception 'PRIVATE_DOCUMENT_PARENT_NOT_OWNED';
    end if;
  elsif new.purpose = 'client_case' then
    select sr.requester_user_id
      into v_parent_owner
    from public.service_requests sr
    where sr.id = new.service_request_id
    for share;

    if not found or v_parent_owner is distinct from new.owner_user_id then
      raise exception 'PRIVATE_DOCUMENT_PARENT_NOT_OWNED';
    end if;
  else
    raise exception 'INVALID_PRIVATE_DOCUMENT_PURPOSE';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_private_document_parent_ownership()
  from public, anon, authenticated, service_role;

drop trigger if exists private_documents_parent_ownership_guard
  on public.private_documents;

create trigger private_documents_parent_ownership_guard
before insert or update of owner_user_id, purpose, listing_id, service_request_id
on public.private_documents
for each row
execute function private.enforce_private_document_parent_ownership();

comment on function private.enforce_private_document_parent_ownership() is
  'Rejects private-document associations unless the parent belongs to the document owner; locks the parent row during the check.';

commit;
