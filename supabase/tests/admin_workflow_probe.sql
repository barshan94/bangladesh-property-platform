-- Transactional probe for audited administrator property edits and inquiry status changes.
begin;

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,is_sso_user,is_anonymous)
values
('53000000-0000-4000-8000-000000000001','authenticated','authenticated','admin-edit-probe@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["administrator"]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('53000000-0000-4000-8000-000000000002','authenticated','authenticated','seller-edit-probe@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":[]}'::jsonb,'{}'::jsonb,now(),now(),false,false);

insert into public.user_roles(user_id,role_code) values
('53000000-0000-4000-8000-000000000001','administrator'),
('53000000-0000-4000-8000-000000000002','seller');

insert into public.property_listings(id,public_reference,owner_user_id,listing_kind,property_type,headline,description,division,district,status)
values('54000000-0000-4000-8000-000000000001','BPP-ADMIN01','53000000-0000-4000-8000-000000000002',
'sale','apartment','Original property headline','A temporary listing used only for the administrator edit authorization probe.',
'Dhaka','Dhaka','published');

insert into public.inquiries(id,contact_name,email_normalized,message,consent_version,status)
values('55000000-0000-4000-8000-000000000001','Probe Customer','probe@example.invalid',
'A temporary inquiry used only for the administrator status authorization probe.','probe-v1','new');

set local role authenticated;
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"53000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"roles":["administrator"]}}',true);

select public.admin_update_property_listing(
 p_listing_id=>'54000000-0000-4000-8000-000000000001',
 p_headline=>'Corrected property headline',
 p_description=>'A corrected property description used only for the administrator edit authorization probe.',
 p_listing_kind=>'sale',
 p_property_type=>'apartment',
 p_division=>'Dhaka',
 p_district=>'Dhaka',
 p_request_id=>'admin-edit-probe'
);

select public.admin_update_inquiry_status(
 p_inquiry_id=>'55000000-0000-4000-8000-000000000001',
 p_status=>'triaged',
 p_request_id=>'admin-inquiry-probe'
);

do $assert_admin_changes_and_audit$
declare v_listing public.property_listings%rowtype; v_status text; v_audit_count integer;
begin
 select * into v_listing from public.property_listings where id='54000000-0000-4000-8000-000000000001';
 if v_listing.headline <> 'Corrected property headline' then raise exception 'ADMIN_PROPERTY_EDIT_NOT_SAVED'; end if;
 if v_listing.status <> 'published' then raise exception 'ADMIN_PROPERTY_EDIT_CHANGED_LIFECYCLE'; end if;
 if v_listing.owner_user_id <> '53000000-0000-4000-8000-000000000002' then raise exception 'ADMIN_PROPERTY_EDIT_CHANGED_OWNER'; end if;
 select status into v_status from public.inquiries where id='55000000-0000-4000-8000-000000000001';
 if v_status <> 'triaged' then raise exception 'ADMIN_INQUIRY_STATUS_NOT_SAVED'; end if;
 select count(*) into v_audit_count from public.audit_events
 where actor_user_id='53000000-0000-4000-8000-000000000001'
 and ((resource_type='property_listing' and action='listing.admin_content_updated')
   or (resource_type='inquiry' and action='inquiry.status_changed'));
 if v_audit_count <> 2 then raise exception 'ADMIN_ACTION_AUDIT_EVENTS_MISSING'; end if;
end;
$assert_admin_changes_and_audit$;

reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','53000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"53000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"roles":[]}}',true);

do $assert_non_admin_denied$
begin
 begin
  perform public.admin_update_property_listing(
   p_listing_id=>'54000000-0000-4000-8000-000000000001',
   p_headline=>'Unauthorized title change',
   p_description=>'This unauthorized content must never be written to the property record.',
   p_listing_kind=>'sale',p_property_type=>'apartment',p_division=>'Dhaka',p_district=>'Dhaka');
  raise exception 'NON_ADMIN_PROPERTY_EDIT_WAS_ALLOWED';
 exception when insufficient_privilege then
  null;
 end;
 begin
  perform public.admin_update_inquiry_status('55000000-0000-4000-8000-000000000001','closed',null);
  raise exception 'NON_ADMIN_INQUIRY_STATUS_CHANGE_WAS_ALLOWED';
 exception when insufficient_privilege then
  null;
 end;
end;
$assert_non_admin_denied$;

reset role;
rollback;
