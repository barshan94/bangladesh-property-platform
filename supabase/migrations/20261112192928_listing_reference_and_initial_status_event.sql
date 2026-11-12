-- Generate an opaque public reference and append an initial status event atomically.
-- Both functions are private trigger-only functions with no API-role execute grants.
create or replace function private.assign_listing_reference()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  new.public_reference := 'BPP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12));
  return new;
end;
$$;
revoke all on function private.assign_listing_reference() from public, anon, authenticated, service_role;
drop trigger if exists property_listing_assign_reference on public.property_listings;
create trigger property_listing_assign_reference before insert on public.property_listings
for each row execute function private.assign_listing_reference();

create or replace function private.record_listing_initial_status()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.listing_status_events(listing_id, actor_user_id, from_status, to_status, reason_code)
  values(new.id, auth.uid(), null, new.status, 'listing_created');
  return new;
end;
$$;
revoke all on function private.record_listing_initial_status() from public, anon, authenticated, service_role;
drop trigger if exists property_listing_initial_status_event on public.property_listings;
create trigger property_listing_initial_status_event after insert on public.property_listings
for each row execute function private.record_listing_initial_status();
