-- Post-restore assertions for the database-only backup drill.
do $restore_verify$
declare
  v_rls_enabled boolean;
  v_policy_count integer;
begin
  if to_regclass('public.property_listings') is null then
    raise exception 'RESTORE_MISSING_PROPERTY_LISTINGS';
  end if;
  if to_regclass('public.user_roles') is null then
    raise exception 'RESTORE_MISSING_USER_ROLES';
  end if;
  if to_regclass('public.inquiries') is null then
    raise exception 'RESTORE_MISSING_INQUIRIES';
  end if;
  if to_regclass('public.service_requests') is null then
    raise exception 'RESTORE_MISSING_SERVICE_REQUESTS';
  end if;

  select c.relrowsecurity
    into v_rls_enabled
    from pg_class c
   where c.oid = to_regclass('public.property_listings');
  if coalesce(v_rls_enabled, false) is not true then
    raise exception 'RESTORE_PROPERTY_LISTINGS_RLS_NOT_ENABLED';
  end if;

  select count(*)
    into v_policy_count
    from pg_policies
   where schemaname = 'public';
  if v_policy_count < 1 then
    raise exception 'RESTORE_MISSING_PUBLIC_RLS_POLICIES';
  end if;

  if not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'create_public_inquiry'
  ) then
    raise exception 'RESTORE_MISSING_CREATE_PUBLIC_INQUIRY';
  end if;

  if not exists (
    select 1
      from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public'
       and p.proname = 'create_service_request'
  ) then
    raise exception 'RESTORE_MISSING_CREATE_SERVICE_REQUEST';
  end if;
end;
$restore_verify$;

select
  'property_listings' as table_name, count(*) as restored_rows
from public.property_listings
union all
select 'inquiries', count(*) from public.inquiries
union all
select 'service_requests', count(*) from public.service_requests;
