-- Transactional structural and authorization-boundary probe for editorial content.
begin;

do $$
declare
  v_rls boolean;
  v_policy_count integer;
  v_fn_oid oid;
begin
  select c.relrowsecurity into v_rls
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relname = 'knowledge_content';
  if v_rls is distinct from true then
    raise exception 'KNOWLEDGE_CONTENT_RLS_NOT_ENABLED';
  end if;

  if has_table_privilege('anon', 'public.knowledge_content', 'INSERT')
     or has_table_privilege('authenticated', 'public.knowledge_content', 'INSERT')
     or has_table_privilege('authenticated', 'public.knowledge_content', 'UPDATE')
     or has_table_privilege('authenticated', 'public.knowledge_content', 'DELETE') then
    raise exception 'KNOWLEDGE_CONTENT_BROWSER_WRITE_GRANT_PRESENT';
  end if;

  if has_table_privilege('anon', 'public.knowledge_content', 'SELECT')
     or has_table_privilege('authenticated', 'public.knowledge_content', 'SELECT') then
    raise exception 'KNOWLEDGE_CONTENT_INTERNAL_TABLE_READ_GRANT_PRESENT';
  end if;

  if not has_table_privilege('anon', 'public.published_knowledge_content', 'SELECT')
     or not has_table_privilege('authenticated', 'public.published_knowledge_content', 'SELECT') then
    raise exception 'KNOWLEDGE_CONTENT_PUBLIC_VIEW_GRANT_MISSING';
  end if;

  select count(*) into v_policy_count
  from information_schema.views
  where table_schema = 'public'
    and table_name = 'published_knowledge_content';
  if v_policy_count <> 1 then
    raise exception 'KNOWLEDGE_CONTENT_PUBLIC_VIEW_MISSING';
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'published_knowledge_content'
      and column_name in ('source_notes','review_note','reviewer_user_id','author_user_id')
  ) then
    raise exception 'KNOWLEDGE_CONTENT_INTERNAL_FIELDS_EXPOSED';
  end if;

  select p.oid into v_fn_oid
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname = 'transition_knowledge_content'
    and p.pronargs = 3;
  if v_fn_oid is null then
    raise exception 'KNOWLEDGE_CONTENT_TRANSITION_RPC_MISSING';
  end if;
  if not has_function_privilege('authenticated', v_fn_oid, 'EXECUTE')
     or has_function_privilege('anon', v_fn_oid, 'EXECUTE')
     or has_function_privilege('service_role', v_fn_oid, 'EXECUTE') then
    raise exception 'KNOWLEDGE_CONTENT_TRANSITION_RPC_GRANTS_INVALID';
  end if;
  if not (select prosecdef from pg_proc where oid = v_fn_oid) then
    raise exception 'KNOWLEDGE_CONTENT_TRANSITION_RPC_NOT_SECURITY_DEFINER';
  end if;
  if (select proconfig from pg_proc where oid = v_fn_oid) is null
     or not exists (
       select 1 from pg_proc p, unnest(p.proconfig) setting
       where p.oid = v_fn_oid and setting = 'search_path=""'
     ) then
    raise exception 'KNOWLEDGE_CONTENT_TRANSITION_RPC_SEARCH_PATH_NOT_PINNED';
  end if;
end;
$$;

rollback;
