-- Explicit publisher-controlled media publication, separate from moderation.
-- Private quarantine remains private; this migration does not expose image bytes.
begin;

alter table public.listing_media
  add column publication_status text not null default 'unpublished'
    check (publication_status in ('unpublished','published')),
  add column published_by uuid references auth.users(id) on delete set null,
  add column published_at timestamptz,
  add column publication_reason text
    check (publication_reason is null or char_length(publication_reason) between 5 and 1000);

alter table public.listing_media
  add constraint listing_media_publication_fields_consistent check (
    (publication_status = 'unpublished' and published_by is null and published_at is null and publication_reason is null)
    or
    (publication_status = 'published' and published_by is not null and published_at is not null and publication_reason is not null)
  );

create index listing_media_publication_lookup_idx
  on public.listing_media(listing_id, publication_status, created_at desc)
  where moderation_status = 'approved';

-- Replace the review-final trigger so an approved media row can change only
-- its explicit publication decision. Source bytes and moderation evidence
-- remain immutable; moderation itself remains final.
create or replace function private.prevent_listing_media_mutation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.id is distinct from old.id
     or new.listing_id is distinct from old.listing_id
     or new.owner_user_id is distinct from old.owner_user_id
     or new.quarantine_storage_key is distinct from old.quarantine_storage_key
     or new.original_filename is distinct from old.original_filename
     or new.detected_mime_type is distinct from old.detected_mime_type
     or new.size_bytes is distinct from old.size_bytes
     or new.sha256_hex is distinct from old.sha256_hex
     or new.created_at is distinct from old.created_at then
    raise exception using errcode = '42501', message = 'LISTING_MEDIA_SOURCE_FIELDS_IMMUTABLE';
  end if;

  if old.moderation_status = 'pending' then
    -- The existing reviewer RPC may perform exactly one final review decision.
    if new.publication_status is distinct from old.publication_status
       or new.published_by is distinct from old.published_by
       or new.published_at is distinct from old.published_at
       or new.publication_reason is distinct from old.publication_reason then
      raise exception using errcode = '42501', message = 'LISTING_MEDIA_CANNOT_PUBLISH_BEFORE_REVIEW';
    end if;
  else
    if new.moderation_status is distinct from old.moderation_status
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at
       or new.review_reason is distinct from old.review_reason then
      raise exception using errcode = '42501', message = 'LISTING_MEDIA_REVIEW_IS_FINAL';
    end if;
    if old.moderation_status <> 'approved' then
      raise exception using errcode = '42501', message = 'ONLY_APPROVED_MEDIA_CAN_CHANGE_PUBLICATION';
    end if;
    if new.publication_status is not distinct from old.publication_status then
      raise exception using errcode = '42501', message = 'LISTING_MEDIA_PUBLICATION_TRANSITION_REQUIRED';
    end if;
    if new.publication_status = 'published' then
      if old.publication_status <> 'unpublished'
         or new.published_by is null
         or new.published_at is null
         or new.publication_reason is null
         or char_length(btrim(new.publication_reason)) < 5
         or char_length(new.publication_reason) > 1000 then
        raise exception using errcode = '22023', message = 'INVALID_LISTING_MEDIA_PUBLICATION';
      end if;
    elsif new.publication_status = 'unpublished' then
      if old.publication_status <> 'published'
         or new.published_by is not null
         or new.published_at is not null
         or new.publication_reason is not null then
        raise exception using errcode = '22023', message = 'INVALID_LISTING_MEDIA_UNPUBLICATION';
      end if;
    end if;
  end if;

  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
revoke all on function private.prevent_listing_media_mutation() from public, anon, authenticated, service_role;

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
    or private.has_active_listing_staff_role('administrator')
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
revoke all on function public.set_listing_media_publication(uuid,text,text) from public, anon, service_role;
grant execute on function public.set_listing_media_publication(uuid,text,text) to authenticated;

-- A publisher sees approved media belonging to other users only. Storage keys,
-- hashes, reviewer identities and internal metadata are intentionally omitted.
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
    or private.has_active_listing_staff_role('administrator')
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
revoke all on function public.list_approved_listing_media_for_publication()
  from public, anon, service_role;
grant execute on function public.list_approved_listing_media_for_publication()
  to authenticated;

commit;
