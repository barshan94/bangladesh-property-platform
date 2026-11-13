-- Transactional probe: revoked listing staff retain a stale JWT claim but lose
-- listing visibility and transition authority immediately after DB role revocation.
begin;

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,is_sso_user,is_anonymous)
values
('51000000-0000-4000-8000-000000000001','authenticated','authenticated','listing-probe-owner@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":[]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('51000000-0000-4000-8000-000000000002','authenticated','authenticated','listing-probe-active@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["listing_reviewer"]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('51000000-0000-4000-8000-000000000003','authenticated','authenticated','listing-probe-revoked@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["listing_reviewer"]}'::jsonb,'{}'::jsonb,now(),now(),false,false);

insert into public.user_roles(user_id,role_code,revoked_at) values
('51000000-0000-4000-8000-000000000002','listing_reviewer',null),
('51000000-0000-4000-8000-000000000003','listing_reviewer',now());

insert into public.property_listings(
 id,public_reference,owner_user_id,listing_kind,property_type,headline,description,
 division,district,status
) values (
 '52000000-0000-4000-8000-000000000001','BPP-PROBE01',
 '51000000-0000-4000-8000-000000000001','sale','apartment',
 'Temporary staff authorization probe','A temporary listing used only for a rolled-back database authorization test.',
 'Dhaka','Dhaka','submitted'
);

set local role authenticated;
select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"51000000-0000-4000-8000-000000000003","role":"authenticated","app_metadata":{"roles":["listing_reviewer"]}}',true);

do $assert_revoked_listing_hidden$
declare v_count integer;
begin
 select count(*) into v_count from public.property_listings where id='52000000-0000-4000-8000-000000000001';
 if v_count <> 0 then raise exception 'REVOKED_STAFF_CAN_READ_UNPUBLISHED_LISTING'; end if;
 select count(*) into v_count from public.listing_status_events;
 if v_count <> 0 then raise exception 'REVOKED_STAFF_CAN_READ_LISTING_HISTORY'; end if;
 begin
   perform public.transition_property_listing('52000000-0000-4000-8000-000000000001','under_review',null,'revoked-role-probe');
   raise exception 'REVOKED_STAFF_TRANSITION_WAS_NOT_DENIED';
 exception when others then
   if sqlerrm not like '%LISTING_NOT_FOUND_OR_TRANSITION_FORBIDDEN%' then raise; end if;
 end;
end;
$assert_revoked_listing_hidden$;

select set_config('request.jwt.claim.sub','51000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"51000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"roles":["listing_reviewer"]}}',true);

do $assert_active_listing_staff$
declare v_count integer;
begin
 select count(*) into v_count from public.property_listings where id='52000000-0000-4000-8000-000000000001';
 if v_count <> 1 then raise exception 'ACTIVE_STAFF_CANNOT_READ_UNPUBLISHED_LISTING'; end if;
 perform public.transition_property_listing('52000000-0000-4000-8000-000000000001','under_review',null,'active-role-probe');
 select count(*) into v_count from public.listing_status_events
 where listing_id='52000000-0000-4000-8000-000000000001';
 if v_count <> 2 then raise exception 'ACTIVE_STAFF_STATUS_HISTORY_MISSING'; end if;
end;
$assert_active_listing_staff$;

reset role;
rollback;
