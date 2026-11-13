-- Service-request intake correction and staff handling foundation.
-- Forward-only migration; no data is deleted or rewritten.

begin;

alter table public.service_requests
  add column if not exists assigned_to uuid references auth.users(id) on delete set null;

create index if not exists service_requests_assigned_to_created_at_idx
  on public.service_requests (assigned_to, created_at desc);

create table if not exists public.service_request_status_events (
  id uuid primary key default gen_random_uuid(),
  service_request_id uuid not null references public.service_requests(id) on delete cascade,
  from_status text,
  to_status text not null,
  assigned_to uuid references auth.users(id) on delete set null,
  actor_user_id uuid references auth.users(id) on delete set null,
  reason text not null check (char_length(btrim(reason)) between 5 and 1000),
  request_id text not null check (char_length(request_id) between 1 and 128),
  created_at timestamptz not null default now()
);

create index if not exists service_request_status_events_request_created_idx
  on public.service_request_status_events (service_request_id, created_at desc);
create index if not exists service_request_status_events_actor_idx
  on public.service_request_status_events (actor_user_id);
create index if not exists service_request_status_events_assigned_idx
  on public.service_request_status_events (assigned_to);

alter table public.service_request_status_events enable row level security;
revoke all on public.service_request_status_events from anon, authenticated;
grant select on public.service_request_status_events to authenticated;

drop policy if exists service_request_status_events_read_own_or_staff
  on public.service_request_status_events;
create policy service_request_status_events_read_own_or_staff
  on public.service_request_status_events for select to authenticated
  using (
    exists (
      select 1 from public.service_requests sr
      where sr.id = service_request_id
        and (
          sr.requester_user_id = (select auth.uid())
          or ((select auth.jwt()) -> 'app_metadata' -> 'roles')
             ?| array['intake_coordinator','case_manager','administrator']
        )
    )
  );

-- Replace the earlier intake function: contact_name was mistakenly mapped
-- into property_listing_id in its VALUES list.
create or replace function public.create_service_request(
  p_requester_user_id uuid,
  p_service_code text,
  p_contact_name text,
  p_email_normalized text,
  p_phone text,
  p_country text,
  p_property_district text,
  p_property_listing_id uuid,
  p_summary text,
  p_consent_version text,
  p_request_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_request_id uuid;
  v_recent_count integer;
begin
  if p_requester_user_id is null
     or p_service_code not in (
       'title-and-record-review','buying-and-selling','transfer-and-mutation',
       'inheritance-and-succession','partition-and-co-ownership',
       'property-disputes','remote-property-support','property-tax-and-finance',
       'property_verification','title_due_diligence','remote_property_inspection',
       'property_management','buying_assistance','selling_assistance',
       'inheritance_guidance','legal_consultation','other'
     )
     or p_contact_name is null or char_length(pg_catalog.btrim(p_contact_name)) not between 2 and 120
     or p_email_normalized is null or char_length(p_email_normalized) not between 3 and 254
     or p_email_normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
     or (p_phone is not null and char_length(p_phone) > 32)
     or (p_country is not null and p_country !~ '^[A-Z]{2}$')
     or (p_property_district is not null and char_length(pg_catalog.btrim(p_property_district)) not between 2 and 80)
     or p_summary is null or char_length(pg_catalog.btrim(p_summary)) not between 10 and 2000
     or p_consent_version is null or char_length(p_consent_version) not between 1 and 40
     or p_request_id is null or char_length(p_request_id) not between 1 and 128 then
    raise exception 'INVALID_SERVICE_REQUEST';
  end if;

  if p_property_listing_id is not null and not exists (
    select 1 from public.property_listings l
    where l.id = p_property_listing_id
      and (l.status = 'published' or l.owner_user_id = p_requester_user_id)
  ) then
    raise exception 'INVALID_PROPERTY_REFERENCE';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_requester_user_id::text, 0)
  );

  select count(*)::integer into v_recent_count
  from public.service_requests sr
  where sr.requester_user_id = p_requester_user_id
    and sr.created_at > pg_catalog.now() - interval '15 minutes';

  if v_recent_count >= 5 then
    raise exception 'SERVICE_REQUEST_RATE_LIMITED';
  end if;

  insert into public.service_requests (
    requester_user_id, service_code, property_listing_id, contact_name,
    email_normalized, phone, country_of_residence, property_district,
    summary, consent_version, status
  ) values (
    p_requester_user_id, p_service_code, p_property_listing_id,
    pg_catalog.btrim(p_contact_name),
    pg_catalog.lower(pg_catalog.btrim(p_email_normalized)), p_phone,
    p_country, nullif(pg_catalog.btrim(p_property_district), ''),
    pg_catalog.btrim(p_summary), p_consent_version, 'new'
  ) returning id into v_request_id;

  insert into public.consent_records (user_id, consent_type, notice_version, source)
  values (p_requester_user_id, 'service_request_processing', p_consent_version, 'service_intake');

  insert into public.audit_events (
    actor_user_id, action, resource_type, resource_id, after_summary, request_id
  ) values (
    p_requester_user_id, 'service_request.created', 'service_request', v_request_id,
    pg_catalog.jsonb_build_object('service_code',p_service_code,'status','new',
      'property_district',nullif(pg_catalog.btrim(p_property_district),'')),
    p_request_id
  );

  insert into public.service_request_status_events (
    service_request_id, from_status, to_status, assigned_to, actor_user_id, reason, request_id
  ) values (v_request_id, null, 'new', null, p_requester_user_id, 'Request submitted', p_request_id);

  return v_request_id;
end;
$$;

revoke all on function public.create_service_request(uuid,text,text,text,text,text,text,uuid,text,text,text)
  from public, anon, authenticated;
grant execute on function public.create_service_request(uuid,text,text,text,text,text,text,uuid,text,text,text)
  to service_role;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
grant usage on schema private to authenticated;

create or replace function private.manage_service_request(
  p_service_request_id uuid,
  p_new_status text,
  p_assigned_to uuid,
  p_reason text,
  p_request_id text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_current_status text;
  v_current_assignee uuid;
  v_roles jsonb := coalesce((select auth.jwt()) -> 'app_metadata' -> 'roles', '[]'::jsonb);
  v_has_intake boolean := false;
  v_has_case_manager boolean := false;
  v_has_administrator boolean := false;
  v_next_status text;
  v_allowed_transition boolean := false;
begin
  if v_actor is null then raise exception 'NOT_AUTHORIZED'; end if;

  select
    coalesce(bool_or(ur.role_code = 'intake_coordinator'), false),
    coalesce(bool_or(ur.role_code = 'case_manager'), false),
    coalesce(bool_or(ur.role_code = 'administrator'), false)
  into v_has_intake, v_has_case_manager, v_has_administrator
  from public.user_roles ur
  where ur.user_id = v_actor and ur.revoked_at is null
    and v_roles ? ur.role_code
    and ur.role_code in ('intake_coordinator','case_manager','administrator');

  if not (v_has_intake or v_has_case_manager or v_has_administrator) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  if p_service_request_id is null
     or p_reason is null or char_length(pg_catalog.btrim(p_reason)) not between 5 and 1000
     or p_request_id is null or char_length(p_request_id) not between 1 and 128
     or (p_new_status is null and p_assigned_to is null) then
    raise exception 'INVALID_SERVICE_REQUEST_UPDATE';
  end if;

  if p_assigned_to is not null then
    if not (v_has_intake or v_has_administrator) then
      raise exception 'FORBIDDEN_SERVICE_REQUEST_ASSIGNMENT';
    end if;
    if not exists (
      select 1 from public.user_roles ur
      where ur.user_id = p_assigned_to and ur.revoked_at is null
        and ur.role_code in ('intake_coordinator','case_manager','administrator')
    ) then raise exception 'INVALID_ASSIGNEE'; end if;
  end if;

  select sr.status, sr.assigned_to
    into v_current_status, v_current_assignee
  from public.service_requests sr
  where sr.id = p_service_request_id
  for update;
  if not found then raise exception 'SERVICE_REQUEST_NOT_FOUND'; end if;

  v_next_status := coalesce(p_new_status, v_current_status);
  if v_next_status not in ('new','triaged','assigned','in_progress','waiting_on_client','resolved','closed','spam') then
    raise exception 'INVALID_SERVICE_REQUEST_STATUS';
  end if;

  if v_next_status <> v_current_status then
    v_allowed_transition :=
      (v_has_intake and (
        (v_current_status = 'new' and v_next_status in ('triaged','spam','closed'))
        or (v_current_status = 'triaged' and v_next_status in ('assigned','waiting_on_client','spam','closed'))
        or (v_current_status = 'assigned' and v_next_status = 'closed')
        or (v_current_status = 'waiting_on_client' and v_next_status = 'closed')
      ))
      or
      (v_has_case_manager and v_current_assignee = v_actor and (
        (v_current_status = 'assigned' and v_next_status in ('in_progress','waiting_on_client','closed'))
        or (v_current_status = 'in_progress' and v_next_status in ('waiting_on_client','resolved'))
        or (v_current_status = 'waiting_on_client' and v_next_status in ('in_progress','resolved','closed'))
        or (v_current_status = 'resolved' and v_next_status = 'closed')
      ));

    if not v_allowed_transition then
      raise exception 'FORBIDDEN_SERVICE_REQUEST_TRANSITION';
    end if;
  end if;

  update public.service_requests
  set status = v_next_status,
      assigned_to = coalesce(p_assigned_to, assigned_to),
      updated_at = pg_catalog.now()
  where id = p_service_request_id;

  insert into public.service_request_status_events (
    service_request_id, from_status, to_status, assigned_to,
    actor_user_id, reason, request_id
  ) values (
    p_service_request_id, v_current_status, v_next_status,
    coalesce(p_assigned_to,v_current_assignee), v_actor,
    pg_catalog.btrim(p_reason), p_request_id
  );

  insert into public.audit_events (
    actor_user_id, action, resource_type, resource_id, before_summary, after_summary, request_id
  ) values (
    v_actor, 'service_request.updated', 'service_request', p_service_request_id,
    pg_catalog.jsonb_build_object('status',v_current_status,'assigned_to',v_current_assignee),
    pg_catalog.jsonb_build_object('status',v_next_status,
      'assigned_to',coalesce(p_assigned_to,v_current_assignee),'reason',pg_catalog.btrim(p_reason)),
    p_request_id
  );
end;
$$;

revoke all on function public.manage_service_request(uuid,text,uuid,text,text) from public, anon;
grant execute on function public.manage_service_request(uuid,text,uuid,text,text) to authenticated;

revoke all on function private.manage_service_request(uuid,text,uuid,text,text)
  from public, anon;
grant execute on function private.manage_service_request(uuid,text,uuid,text,text)
  to authenticated;

-- Exposed PostgREST endpoint is SECURITY INVOKER; privileged implementation
-- stays in the non-exposed private schema and checks the authenticated actor.
create or replace function public.manage_service_request(
  p_service_request_id uuid,
  p_new_status text,
  p_assigned_to uuid,
  p_reason text,
  p_request_id text
)
returns void
language sql
security invoker
set search_path = ''
as $$
  select private.manage_service_request(
    p_service_request_id, p_new_status, p_assigned_to, p_reason, p_request_id
  );
$$;

revoke all on function public.manage_service_request(uuid,text,uuid,text,text)
  from public, anon;
grant execute on function public.manage_service_request(uuid,text,uuid,text,text)
  to authenticated;


drop policy if exists service_requests_deny_client_access on public.service_requests;


-- Require a current, non-revoked database role as well as trusted JWT claims
-- for staff reads. This prevents stale role claims from retaining queue access.
drop policy if exists service_requests_select_own_or_staff
  on public.service_requests;
create policy service_requests_select_own_or_staff
  on public.service_requests for select to authenticated
  using (
    requester_user_id = (select auth.uid())
    or exists (
      select 1
      from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.revoked_at is null
        and ((select auth.jwt()) -> 'app_metadata' -> 'roles') ? ur.role_code
        and (
          ur.role_code in ('intake_coordinator','administrator')
          or (ur.role_code = 'case_manager' and assigned_to = (select auth.uid()))
        )
    )
  );

drop policy if exists service_request_status_events_read_own_or_staff
  on public.service_request_status_events;
create policy service_request_status_events_read_own_or_staff
  on public.service_request_status_events for select to authenticated
  using (
    exists (
      select 1
      from public.service_requests sr
      where sr.id = service_request_id
        and (
          sr.requester_user_id = (select auth.uid())
          or exists (
            select 1
            from public.user_roles ur
            where ur.user_id = (select auth.uid())
              and ur.revoked_at is null
              and ((select auth.jwt()) -> 'app_metadata' -> 'roles') ? ur.role_code
              and (
                ur.role_code in ('intake_coordinator','administrator')
                or (ur.role_code = 'case_manager' and sr.assigned_to = (select auth.uid()))
              )
          )
        )
    )
  );


create or replace function private.list_service_request_assignees()
returns table(user_id uuid, display_name text, role_code text)
language plpgsql
security definer
set search_path = ''
as $fn$
declare
  v_actor uuid := auth.uid();
  v_roles jsonb := coalesce((select auth.jwt()) -> 'app_metadata' -> 'roles', '[]'::jsonb);
begin
  if v_actor is null or not exists (
    select 1 from public.user_roles ur
    where ur.user_id = v_actor
      and ur.revoked_at is null
      and ur.role_code in ('intake_coordinator','administrator')
      and v_roles ? ur.role_code
  ) then
    raise exception 'NOT_AUTHORIZED';
  end if;

  return query
  select distinct ur.user_id,
    coalesce(nullif(pg_catalog.btrim(p.display_name), ''), 'Staff member') as display_name,
    ur.role_code
  from public.user_roles ur
  left join public.profiles p on p.id = ur.user_id
  where ur.revoked_at is null
    and ur.role_code in ('intake_coordinator','case_manager','administrator')
  order by display_name, ur.role_code;
end;
$fn$;

revoke all on function private.list_service_request_assignees() from public, anon;
grant execute on function private.list_service_request_assignees() to authenticated;

create or replace function public.list_service_request_assignees()
returns table(user_id uuid, display_name text, role_code text)
language sql
security invoker
set search_path = ''
as $
  select * from private.list_service_request_assignees();
$;

revoke all on function public.list_service_request_assignees() from public, anon;
grant execute on function public.list_service_request_assignees() to authenticated;

commit;
