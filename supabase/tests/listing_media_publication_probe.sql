-- Verify the publisher RPC and queue remain narrow, role-gated and fail-closed.
begin;

do $$
declare
  v_publish_oid oid;
  v_queue_oid oid;
  v_publish_def text;
  v_queue_def text;
  v_trigger_def text;
begin
  select p.oid into v_publish_oid
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'set_listing_media_publication'
    and p.pronargs = 3;

  if v_publish_oid is null then
    raise exception 'LISTING_MEDIA_PUBLICATION_RPC_MISSING';
  end if;
  if not has_function_privilege('authenticated', v_publish_oid, 'EXECUTE')
     or has_function_privilege('anon', v_publish_oid, 'EXECUTE')
     or has_function_privilege('service_role', v_publish_oid, 'EXECUTE') then
    raise exception 'LISTING_MEDIA_PUBLICATION_RPC_GRANTS_INVALID';
  end if;
  if not (select prosecdef from pg_proc where oid = v_publish_oid) then
    raise exception 'LISTING_MEDIA_PUBLICATION_RPC_NOT_SECURITY_DEFINER';
  end if;
  if not exists (
    select 1 from pg_proc p, unnest(p.proconfig) setting
    where p.oid = v_publish_oid and setting = 'search_path=""'
  ) then
    raise exception 'LISTING_MEDIA_PUBLICATION_RPC_SEARCH_PATH_NOT_PINNED';
  end if;

  select pg_get_functiondef(v_publish_oid) into v_publish_def;
  if v_publish_def not ilike '%has_active_listing_staff_role(''listing_publisher'')%'
     or v_publish_def not ilike '%has_active_listing_staff_role(''administrator'')%'
     or v_publish_def ilike '%has_active_listing_staff_role(''listing_reviewer'')%' then
    raise exception 'LISTING_MEDIA_PUBLICATION_ROLE_POLICY_INVALID';
  end if;
  if v_publish_def not ilike '%for update%'
     or v_publish_def not ilike '%owner_user_id = auth.uid()%'
     or v_publish_def not ilike '%moderation_status <> ''approved''%'
     or v_publish_def not ilike '%insert into public.audit_events%' then
    raise exception 'LISTING_MEDIA_PUBLICATION_TRANSITION_GUARDS_MISSING';
  end if;

  select p.oid into v_queue_oid
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'list_approved_listing_media_for_publication'
    and p.pronargs = 0;
  if v_queue_oid is null
     or not has_function_privilege('authenticated', v_queue_oid, 'EXECUTE')
     or has_function_privilege('anon', v_queue_oid, 'EXECUTE')
     or has_function_privilege('service_role', v_queue_oid, 'EXECUTE') then
    raise exception 'LISTING_MEDIA_PUBLICATION_QUEUE_GRANTS_INVALID';
  end if;
  select pg_get_functiondef(v_queue_oid) into v_queue_def;
  if v_queue_def ilike '%quarantine_storage_key%'
     or v_queue_def ilike '%sha256_hex%'
     or v_queue_def not ilike '%owner_user_id <> auth.uid()%' then
    raise exception 'LISTING_MEDIA_PUBLICATION_QUEUE_PROJECTION_INVALID';
  end if;

  select pg_get_functiondef(p.oid) into v_trigger_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'prevent_listing_media_mutation'
    and p.pronargs = 0;
  if v_trigger_def is null
     or v_trigger_def not ilike '%ONLY_APPROVED_MEDIA_CAN_CHANGE_PUBLICATION%'
     or v_trigger_def not ilike '%LISTING_MEDIA_REVIEW_IS_FINAL%' then
    raise exception 'LISTING_MEDIA_PUBLICATION_IMMUTABILITY_TRIGGER_INVALID';
  end if;
end;
$$;

rollback;
