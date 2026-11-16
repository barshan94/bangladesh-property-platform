-- Public site-visit inquiry must bind only to a currently published listing.
begin;

insert into auth.users(
  id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at, is_sso_user, is_anonymous
) values (
  '51000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated',
  'site-visit-probe@example.invalid', '', now(),
  '{"provider":"email","providers":["email"],"roles":["seller"]}'::jsonb,
  '{}'::jsonb, now(), now(), false, false
);

set local session_replication_role = replica;
insert into public.property_listings(
  id, public_reference, owner_user_id, listing_kind, property_type,
  headline, description, division, district, status, published_at
) values
('52000000-0000-4000-8000-000000000001','BPP-SVTEST01',
 '51000000-0000-4000-8000-000000000001','sale','apartment',
 'Site visit probe property','Synthetic published property used only by a rolled-back database test.',
 'Dhaka','Dhaka','published',now()),
('52000000-0000-4000-8000-000000000002','BPP-SVTEST02',
 '51000000-0000-4000-8000-000000000001','sale','apartment',
 'Unpublished probe property','Synthetic unpublished property used only by a rolled-back database test.',
 'Dhaka','Dhaka','draft',null);
set local session_replication_role = origin;

set local role service_role;
do $assert_site_visit$
declare
  v_id uuid;
  v_listing_id uuid;
  v_type text;
begin
  v_id := public.create_public_inquiry(
    'Site Visit Probe','site-visit@example.invalid',null,
    'I would like to arrange a viewing for this published property.',
    'inquiry-v1','site-visit-probe-1','buying-and-selling',
    'Bangladesh','Dhaka','BPP-SVTEST01','site_visit'
  );

  select listing_id, inquiry_type into v_listing_id, v_type
  from public.inquiries where id = v_id;

  if v_listing_id is distinct from '52000000-0000-4000-8000-000000000001'
     or v_type is distinct from 'site_visit' then
    raise exception 'SITE_VISIT_INQUIRY_NOT_BOUND_TO_PUBLISHED_LISTING';
  end if;

  if not exists (
    select 1 from public.consent_records
    where consent_type = 'public_site_visit_request'
      and notice_version = 'inquiry-v1'
      and source = 'website_form'
  ) then
    raise exception 'SITE_VISIT_CONSENT_RECORD_MISSING';
  end if;

  if not exists (
    select 1 from public.audit_events
    where resource_type = 'inquiry'
      and resource_id = v_id
      and action = 'inquiry.created'
      and after_summary->>'inquiry_type' = 'site_visit'
  ) then
    raise exception 'SITE_VISIT_AUDIT_RECORD_MISSING';
  end if;

  begin
    perform public.create_public_inquiry(
      'Site Visit Probe','site-visit@example.invalid',null,
      'I would like to arrange a viewing for this unpublished property.',
      'inquiry-v1','site-visit-probe-2','buying-and-selling',
      'Bangladesh','Dhaka','BPP-SVTEST02','site_visit'
    );
    raise exception 'UNPUBLISHED_PROPERTY_SITE_VISIT_WAS_ACCEPTED';
  exception when sqlstate 'P0002' then
    null;
  end;

  begin
    perform public.create_public_inquiry(
      'Site Visit Probe','site-visit@example.invalid',null,
      'I would like to arrange a viewing without a listing reference.',
      'inquiry-v1','site-visit-probe-3','buying-and-selling',
      'Bangladesh','Dhaka',null,'site_visit'
    );
    raise exception 'SITE_VISIT_WITHOUT_PROPERTY_WAS_ACCEPTED';
  exception when sqlstate '22023' then
    null;
  end;
end;
$assert_site_visit$;
reset role;

rollback;
