-- Public projection must not reveal storage metadata and must fail closed by SQL predicate.
begin;

do $$
declare
  v_oid oid;
  v_def text;
begin
  select p.oid into v_oid
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'list_public_listing_media'
    and p.pronargs = 1;
  if v_oid is null then
    raise exception 'PUBLIC_LISTING_MEDIA_PROJECTION_MISSING';
  end if;
  if not has_function_privilege('anon', v_oid, 'EXECUTE')
     or not has_function_privilege('authenticated', v_oid, 'EXECUTE')
     or has_function_privilege('service_role', v_oid, 'EXECUTE') then
    raise exception 'PUBLIC_LISTING_MEDIA_PROJECTION_GRANTS_INVALID';
  end if;
  if not (select prosecdef from pg_proc where oid = v_oid) then
    raise exception 'PUBLIC_LISTING_MEDIA_PROJECTION_NOT_SECURITY_DEFINER';
  end if;
  if not exists (
    select 1 from pg_proc p, unnest(p.proconfig) setting
    where p.oid = v_oid and setting = 'search_path=""'
  ) then
    raise exception 'PUBLIC_LISTING_MEDIA_PROJECTION_SEARCH_PATH_NOT_PINNED';
  end if;
  select pg_get_functiondef(v_oid) into v_def;
  if v_def not ilike '%l.status = ''published''%'
     or v_def not ilike '%lm.moderation_status = ''approved''%'
     or v_def not ilike '%lm.publication_status = ''published''%'
     or v_def not ilike '%position <= 12%'
     or v_def ilike '%quarantine_storage_key%'
     or v_def ilike '%sha256_hex%' then
    raise exception 'PUBLIC_LISTING_MEDIA_PROJECTION_FILTERS_INVALID';
  end if;
end;
$$;

rollback;
