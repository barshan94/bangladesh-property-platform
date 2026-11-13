-- Transactional service-request RLS probe.
-- Run as the database owner in the Supabase SQL editor.
-- Every synthetic Auth user, role, request and event is rolled back at the end.
begin;

create temporary table rls_probe_results (
  label text primary key,
  request_count integer not null,
  event_count integer not null
) on commit drop;
grant insert on rls_probe_results to authenticated;

insert into auth.users(
  id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at,is_sso_user,is_anonymous
) values
('10000000-0000-4000-8000-000000000001','authenticated','authenticated','probe-owner@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":[]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('10000000-0000-4000-8000-000000000002','authenticated','authenticated','probe-manager-a@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["case_manager"]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('10000000-0000-4000-8000-000000000003','authenticated','authenticated','probe-manager-b@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["case_manager"]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('10000000-0000-4000-8000-000000000004','authenticated','authenticated','probe-intake@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["intake_coordinator"]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('10000000-0000-4000-8000-000000000005','authenticated','authenticated','probe-revoked@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["case_manager"]}'::jsonb,'{}'::jsonb,now(),now(),false,false);

insert into public.user_roles(user_id,role_code,revoked_at) values
('10000000-0000-4000-8000-000000000002','case_manager',null),
('10000000-0000-4000-8000-000000000003','case_manager',null),
('10000000-0000-4000-8000-000000000004','intake_coordinator',null),
('10000000-0000-4000-8000-000000000005','case_manager',now());

insert into public.service_requests(
  id,requester_user_id,service_code,contact_name,email_normalized,summary,
  consent_version,status,assigned_to
) values
('20000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000001','property_verification','Probe Owner','owner@example.invalid','Temporary RLS test request A','probe-v1','assigned','10000000-0000-4000-8000-000000000002'),
('20000000-0000-4000-8000-000000000012','10000000-0000-4000-8000-000000000001','property_verification','Probe Owner','owner@example.invalid','Temporary RLS test request B','probe-v1','assigned','10000000-0000-4000-8000-000000000003');

insert into public.service_request_status_events(
  service_request_id,to_status,assigned_to,actor_user_id,reason,request_id
) values
('20000000-0000-4000-8000-000000000011','assigned','10000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000004','Temporary RLS probe event A','probe-a'),
('20000000-0000-4000-8000-000000000012','assigned','10000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000004','Temporary RLS probe event B','probe-b');

set local role authenticated;
select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000001',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000001","role":"authenticated","app_metadata":{"roles":[]}}',true);
insert into rls_probe_results select 'owner',(select count(*)::int from public.service_requests),(select count(*)::int from public.service_request_status_events);

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"roles":["case_manager"]}}',true);
insert into rls_probe_results select 'manager_a',(select count(*)::int from public.service_requests),(select count(*)::int from public.service_request_status_events);

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000003","role":"authenticated","app_metadata":{"roles":["case_manager"]}}',true);
insert into rls_probe_results select 'manager_b',(select count(*)::int from public.service_requests),(select count(*)::int from public.service_request_status_events);

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"roles":["intake_coordinator"]}}',true);
insert into rls_probe_results select 'intake',(select count(*)::int from public.service_requests),(select count(*)::int from public.service_request_status_events);

select set_config('request.jwt.claim.sub','10000000-0000-4000-8000-000000000005',true);
select set_config('request.jwt.claims','{"sub":"10000000-0000-4000-8000-000000000005","role":"authenticated","app_metadata":{"roles":["case_manager"]}}',true);
insert into rls_probe_results select 'revoked_manager',(select count(*)::int from public.service_requests),(select count(*)::int from public.service_request_status_events);

reset role;

do $assert$
begin
  if not exists (select 1 from rls_probe_results where label='owner' and request_count=2 and event_count=2)
     or not exists (select 1 from rls_probe_results where label='manager_a' and request_count=1 and event_count=1)
     or not exists (select 1 from rls_probe_results where label='manager_b' and request_count=1 and event_count=1)
     or not exists (select 1 from rls_probe_results where label='intake' and request_count=2 and event_count=2)
     or not exists (select 1 from rls_probe_results where label='revoked_manager' and request_count=0 and event_count=0) then
    raise exception 'SERVICE_REQUEST_RLS_PROBE_FAILED';
  end if;
  if has_table_privilege('anon','public.service_requests','SELECT')
     or has_table_privilege('anon','public.service_request_status_events','SELECT') then
    raise exception 'ANON_SERVICE_REQUEST_READ_GRANT_PRESENT';
  end if;
end;
$assert$;

select * from rls_probe_results order by label;
rollback;
