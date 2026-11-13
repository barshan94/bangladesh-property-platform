begin;

-- RLS policies need to verify active staff roles without granting browser
-- clients direct SELECT access to the private authorization table.
create or replace function private.has_active_listing_staff_role(p_role text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select
    auth.uid() is not null
    and p_role in ('listing_reviewer','listing_publisher','administrator')
    and coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ? p_role, false)
    and exists (
      select 1
      from public.user_roles ur
      where ur.user_id = auth.uid()
        and ur.role_code = p_role
        and ur.revoked_at is null
    );
$$;

revoke all on function private.has_active_listing_staff_role(text) from public, anon, authenticated, service_role;
grant usage on schema private to anon, authenticated;
grant execute on function private.has_active_listing_staff_role(text) to anon, authenticated;

drop policy if exists listings_read_published_or_owned_or_staff on public.property_listings;
create policy listings_read_published_or_owned_or_staff
on public.property_listings for select to anon, authenticated
using (
  status = 'published'
  or (select auth.uid()) = owner_user_id
  or private.has_active_listing_staff_role('listing_reviewer')
  or private.has_active_listing_staff_role('listing_publisher')
  or private.has_active_listing_staff_role('administrator')
);

drop policy if exists listings_update_staff on public.property_listings;
create policy listings_update_staff
on public.property_listings for update to authenticated
using (
  private.has_active_listing_staff_role('listing_reviewer')
  or private.has_active_listing_staff_role('listing_publisher')
)
with check (
  private.has_active_listing_staff_role('listing_reviewer')
  or private.has_active_listing_staff_role('listing_publisher')
);

drop policy if exists listing_status_events_read_owner_or_staff on public.listing_status_events;
create policy listing_status_events_read_owner_or_staff
on public.listing_status_events for select to authenticated
using (
  exists (
    select 1 from public.property_listings l
    where l.id = listing_id and l.owner_user_id = (select auth.uid())
  )
  or private.has_active_listing_staff_role('listing_reviewer')
  or private.has_active_listing_staff_role('listing_publisher')
  or private.has_active_listing_staff_role('administrator')
);

commit;
