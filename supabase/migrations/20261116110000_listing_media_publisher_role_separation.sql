-- Tighten image publication to the dedicated publisher role only.
-- Administrators manage platform configuration and role assignments; they do not publish content.
create or replace function public.set_listing_media_publication(
  p_media_id uuid,
  p_decision text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_media public.listing_media%rowtype;
  v_now timestamptz := pg_catalog.now();
  v_reason text;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;
  if not (
    private.has_active_listing_staff_role('listing_publisher')
  ) then
    raise exception using errcode = '42501', message = 'ACTIVE_LISTING_PUBLISHER_REQUIRED';
  end if;
  if p_decision not in ('published','unpublished') or p_decision is null
     or p_reason is null
     or pg_catalog.char_length(pg_catalog.btrim(p_reason)) < 5
     or pg_catalog.char_length(p_reason) > 1000
     or p_reason ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'INVALID_LISTING_MEDIA_PUBLICATION';
  end if;
  v_reason := pg_catalog.btrim(p_reason);

  select lm.* into v_media
  from public.listing_media lm
  where lm.id = p_media_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'LISTING_MEDIA_NOT_FOUND';
  end if;
  if v_media.owner_user_id = auth.uid() then
    raise exception using errcode = '42501', message = 'MEDIA_OWNER_CANNOT_PUBLISH_OWN_UPLOAD';
  end if;
  if v_media.moderation_status <> 'approved' then
    raise exception using errcode = '42501', message = 'ONLY_APPROVED_MEDIA_CAN_BE_PUBLISHED';
  end if;
  if v_media.publication_status = p_decision then
    raise exception using errcode = '22023', message = 'LISTING_MEDIA_ALREADY_IN_REQUESTED_PUBLICATION_STATE';
  end if;

  update public.listing_media
  set publication_status = p_decision,
      published_by = case when p_decision = 'published' then auth.uid() else null end,
      published_at = case when p_decision = 'published' then v_now else null end,
      publication_reason = case when p_decision = 'published' then v_reason else null end
  where id = p_media_id
  returning * into v_media;

  insert into public.audit_events(actor_user_id, action, resource_type, resource_id, after_summary)
  values (
    auth.uid(),
    case when p_decision = 'published' then 'listing_media.published' else 'listing_media.unpublished' end,
    'listing_media',
    v_media.id,
    pg_catalog.jsonb_build_object(
      'listing_id', v_media.listing_id,
      'publication_status', v_media.publication_status,
      'reason', v_reason
    )
  );

  return pg_catalog.jsonb_build_object(
    'media_id', v_media.id,
    'listing_id', v_media.listing_id,
    'publication_status', v_media.publication_status,
    'published_at', v_media.published_at
  );
end;
$$;

create or replace function public.list_approved_listing_media_for_publication()
returns table(
  media_id uuid,
  listing_id uuid,
  public_reference text,
  headline text,
  original_filename text,
  size_bytes bigint,
  approved_at timestamptz,
  publication_status text,
  published_at timestamptz
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
    private.has_active_listing_staff_role('listing_publisher')
  ) then
    raise exception using errcode = '42501', message = 'ACTIVE_LISTING_PUBLISHER_REQUIRED';
  end if;

  return query
    select lm.id, lm.listing_id, l.public_reference, l.headline,
           lm.original_filename, lm.size_bytes, lm.reviewed_at,
           lm.publication_status, lm.published_at
    from public.listing_media lm
    join public.property_listings l on l.id = lm.listing_id
    where lm.moderation_status = 'approved'
      and lm.owner_user_id <> auth.uid()
    order by lm.reviewed_at asc
    limit 100;
end;
$$;

revoke all on function public.set_listing_media_publication(uuid,text,text) from public, anon, service_role;
grant execute on function public.set_listing_media_publication(uuid,text,text) to authenticated;
revoke all on function public.list_approved_listing_media_for_publication() from public, anon, service_role;
grant execute on function public.list_approved_listing_media_for_publication() to authenticated;
