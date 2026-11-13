-- Transactional service-request RPC authorization probe.
-- Run as the database owner in the Supabase SQL editor.
-- Synthetic Auth users, roles, request and audit/history records are rolled back.
begin;

create temporary table rpc_probe_results(
  label text primary key,
  status text,
  history_count integer,
  audit_count integer
) on commit drop;

insert into auth.users(id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,is_sso_user,is_anonymous)
values
('30000000-0000-4000-8000-000000000001','authenticated','authenticated','rpc-owner@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":[]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('30000000-0000-4000-8000-000000000002','authenticated','authenticated','rpc-manager-a@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["case_manager"]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('30000000-0000-4000-8000-000000000003','authenticated','authenticated','rpc-manager-b@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["case_manager"]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('30000000-0000-4000-8000-000000000004','authenticated','authenticated','rpc-intake@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["intake_coordinator"]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('30000000-0000-4000-8000-000000000005','authenticated','authenticated','rpc-revoked@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["case_manager"]}'::jsonb,'{}'::jsonb,now(),now(),false,false),
('30000000-0000-4000-8000-000000000006','authenticated','authenticated','rpc-admin@example.invalid','',now(),'{"provider":"email","providers":["email"],"roles":["administrator"]}'::jsonb,'{}'::jsonb,now(),now(),false,false);

insert into public.user_roles(user_id,role_code,revoked_at) values
('30000000-0000-4000-8000-000000000002','case_manager',null),
('30000000-0000-4000-8000-000000000003','case_manager',null),
('30000000-0000-4000-8000-000000000004','intake_coordinator',null),
('30000000-0000-4000-8000-000000000005','case_manager',now()),
('30000000-0000-4000-8000-000000000006','administrator',null);

insert into public.service_requests(id,requester_user_id,service_code,contact_name,email_normalized,summary,consent_version,status)
values('40000000-0000-4000-8000-000000000011','30000000-0000-4000-8000-000000000001','property_verification','RPC Probe Owner','rpc-owner@example.invalid','Temporary RPC authorization probe','probe-v1','triaged');

set local role authenticated;
select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000004',true);
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000004","role":"authenticated","app_metadata":{"roles":["intake_coordinator"]}}',true);
select public.manage_service_request('40000000-0000-4000-8000-000000000011','assigned','30000000-0000-4000-8000-000000000002','Assigned by intake coordinator','rpc-probe-assign');

select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"roles":["case_manager"]}}',true);
select public.manage_service_request('40000000-0000-4000-8000-000000000011','in_progress',null,'Started assigned case','rpc-probe-start');

select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000003',true);
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000003","role":"authenticated","app_metadata":{"roles":["case_manager"]}}',true);
do $assert_manager_b$
begin
  begin
    perform public.manage_service_request('40000000-0000-4000-8000-000000000011','resolved',null,'Attempt by other manager','rpc-probe-manager-b');
    raise exception 'EXPECTED_MANAGER_B_DENIAL_NOT_RAISED';
  exception when others then
    if sqlerrm <> 'FORBIDDEN_SERVICE_REQUEST_TRANSITION' then raise; end if;
  end;
end;
$assert_manager_b$;

select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000002',true);
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000002","role":"authenticated","app_metadata":{"roles":["case_manager"]}}',true);
do $assert_manager_reassign$
begin
  begin
    perform public.manage_service_request('40000000-0000-4000-8000-000000000011',null,'30000000-0000-4000-8000-000000000003','Attempt to reassign case','rpc-probe-reassign');
    raise exception 'EXPECTED_MANAGER_REASSIGN_DENIAL_NOT_RAISED';
  exception when others then
    if sqlerrm <> 'FORBIDDEN_SERVICE_REQUEST_ASSIGNMENT' then raise; end if;
  end;
end;
$assert_manager_reassign$;

select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000006',true);
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000006","role":"authenticated","app_metadata":{"roles":["administrator"]}}',true);
do $assert_admin_transition$
begin
  begin
    perform public.manage_service_request('40000000-0000-4000-8000-000000000011','closed',null,'Administrator transition attempt','rpc-probe-admin');
    raise exception 'EXPECTED_ADMIN_TRANSITION_DENIAL_NOT_RAISED';
  exception when others then
    if sqlerrm <> 'FORBIDDEN_SERVICE_REQUEST_TRANSITION' then raise; end if;
  end;
end;
$assert_admin_transition$;

select set_config('request.jwt.claim.sub','30000000-0000-4000-8000-000000000005',true);
select set_config('request.jwt.claims','{"sub":"30000000-0000-4000-8000-000000000005","role":"authenticated","app_metadata":{"roles":["case_manager"]}}',true);
do $assert_revoked$
begin
  begin
    perform public.manage_service_request('40000000-0000-4000-8000-000000000011','closed',null,'Revoked manager attempt','rpc-probe-revoked');
    raise exception 'EXPECTED_REVOKED_ROLE_DENIAL_NOT_RAISED';
  exception when others then
    if sqlerrm <> 'NOT_AUTHORIZED' then raise; end if;
  end;
end;
$assert_revoked$;

reset role;
insert into rpc_probe_results
select 'final_state',sr.status,
       (select count(*)::int from public.service_request_status_events e where e.service_request_id=sr.id),
       (select count(*)::int from public.audit_events a where a.resource_type='service_request' and a.resource_id=sr.id)
from public.service_requests sr where sr.id='40000000-0000-4000-8000-000000000011';

do $assert_final$
begin
  if not exists (select 1 from rpc_probe_results where label='final_state' and status='in_progress' and history_count=2 and audit_count=2) then
    raise exception 'SERVICE_REQUEST_RPC_PROBE_FAILED';
  end if;
end;
$assert_final$;

select * from rpc_probe_results;
rollback;
