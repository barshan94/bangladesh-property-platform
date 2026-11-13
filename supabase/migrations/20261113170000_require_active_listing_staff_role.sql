begin;

-- A staff JWT is not sufficient after a role has been revoked. Require both
-- the trusted app_metadata claim and a current, non-revoked user_roles row.
create or replace function private.enforce_listing_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_roles jsonb := coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb);
  v_actor_role text;
  v_reason text;
  v_request_id text;
  v_now timestamptz := pg_catalog.now();
begin
  if new.id is distinct from old.id
     or new.owner_user_id is distinct from old.owner_user_id
     or new.public_reference is distinct from old.public_reference
     or new.currency_code is distinct from old.currency_code
     or new.created_at is distinct from old.created_at
     or new.expires_at is distinct from old.expires_at then
    raise exception using errcode = '42501', message = 'LISTING_SYSTEM_FIELDS_ARE_IMMUTABLE';
  end if;

  if new.status is distinct from old.status then
    if (new.listing_kind, new.property_type, new.headline, new.description, new.division,
        new.district, new.upazila, new.locality, new.public_location_label, new.price_amount,
        new.area_value, new.area_unit, new.area_basis, new.bedrooms, new.bathrooms,
        new.occupancy_status) is distinct from
       (old.listing_kind, old.property_type, old.headline, old.description, old.division,
        old.district, old.upazila, old.locality, old.public_location_label, old.price_amount,
        old.area_value, old.area_unit, old.area_basis, old.bedrooms, old.bathrooms,
        old.occupancy_status) then
      raise exception using errcode = '22023', message = 'EDIT_CONTENT_SEPARATELY_FROM_STATUS_TRANSITION';
    end if;

    if v_actor is null then
      raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
    elsif v_actor = old.owner_user_id then
      v_actor_role := 'seller';
      if not ((old.status = 'draft' and new.status = 'submitted')
           or (old.status = 'changes_requested' and new.status in ('submitted','withdrawn'))) then
        raise exception using errcode = '42501', message = 'SELLER_TRANSITION_NOT_ALLOWED';
      end if;
    elsif v_roles ? 'listing_reviewer'
      and exists (
        select 1 from public.user_roles ur
        where ur.user_id = v_actor and ur.role_code = 'listing_reviewer' and ur.revoked_at is null
      )
      and ((old.status = 'submitted' and new.status = 'under_review')
        or (old.status = 'under_review' and new.status in ('changes_requested','approved','rejected'))) then
      v_actor_role := 'listing_reviewer';
    elsif v_roles ? 'listing_publisher'
      and exists (
        select 1 from public.user_roles ur
        where ur.user_id = v_actor and ur.role_code = 'listing_publisher' and ur.revoked_at is null
      )
      and ((old.status = 'approved' and new.status in ('published','withdrawn','expired'))
        or (old.status = 'published' and new.status in ('withdrawn','expired','archived'))) then
      v_actor_role := 'listing_publisher';
    else
      raise exception using errcode = '42501', message = 'ROLE_TRANSITION_NOT_ALLOWED';
    end if;

    v_reason := nullif(pg_catalog.current_setting('app.listing_transition_reason', true), '');
    v_request_id := nullif(pg_catalog.current_setting('app.listing_transition_request_id', true), '');
    if v_actor_role = 'listing_reviewer'
       and old.status = 'under_review'
       and new.status in ('changes_requested','approved','rejected')
       and (v_reason is null or pg_catalog.char_length(v_reason) > 2000
            or v_reason ~ '[[:cntrl:]]') then
      raise exception using errcode = '22023', message = 'REVIEW_DECISION_REASON_REQUIRED';
    end if;
    if v_reason is not null and (pg_catalog.char_length(v_reason) > 2000 or v_reason ~ '[[:cntrl:]]') then
      raise exception using errcode = '22023', message = 'INVALID_TRANSITION_REASON';
    end if;
    if v_request_id is not null and pg_catalog.char_length(v_request_id) > 128 then
      raise exception using errcode = '22023', message = 'INVALID_TRANSITION_REQUEST_ID';
    end if;

    new.submitted_at := case when new.status = 'submitted' then v_now else old.submitted_at end;
    new.published_at := case when new.status = 'published' then v_now else old.published_at end;
    new.updated_at := v_now;

    insert into public.listing_status_events
      (listing_id, actor_user_id, from_status, to_status, reason_code, reason, request_id)
    values
      (old.id, v_actor, old.status, new.status, v_actor_role || '_' || new.status, v_reason, v_request_id);

    insert into public.audit_events
      (actor_user_id, action, resource_type, resource_id, before_summary, after_summary, request_id)
    values
      (v_actor, 'listing.status_changed', 'property_listing', old.id,
       pg_catalog.jsonb_build_object('status', old.status),
       pg_catalog.jsonb_build_object('status', new.status, 'public_reference', old.public_reference),
       v_request_id);
  else
    if v_actor is distinct from old.owner_user_id
       or old.status not in ('draft','changes_requested')
       or new.submitted_at is distinct from old.submitted_at
       or new.published_at is distinct from old.published_at then
      raise exception using errcode = '42501', message = 'LISTING_CONTENT_UPDATE_NOT_ALLOWED';
    end if;
    new.updated_at := v_now;
  end if;

  return new;
end;
$$;

drop policy if exists listings_read_published_or_owned_or_staff on public.property_listings;
create policy listings_read_published_or_owned_or_staff
on public.property_listings for select to anon, authenticated
using (
  status = 'published'
  or (select auth.uid()) = owner_user_id
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.revoked_at is null
      and ur.role_code in ('listing_reviewer','listing_publisher','administrator')
      and ((select auth.jwt()) -> 'app_metadata' -> 'roles') ? ur.role_code
  )
);

drop policy if exists listings_update_staff on public.property_listings;
create policy listings_update_staff
on public.property_listings for update to authenticated
using (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.revoked_at is null
      and ur.role_code in ('listing_reviewer','listing_publisher')
      and ((select auth.jwt()) -> 'app_metadata' -> 'roles') ? ur.role_code
  )
)
with check (
  exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.revoked_at is null
      and ur.role_code in ('listing_reviewer','listing_publisher')
      and ((select auth.jwt()) -> 'app_metadata' -> 'roles') ? ur.role_code
  )
);

drop policy if exists listing_status_events_read_owner_or_staff on public.listing_status_events;
create policy listing_status_events_read_owner_or_staff
on public.listing_status_events for select to authenticated
using (
  exists (
    select 1 from public.property_listings l
    where l.id = listing_id and l.owner_user_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.user_roles ur
    where ur.user_id = (select auth.uid())
      and ur.revoked_at is null
      and ur.role_code in ('listing_reviewer','listing_publisher','administrator')
      and ((select auth.jwt()) -> 'app_metadata' -> 'roles') ? ur.role_code
  )
);

commit;
