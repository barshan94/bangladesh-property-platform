-- Verify the listing-media intake rate-limit and serialized pending quota.
begin;

do $$
declare
  v_private_fn oid;
  v_public_fn oid;
  v_trigger_def text;
begin
  if to_regclass('private.listing_media_upload_rate_limits') is null then
    raise exception 'LISTING_MEDIA_RATE_LIMIT_TABLE_MISSING';
  end if;

  if has_table_privilege('anon', 'private.listing_media_upload_rate_limits', 'SELECT')
     or has_table_privilege('authenticated', 'private.listing_media_upload_rate_limits', 'SELECT')
     or has_table_privilege('anon', 'private.listing_media_upload_rate_limits', 'INSERT')
     or has_table_privilege('authenticated', 'private.listing_media_upload_rate_limits', 'INSERT') then
    raise exception 'LISTING_MEDIA_RATE_LIMIT_BROWSER_ACCESS_PRESENT';
  end if;

  select p.oid into v_private_fn
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'consume_listing_media_upload_rate_limit'
    and p.pronargs = 3;
  if v_private_fn is null
     or not (select prosecdef from pg_proc where oid = v_private_fn)
     or not has_function_privilege('service_role', v_private_fn, 'EXECUTE')
     or has_function_privilege('anon', v_private_fn, 'EXECUTE')
     or has_function_privilege('authenticated', v_private_fn, 'EXECUTE') then
    raise exception 'LISTING_MEDIA_PRIVATE_RATE_LIMIT_RPC_GRANTS_INVALID';
  end if;

  select p.oid into v_public_fn
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'consume_listing_media_upload_rate_limit'
    and p.pronargs = 3;
  if v_public_fn is null
     or not has_function_privilege('service_role', v_public_fn, 'EXECUTE')
     or has_function_privilege('anon', v_public_fn, 'EXECUTE')
     or has_function_privilege('authenticated', v_public_fn, 'EXECUTE') then
    raise exception 'LISTING_MEDIA_PUBLIC_RATE_LIMIT_RPC_GRANTS_INVALID';
  end if;

  select pg_get_functiondef(p.oid) into v_trigger_def
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'private'
    and p.proname = 'validate_listing_media_insert';
  if v_trigger_def is null
     or v_trigger_def not ilike '%for update%'
     or v_trigger_def not ilike '%moderation_status = ''pending''%'
     or v_trigger_def not ilike '%v_pending_count >= 8%' then
    raise exception 'LISTING_MEDIA_PENDING_QUOTA_NOT_SERIALIZED';
  end if;

  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'listing_media'
      and t.tgname = 'listing_media_validate_insert'
      and not t.tgisinternal
  ) then
    raise exception 'LISTING_MEDIA_INSERT_VALIDATION_TRIGGER_MISSING';
  end if;
end;
$$;

rollback;
