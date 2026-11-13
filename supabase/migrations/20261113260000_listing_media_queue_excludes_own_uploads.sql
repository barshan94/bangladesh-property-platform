-- Do not expose a reviewer's own pending upload in their moderation queue.
begin;

create or replace function public.list_pending_listing_media_for_review()
returns table(
  media_id uuid,
  listing_id uuid,
  public_reference text,
  headline text,
  original_filename text,
  size_bytes bigint,
  sha256_hex text,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if not (
    private.has_active_listing_staff_role('listing_reviewer')
    or private.has_active_listing_staff_role('administrator')
  ) then
    raise exception using errcode = '42501', message = 'ACTIVE_LISTING_REVIEWER_REQUIRED';
  end if;

  return query
    select lm.id, lm.listing_id, l.public_reference, l.headline,
           lm.original_filename, lm.size_bytes, lm.sha256_hex, lm.created_at
    from public.listing_media lm
    join public.property_listings l on l.id = lm.listing_id
    where lm.moderation_status = 'pending'
      and lm.owner_user_id <> auth.uid()
    order by lm.created_at asc
    limit 100;
end;
$$;

revoke all on function public.list_pending_listing_media_for_review()
  from public, anon, service_role;
grant execute on function public.list_pending_listing_media_for_review()
  to authenticated;

commit;
