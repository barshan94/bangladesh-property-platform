-- Public property map pins use deliberately coarse coordinates only.
-- Exact coordinates remain in listing_private_details and are never selected by public clients.
begin;

create or replace function public.list_public_property_map_points(p_public_references text[])
returns table(public_reference text, latitude numeric, longitude numeric)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select l.public_reference,
         round(d.latitude, 2) as latitude,
         round(d.longitude, 2) as longitude
  from public.property_listings l
  join public.listing_private_details d on d.listing_id = l.id
  where l.status = 'published'
    and l.public_reference = any(coalesce(p_public_references, array[]::text[]))
    and d.latitude is not null
    and d.longitude is not null;
$$;

revoke all on function public.list_public_property_map_points(text[]) from public, anon, authenticated;
grant execute on function public.list_public_property_map_points(text[]) to anon, authenticated;

comment on function public.list_public_property_map_points(text[]) is
  'Returns only two-decimal approximate map coordinates for published listings; exact coordinates remain private.';

commit;
