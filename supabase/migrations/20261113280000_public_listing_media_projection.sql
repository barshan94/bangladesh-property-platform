-- Public projection for property images: expose UUIDs only, never Storage keys or private metadata.
-- Actual bytes continue to be served from the private quarantine bucket by a server route.
begin;

create or replace function public.list_public_listing_media(p_public_references text[])
returns table(public_reference text, media_id uuid)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if p_public_references is null
     or pg_catalog.cardinality(p_public_references) > 100
     or exists (
       select 1
       from pg_catalog.unnest(p_public_references) as supplied(reference)
       where supplied.reference is null
          or pg_catalog.char_length(supplied.reference) < 1
          or pg_catalog.char_length(supplied.reference) > 64
     ) then
    raise exception using errcode = '22023', message = 'INVALID_PUBLIC_LISTING_MEDIA_REFERENCES';
  end if;

  return query
    with ranked as (
      select l.public_reference, lm.id as media_id,
             pg_catalog.row_number() over (
               partition by l.id order by lm.published_at desc, lm.created_at asc, lm.id
             ) as position
      from public.property_listings l
      join public.listing_media lm on lm.listing_id = l.id
      where l.status = 'published'
        and l.public_reference = any(p_public_references)
        and lm.moderation_status = 'approved'
        and lm.publication_status = 'published'
    )
    select ranked.public_reference, ranked.media_id
    from ranked
    where ranked.position <= 12
    order by ranked.public_reference, ranked.position;
end;
$$;

revoke all on function public.list_public_listing_media(text[]) from public, service_role;
grant execute on function public.list_public_listing_media(text[]) to anon, authenticated;

commit;
