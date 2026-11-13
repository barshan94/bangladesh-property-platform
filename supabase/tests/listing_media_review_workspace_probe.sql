-- Reviewer queue projection must not reveal private Storage keys to browser roles.
begin;

do $$
declare
  v_fn oid;
  v_definition text;
begin
  select p.oid into v_fn
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'list_pending_listing_media_for_review'
    and p.pronargs = 0;
  if v_fn is null then
    raise exception 'LISTING_MEDIA_REVIEW_QUEUE_RPC_MISSING';
  end if;
  if not has_function_privilege('authenticated', v_fn, 'EXECUTE')
     or has_function_privilege('anon', v_fn, 'EXECUTE')
     or has_function_privilege('service_role', v_fn, 'EXECUTE') then
    raise exception 'LISTING_MEDIA_REVIEW_QUEUE_RPC_GRANTS_INVALID';
  end if;
  if not (select prosecdef from pg_proc where oid = v_fn) then
    raise exception 'LISTING_MEDIA_REVIEW_QUEUE_RPC_NOT_SECURITY_DEFINER';
  end if;
  if not exists (
    select 1 from pg_proc p, unnest(p.proconfig) setting
    where p.oid = v_fn and setting = 'search_path=""'
  ) then
    raise exception 'LISTING_MEDIA_REVIEW_QUEUE_RPC_SEARCH_PATH_NOT_PINNED';
  end if;
  select pg_get_functiondef(v_fn) into v_definition;
  if v_definition ilike '%quarantine_storage_key%' then
    raise exception 'LISTING_MEDIA_REVIEW_QUEUE_EXPOSES_STORAGE_KEY';
  end if;
  if v_definition not ilike '%moderation_status = ''pending''%' then
    raise exception 'LISTING_MEDIA_REVIEW_QUEUE_NOT_PENDING_ONLY';
  end if;
end;
$$;

rollback;
