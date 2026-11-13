-- Prevent a listing owner from moderating their own uploaded media.
begin;

create or replace function public.review_listing_media(
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
  if p_decision is null or p_decision not in ('approved','rejected')
     or p_reason is null
     or pg_catalog.char_length(pg_catalog.btrim(p_reason)) < 5
     or pg_catalog.char_length(p_reason) > 1000
     or p_reason ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'INVALID_LISTING_MEDIA_REVIEW';
  end if;

  select * into v_media
  from public.listing_media
  where id = p_media_id
    and moderation_status = 'pending'
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'LISTING_MEDIA_NOT_FOUND_OR_ALREADY_REVIEWED';
  end if;
  if v_media.owner_user_id = auth.uid() then
    raise exception using errcode = '42501', message = 'MEDIA_OWNER_CANNOT_REVIEW_OWN_UPLOAD';
  end if;

  update public.listing_media
  set moderation_status = p_decision,
      reviewed_by = auth.uid(),
      reviewed_at = pg_catalog.now(),
      review_reason = pg_catalog.btrim(p_reason)
  where id = p_media_id
  returning * into v_media;

  insert into public.audit_events(actor_user_id, action, resource_type, resource_id, after_summary)
  values (
    auth.uid(),
    'listing_media.reviewed',
    'listing_media',
    v_media.id,
    pg_catalog.jsonb_build_object(
      'listing_id', v_media.listing_id,
      'moderation_status', v_media.moderation_status,
      'reason', v_media.review_reason
    )
  );

  return pg_catalog.jsonb_build_object(
    'media_id', v_media.id,
    'listing_id', v_media.listing_id,
    'moderation_status', v_media.moderation_status,
    'reviewed_at', v_media.reviewed_at
  );
end;
$$;

revoke all on function public.review_listing_media(uuid,text,text)
  from public, anon, service_role;
grant execute on function public.review_listing_media(uuid,text,text)
  to authenticated;

commit;
