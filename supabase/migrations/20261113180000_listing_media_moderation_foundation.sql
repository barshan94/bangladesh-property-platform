-- Public property media foundation: isolated private quarantine and audited moderation metadata.
-- No browser upload/download policies and no public bucket are created in this migration.
begin;

create table public.listing_media (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  quarantine_storage_key text not null unique
    check (
      char_length(quarantine_storage_key) between 1 and 512
      and left(quarantine_storage_key, 1) <> '/'
      and position('..' in quarantine_storage_key) = 0
    ),
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  detected_mime_type text not null check (detected_mime_type in ('image/jpeg','image/png','image/webp')),
  size_bytes bigint not null check (size_bytes between 1 and 8388608),
  sha256_hex text not null check (sha256_hex ~ '^[a-f0-9]{64}$'),
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending','approved','rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  review_reason text check (review_reason is null or char_length(review_reason) between 5 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_media_review_fields_consistent check (
    (moderation_status = 'pending' and reviewed_by is null and reviewed_at is null and review_reason is null)
    or
    (moderation_status in ('approved','rejected') and reviewed_by is not null and reviewed_at is not null and review_reason is not null)
  )
);

create index listing_media_listing_status_idx
  on public.listing_media(listing_id, moderation_status, created_at desc);
create index listing_media_owner_created_idx
  on public.listing_media(owner_user_id, created_at desc);

alter table public.listing_media enable row level security;
revoke all on public.listing_media from anon, authenticated;
grant usage on schema public to anon, authenticated;

-- Enforce owner/listing relationship and quarantine-only key namespace at the database boundary.
create or replace function private.validate_listing_media_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_owner uuid;
  v_status text;
begin
  select l.owner_user_id, l.status into v_owner, v_status
  from public.property_listings l
  where l.id = new.listing_id;

  if not found or v_owner is distinct from new.owner_user_id then
    raise exception using errcode = '42501', message = 'LISTING_MEDIA_OWNER_MISMATCH';
  end if;
  if v_status not in ('draft','changes_requested') then
    raise exception using errcode = '42501', message = 'LISTING_NOT_EDITABLE_FOR_MEDIA_UPLOAD';
  end if;
  if new.quarantine_storage_key not like new.owner_user_id::text || '/' || new.listing_id::text || '/%' then
    raise exception using errcode = '22023', message = 'INVALID_LISTING_MEDIA_STORAGE_KEY';
  end if;
  return new;
end;
$$;
revoke all on function private.validate_listing_media_insert() from public, anon, authenticated, service_role;

create trigger listing_media_validate_insert
before insert on public.listing_media
for each row execute function private.validate_listing_media_insert();

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
  if old.moderation_status <> 'pending' then
    raise exception using errcode = '42501', message = 'LISTING_MEDIA_REVIEW_IS_FINAL';
  end if;
  new.updated_at := pg_catalog.now();
  return new;
end;
$$;
revoke all on function private.prevent_listing_media_mutation() from public, anon, authenticated, service_role;

create trigger listing_media_prevent_mutation
before update on public.listing_media
for each row execute function private.prevent_listing_media_mutation();

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

  update public.listing_media
  set moderation_status = p_decision,
      reviewed_by = auth.uid(),
      reviewed_at = pg_catalog.now(),
      review_reason = pg_catalog.btrim(p_reason)
  where id = p_media_id
    and moderation_status = 'pending'
  returning * into v_media;

  if not found then
    raise exception using errcode = 'P0002', message = 'LISTING_MEDIA_NOT_FOUND_OR_ALREADY_REVIEWED';
  end if;

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
revoke all on function public.review_listing_media(uuid,text,text) from public, anon, service_role;
grant execute on function public.review_listing_media(uuid,text,text) to authenticated;

-- Private quarantine only. Public promotion is deliberately a separate future release gate.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'listing-media-quarantine',
  'listing-media-quarantine',
  false,
  8388608,
  array['image/jpeg','image/png','image/webp']
)
on conflict (id) do nothing;

commit;
