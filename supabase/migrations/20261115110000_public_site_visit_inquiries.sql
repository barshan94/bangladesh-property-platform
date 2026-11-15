begin;

alter table public.inquiries
  add column if not exists inquiry_type text not null default 'general';

do $constraint$
begin
  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.inquiries'::regclass
      and conname = 'inquiries_inquiry_type_check'
  ) then
    alter table public.inquiries
      add constraint inquiries_inquiry_type_check
      check (inquiry_type in ('general', 'site_visit'));
  end if;
end;
$constraint$;

create index if not exists inquiries_site_visit_created_idx
  on public.inquiries(created_at desc)
  where inquiry_type = 'site_visit';

drop function if exists public.create_public_inquiry(text, text, text, text, text, text, text, text, text);

create function public.create_public_inquiry(
  p_contact_name text,
  p_email_normalized text,
  p_phone text,
  p_message text,
  p_consent_version text,
  p_request_id text,
  p_service_code text,
  p_country text default null,
  p_property_district text default null,
  p_public_reference text default null,
  p_inquiry_type text default 'general'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_listing_id uuid;
begin
  if char_length(btrim(p_contact_name)) not between 2 and 120
     or char_length(p_email_normalized) not between 3 and 254
     or char_length(btrim(p_message)) not between 10 and 5000
     or char_length(p_consent_version) not between 1 and 40
     or char_length(p_request_id) not between 1 and 128
     or p_service_code not in (
       'title-and-record-review','buying-and-selling','transfer-and-mutation',
       'inheritance-and-succession','partition-and-co-ownership','property-disputes',
       'remote-property-support','property-tax-and-finance'
     )
     or (p_country is not null and char_length(p_country) > 80)
     or (p_property_district is not null and char_length(p_property_district) > 80)
     or p_inquiry_type not in ('general', 'site_visit')
     or (p_inquiry_type = 'site_visit' and p_public_reference is null)
     or (p_public_reference is not null and p_public_reference !~ '^BPP-[A-Z0-9]{6,12}$') then
    raise exception 'INVALID_INQUIRY_ARGUMENTS' using errcode = '22023';
  end if;

  if p_public_reference is not null then
    select l.id into v_listing_id
    from public.property_listings l
    where l.public_reference = p_public_reference
      and l.status = 'published';

    if v_listing_id is null then
      raise exception 'PROPERTY_NOT_AVAILABLE' using errcode = 'P0002';
    end if;
  end if;

  insert into public.inquiries(
    listing_id, inquiry_type, contact_name, email_normalized, phone, message,
    consent_version, service_code, country_of_residence, property_district
  ) values (
    v_listing_id, p_inquiry_type, btrim(p_contact_name), lower(btrim(p_email_normalized)),
    nullif(btrim(p_phone), ''), btrim(p_message), p_consent_version,
    p_service_code, nullif(btrim(p_country), ''), nullif(btrim(p_property_district), '')
  ) returning id into v_id;

  insert into public.consent_records(user_id, consent_type, notice_version, source)
  values (
    null,
    case when p_inquiry_type = 'site_visit' then 'public_site_visit_request' else 'public_service_inquiry' end,
    p_consent_version,
    'website_form'
  );

  insert into public.audit_events(actor_user_id, action, resource_type, resource_id, after_summary, request_id)
  values (
    null, 'inquiry.created', 'inquiry', v_id,
    jsonb_build_object('consent_version', p_consent_version, 'service_code', p_service_code,
      'inquiry_type', p_inquiry_type, 'listing_id', v_listing_id),
    p_request_id
  );

  return v_id;
end;
$$;

revoke all on function public.create_public_inquiry(text, text, text, text, text, text, text, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.create_public_inquiry(text, text, text, text, text, text, text, text, text, text, text)
  to service_role;

commit;
