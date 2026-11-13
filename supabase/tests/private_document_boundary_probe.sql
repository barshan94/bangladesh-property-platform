-- Verify private evidence metadata and storage remain inaccessible to browser roles.
-- Run as the database owner in the isolated local Supabase test project.
begin;

do $assert_private_document_boundary$
declare
  v_bucket_public boolean;
  v_bucket_limit bigint;
  v_bucket_mimes text[];
  v_rls_enabled boolean;
  v_policy_count integer;
begin
  if has_table_privilege('anon','public.private_documents','SELECT')
     or has_table_privilege('anon','public.private_documents','INSERT')
     or has_table_privilege('anon','public.private_documents','UPDATE')
     or has_table_privilege('anon','public.private_documents','DELETE')
     or has_table_privilege('authenticated','public.private_documents','SELECT')
     or has_table_privilege('authenticated','public.private_documents','INSERT')
     or has_table_privilege('authenticated','public.private_documents','UPDATE')
     or has_table_privilege('authenticated','public.private_documents','DELETE') then
    raise exception 'PRIVATE_DOCUMENT_METADATA_CLIENT_GRANT_PRESENT';
  end if;

  if has_table_privilege('anon','public.document_access_events','SELECT')
     or has_table_privilege('anon','public.document_access_events','INSERT')
     or has_table_privilege('authenticated','public.document_access_events','SELECT')
     or has_table_privilege('authenticated','public.document_access_events','INSERT') then
    raise exception 'DOCUMENT_ACCESS_AUDIT_CLIENT_GRANT_PRESENT';
  end if;

  select c.relrowsecurity into v_rls_enabled
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'private_documents';
  if v_rls_enabled is distinct from true then
    raise exception 'PRIVATE_DOCUMENT_METADATA_RLS_DISABLED';
  end if;

  select public, file_size_limit, allowed_mime_types
    into v_bucket_public, v_bucket_limit, v_bucket_mimes
  from storage.buckets where id = 'private-evidence';

  if not found then
    raise exception 'PRIVATE_EVIDENCE_BUCKET_MISSING';
  end if;
  if v_bucket_public is distinct from false then
    raise exception 'PRIVATE_EVIDENCE_BUCKET_IS_PUBLIC';
  end if;
  if v_bucket_limit <> 15728640 then
    raise exception 'PRIVATE_EVIDENCE_BUCKET_SIZE_LIMIT_MISMATCH';
  end if;
  if not (v_bucket_mimes @> array['application/pdf','image/jpeg','image/png']::text[])
     or cardinality(v_bucket_mimes) <> 3 then
    raise exception 'PRIVATE_EVIDENCE_BUCKET_MIME_ALLOWLIST_MISMATCH';
  end if;

  select count(*) into v_policy_count
  from pg_policies
  where schemaname = 'storage'
    and tablename = 'objects'
    and (roles && array['anon','authenticated']::name[])
    and (coalesce(qual,'') || ' ' || coalesce(with_check,'')) ilike '%private-evidence%';
  if v_policy_count <> 0 then
    raise exception 'PRIVATE_EVIDENCE_HAS_CLIENT_STORAGE_POLICY';
  end if;
end;
$assert_private_document_boundary$;

rollback;
