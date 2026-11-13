-- Exercise the atomic private-document quota reservation RPC.
-- This runs only against the isolated local CI database and rolls back all fixtures.
begin;

insert into auth.users(
  id,aud,role,email,encrypted_password,email_confirmed_at,
  raw_app_meta_data,raw_user_meta_data,created_at,updated_at,is_sso_user,is_anonymous
) values (
  '50000000-0000-4000-8000-000000000001','authenticated','authenticated',
  'private-quota-probe@example.invalid','',now(),
  '{"provider":"email","providers":["email"],"roles":[]}'::jsonb,'{}'::jsonb,
  now(),now(),false,false
);

insert into public.service_requests(
  id,requester_user_id,service_code,contact_name,email_normalized,summary,consent_version,status
) values (
  '50000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  'property_verification','Quota Probe Owner','private-quota-probe@example.invalid',
  'Temporary private document quota probe','probe-v1','new'
);

do $assert_rpc_privileges$
begin
  if has_function_privilege('anon',
       'public.reserve_private_document_slot(uuid,uuid,text,uuid,uuid,text,text,text,bigint,text)','EXECUTE')
     or has_function_privilege('authenticated',
       'public.reserve_private_document_slot(uuid,uuid,text,uuid,uuid,text,text,text,bigint,text)','EXECUTE') then
    raise exception 'PRIVATE_DOCUMENT_RESERVATION_CLIENT_EXECUTE_GRANT_PRESENT';
  end if;
  if not has_function_privilege('service_role',
       'public.reserve_private_document_slot(uuid,uuid,text,uuid,uuid,text,text,text,bigint,text)','EXECUTE') then
    raise exception 'PRIVATE_DOCUMENT_RESERVATION_SERVICE_ROLE_GRANT_MISSING';
  end if;
end;
$assert_rpc_privileges$;

set local role service_role;

select public.reserve_private_document_slot(
  '51000000-0000-4000-8000-000000000001',
  '50000000-0000-4000-8000-000000000001',
  'client_case',null,'50000000-0000-4000-8000-000000000001',
  'quarantine/probe/51000000-0000-4000-8000-000000000001',
  'evidence-1.pdf','application/pdf',1024,repeat('a',64)
);
select public.reserve_private_document_slot(
  '51000000-0000-4000-8000-000000000002',
  '50000000-0000-4000-8000-000000000001',
  'client_case',null,'50000000-0000-4000-8000-000000000001',
  'quarantine/probe/51000000-0000-4000-8000-000000000002',
  'evidence-2.pdf','application/pdf',1024,repeat('b',64)
);
select public.reserve_private_document_slot(
  '51000000-0000-4000-8000-000000000003',
  '50000000-0000-4000-8000-000000000001',
  'client_case',null,'50000000-0000-4000-8000-000000000001',
  'quarantine/probe/51000000-0000-4000-8000-000000000003',
  'evidence-3.pdf','application/pdf',1024,repeat('c',64)
);
select public.reserve_private_document_slot(
  '51000000-0000-4000-8000-000000000004',
  '50000000-0000-4000-8000-000000000001',
  'client_case',null,'50000000-0000-4000-8000-000000000001',
  'quarantine/probe/51000000-0000-4000-8000-000000000004',
  'evidence-4.pdf','application/pdf',1024,repeat('d',64)
);
select public.reserve_private_document_slot(
  '51000000-0000-4000-8000-000000000005',
  '50000000-0000-4000-8000-000000000001',
  'client_case',null,'50000000-0000-4000-8000-000000000001',
  'quarantine/probe/51000000-0000-4000-8000-000000000005',
  'evidence-5.pdf','application/pdf',1024,repeat('e',64)
);

do $assert_sixth_reservation_denied$
begin
  begin
    perform public.reserve_private_document_slot(
      '51000000-0000-4000-8000-000000000006',
      '50000000-0000-4000-8000-000000000001',
      'client_case',null,'50000000-0000-4000-8000-000000000001',
      'quarantine/probe/51000000-0000-4000-8000-000000000006',
      'evidence-6.pdf','application/pdf',1024,repeat('f',64)
    );
    raise exception 'EXPECTED_PRIVATE_DOCUMENT_QUOTA_DENIAL_NOT_RAISED';
  exception when others then
    if sqlerrm <> 'PENDING_DOCUMENT_LIMIT_REACHED' then raise; end if;
  end;
end;
$assert_sixth_reservation_denied$;

reset role;

do $assert_exact_quota$
begin
  if (select count(*) from public.private_documents
      where owner_user_id='50000000-0000-4000-8000-000000000001'
        and scan_status='pending' and deleted_at is null) <> 5 then
    raise exception 'PRIVATE_DOCUMENT_QUOTA_COUNT_MISMATCH';
  end if;
end;
$assert_exact_quota$;


do $assert_upload_rate_rpc_privileges$
begin
  if has_function_privilege('anon',
       'public.consume_private_document_upload_rate_limit(uuid,integer,integer)','EXECUTE')
     or has_function_privilege('authenticated',
       'public.consume_private_document_upload_rate_limit(uuid,integer,integer)','EXECUTE') then
    raise exception 'PRIVATE_DOCUMENT_RATE_LIMIT_CLIENT_EXECUTE_GRANT_PRESENT';
  end if;
  if not has_function_privilege('service_role',
       'public.consume_private_document_upload_rate_limit(uuid,integer,integer)','EXECUTE') then
    raise exception 'PRIVATE_DOCUMENT_RATE_LIMIT_SERVICE_ROLE_GRANT_MISSING';
  end if;
end;
$assert_upload_rate_rpc_privileges$;

do $assert_scan_rpc_privileges$
begin
  if has_function_privilege('anon',
       'public.complete_private_document_scan(uuid,text,text,text,text)','EXECUTE')
     or has_function_privilege('authenticated',
       'public.complete_private_document_scan(uuid,text,text,text,text)','EXECUTE') then
    raise exception 'PRIVATE_DOCUMENT_SCAN_CLIENT_EXECUTE_GRANT_PRESENT';
  end if;
  if not has_function_privilege('service_role',
       'public.complete_private_document_scan(uuid,text,text,text,text)','EXECUTE') then
    raise exception 'PRIVATE_DOCUMENT_SCAN_SERVICE_ROLE_GRANT_MISSING';
  end if;
end;
$assert_scan_rpc_privileges$;

set local role service_role;

do $assert_upload_rate_limit$
declare
  v_allowed boolean;
  v_remaining integer;
  v_retry integer;
  i integer;
begin
  for i in 1..10 loop
    select r.allowed,r.remaining,r.retry_after_seconds
      into v_allowed,v_remaining,v_retry
    from public.consume_private_document_upload_rate_limit(
      '50000000-0000-4000-8000-000000000001',10,3600
    ) r;
    if not v_allowed then
      raise exception 'PRIVATE_DOCUMENT_UPLOAD_RATE_LIMITED_TOO_EARLY';
    end if;
  end loop;

  select r.allowed,r.remaining,r.retry_after_seconds
    into v_allowed,v_remaining,v_retry
  from public.consume_private_document_upload_rate_limit(
    '50000000-0000-4000-8000-000000000001',10,3600
  ) r;

  if v_allowed or v_remaining <> 0 or v_retry < 1 then
    raise exception 'PRIVATE_DOCUMENT_UPLOAD_RATE_LIMIT_DID_NOT_BLOCK_ELEVENTH_REQUEST';
  end if;
end;
$assert_upload_rate_limit$;

reset role;

set local role service_role;

do $assert_scan_digest_binding$
begin
  begin
    perform public.complete_private_document_scan(
      '51000000-0000-4000-8000-000000000001',repeat('0',64),
      'clean','ci-probe-engine','probe-scan-wrong-digest'
    );
    raise exception 'EXPECTED_PRIVATE_DOCUMENT_SCAN_DIGEST_REJECTION_NOT_RAISED';
  exception when others then
    if sqlerrm <> 'PRIVATE_DOCUMENT_SCAN_TARGET_MISMATCH_OR_ALREADY_SCANNED' then raise; end if;
  end;
end;
$assert_scan_digest_binding$;

select public.complete_private_document_scan(
  '51000000-0000-4000-8000-000000000001',repeat('a',64),
  'clean','ci-probe-engine','probe-scan-clean'
);

do $assert_scan_replay_rejected$
begin
  begin
    perform public.complete_private_document_scan(
      '51000000-0000-4000-8000-000000000001',repeat('a',64),
      'clean','ci-probe-engine','probe-scan-clean'
    );
    raise exception 'EXPECTED_PRIVATE_DOCUMENT_SCAN_REPLAY_REJECTION_NOT_RAISED';
  exception when others then
    if sqlerrm <> 'PRIVATE_DOCUMENT_SCAN_TARGET_MISMATCH_OR_ALREADY_SCANNED' then raise; end if;
  end;
end;
$assert_scan_replay_rejected$;


reset role;

do $assert_scan_audit_and_state$
begin
  if not exists (
    select 1 from public.private_documents
    where id='51000000-0000-4000-8000-000000000001'
      and scan_status='clean'
      and scanned_at is not null
      and scan_engine='ci-probe-engine'
  ) then
    raise exception 'PRIVATE_DOCUMENT_SCAN_STATE_NOT_RECORDED';
  end if;
  if not exists (
    select 1 from public.document_access_events
    where document_id='51000000-0000-4000-8000-000000000001'
      and action='scan'
      and purpose='trusted_scanner:ci-probe-engine'
      and request_id='probe-scan-clean'
  ) then
    raise exception 'PRIVATE_DOCUMENT_SCAN_AUDIT_NOT_RECORDED';
  end if;
end;
$assert_scan_audit_and_state$;

rollback;
