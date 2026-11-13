-- Verify listing media is isolated in private quarantine and cannot be exposed by browser roles.
-- Run as the database owner in the isolated local Supabase test project.
begin;

do $assert_listing_media_boundary$
declare
  v_rls_enabled boolean;
  v_bucket_public boolean;
  v_bucket_limit bigint;
  v_bucket_mimes text[];
  v_policy_count integer;
  v_review_security_definer boolean;
  v_review_search_path text[];
begin
  if has_table_privilege('anon','public.listing_media','SELECT')
     or has_table_privilege('anon','public.listing_media','INSERT')
     or has_table_privilege('anon','public.listing_media','UPDATE')
     or has_table_privilege('anon','public.listing_media','DELETE')
     or has_table_privilege('authenticated','public.listing_media','SELECT')
     or has_table_privilege('authenticated','public.listing_media','INSERT')
     or has_table_privilege('authenticated','public.listing_media','UPDATE')
     or has_table_privilege('authenticated','public.listing_media','DELETE') then
    raise exception 'LISTING_MEDIA_CLIENT_TABLE_GRANT_PRESENT';
  end if;

  select c.relrowsecurity into v_rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'listing_media';
  if v_rls_enabled is distinct from true then
    raise exception 'LISTING_MEDIA_RLS_DISABLED';
  end if;

  if has_function_privilege('anon','public.review_listing_media(uuid,text,text)','EXECUTE')
     or not has_function_privilege('authenticated','public.review_listing_media(uuid,text,text)','EXECUTE')
     or has_function_privilege('service_role','public.review_listing_media(uuid,text,text)','EXECUTE') then
    raise exception 'LISTING_MEDIA_REVIEW_RPC_GRANTS_INVALID';
  end if;

  select p.prosecdef, p.proconfig
    into v_review_security_definer, v_review_search_path
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.proname = 'review_listing_media'
    and pg_get_function_identity_arguments(p.oid) = 'p_media_id uuid, p_decision text, p_reason text';
  if v_review_security_definer is distinct from true then
    raise exception 'LISTING_MEDIA_REVIEW_RPC_NOT_SECURITY_DEFINER';
  end if;
  if not coalesce(v_review_search_path @> array['search_path=""']::text[], false) then
    raise exception 'LISTING_MEDIA_REVIEW_RPC_SEARCH_PATH_NOT_PINNED';
  end if;

  select public, file_size_limit, allowed_mime_types
    into v_bucket_public, v_bucket_limit, v_bucket_mimes
  from storage.buckets where id = 'listing-media-quarantine';
  if not found then
    raise exception 'LISTING_MEDIA_QUARANTINE_BUCKET_MISSING';
  end if;
  if v_bucket_public is distinct from false then
    raise exception 'LISTING_MEDIA_QUARANTINE_BUCKET_IS_PUBLIC';
  end if;
  if v_bucket_limit <> 8388608 then
    raise exception 'LISTING_MEDIA_QUARANTINE_SIZE_LIMIT_MISMATCH';
  end if;
  if not (v_bucket_mimes @> array['image/jpeg','image/png','image/webp']::text[])
     or cardinality(v_bucket_mimes) <> 3 then
    raise exception 'LISTING_MEDIA_QUARANTINE_MIME_ALLOWLIST_MISMATCH';
  end if;

  select count(*) into v_policy_count
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and (roles && array['anon','authenticated']::name[])
    and (coalesce(qual,'') || ' ' || coalesce(with_check,'')) ilike '%listing-media-quarantine%';
  if v_policy_count <> 0 then
    raise exception 'LISTING_MEDIA_QUARANTINE_HAS_CLIENT_STORAGE_POLICY';
  end if;
end;
$assert_listing_media_boundary$;

rollback;
