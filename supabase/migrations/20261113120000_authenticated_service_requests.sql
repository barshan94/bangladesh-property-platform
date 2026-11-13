-- Authenticated service-request intake.
-- The SQL was applied directly to the dedicated Supabase project; keep this file as the forward migration source.
begin;

alter table public.service_requests
  add column if not exists property_district text;

alter table public.service_requests
  drop constraint if exists service_requests_service_code_check,
  add constraint service_requests_service_code_check check (service_code in (
    'property_verification','title_due_diligence','remote_property_inspection',
    'property_management','buying_assistance','selling_assistance',
    'inheritance_guidance','legal_consultation','other',
    'title-and-record-review','buying-and-selling','transfer-and-mutation',
    'inheritance-and-succession','partition-and-co-ownership',
    'property-disputes','remote-property-support','property-tax-and-finance'
  ));

alter table public.service_requests
  drop constraint if exists service_requests_country_of_residence_check,
  add constraint service_requests_country_of_residence_check
    check (country_of_residence is null or country_of_residence ~ '^[A-Z]{2}$');

alter table public.service_requests
  add constraint service_requests_property_district_check
    check (property_district is null or char_length(btrim(property_district)) between 2 and 80);

grant select on public.service_requests to authenticated;

drop policy if exists service_requests_select_own_or_staff on public.service_requests;
create policy service_requests_select_own_or_staff
  on public.service_requests for select to authenticated
  using (
    requester_user_id = (select auth.uid())
    or ((select auth.jwt()) -> 'app_metadata' -> 'roles') ?| array['intake_coordinator','case_manager','administrator']
  );

create or replace function public.create_service_request(
  p_requester_user_id uuid,
  p_service_code text,
  p_contact_name text,
  p_email_normalized text,
  p_phone text,
  p_country text,
  p_property_district text,
  p_property_listing_id uuid,
  p_summary text,
  p_consent_version text,
  p_request_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
  v_recent_count integer;
begin
  if p_requester_user_id is null
     or p_service_code not in (
       'title-and-record-review','buying-and-selling','transfer-and-mutation',
       'inheritance-and-succession','partition-and-co-ownership',
       'property-disputes','remote-property-support','property-tax-and-finance',
       'property_verification','title_due_diligence','remote_property_inspection',
       'property_management','buying_assistance','selling_assistance',
       'inheritance_guidance','legal_consultation','other'
     )
     or p_contact_name is null or char_length(pg_catalog.btrim(p_contact_name)) not between 2 and 120
     or p_email_normalized is null or char_length(p_email_normalized) not between 3 and 254
     or p_email_normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
     or (p_phone is not null and char_length(p_phone) > 32)
     or (p_country is not null and p_country !~ '^[A-Z]{2}$')
     or (p_property_district is not null and char_length(pg_catalog.btrim(p_property_district)) not between 2 and 80)
     or p_summary is null or char_length(pg_catalog.btrim(p_summary)) not between 10 and 2000
     or p_consent_version is null or char_length(p_consent_version) not between 1 and 40
     or p_request_id is null or char_length(p_request_id) not between 1 and 128 then
    raise exception 'INVALID_SERVICE_REQUEST';
  end if;

  if p_property_listing_id is not null and not exists (
    select 1 from public.property_listings l
    where l.id = p_property_listing_id
      and (l.status = 'published' or l.owner_user_id = p_requester_user_id)
  ) then
    raise exception 'INVALID_PROPERTY_REFERENCE';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_requester_user_id::text, 0)
  );

  select count(*)::integer into v_recent_count
  from public.service_requests sr
  where sr.requester_user_id = p_requester_user_id
    and sr.created_at > pg_catalog.now() - interval '15 minutes';

  if v_recent_count >= 5 then
    raise exception 'SERVICE_REQUEST_RATE_LIMITED';
  end if;

  insert into public.service_requests (
    requester_user_id, service_code, property_listing_id, contact_name,
    email_normalized, phone, country_of_residence, property_district,
    summary, consent_version, status
  ) values (
    p_requester_user_id, p_service_code, pg_catalog.btrim(p_contact_name),
    pg_catalog.lower(pg_catalog.btrim(p_email_normalized)), p_phone,
    p_country, nullif(pg_catalog.btrim(p_property_district), ''),
    p_property_listing_id, pg_catalog.btrim(p_summary),
    p_consent_version, 'new'
  ) returning id into v_request_id;

  insert into public.consent_records (
    user_id, consent_type, notice_version, source
  ) values (
    p_requester_user_id, 'service_request_processing',
    p_consent_version, 'service_intake'
  );

  insert into public.audit_events (
    actor_user_id, action, resource_type, resource_id, after_summary, request_id
  ) values (
    p_requester_user_id, 'service_request.created', 'service_request',
    v_request_id,
    pg_catalog.jsonb_build_object(
      'service_code', p_service_code,
      'status', 'new',
      'property_district', nullif(pg_catalog.btrim(p_property_district), '')
    ),
    p_request_id
  );

  return v_request_id;
end;
$$;

revoke all on function public.create_service_request(uuid,text,text,text,text,text,text,uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.create_service_request(uuid,text,text,text,text,text,text,uuid,text,text,text) to service_role;

commit;
