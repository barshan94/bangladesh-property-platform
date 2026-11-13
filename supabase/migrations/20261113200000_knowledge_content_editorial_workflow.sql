-- Editorial content foundation: articles and videos remain unpublished until reviewed.
-- No editor UI, renderer, or content is exposed by this migration.
begin;

create table public.knowledge_content (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' and char_length(slug) between 3 and 160),
  content_type text not null check (content_type in ('article','video')),
  title text not null check (char_length(btrim(title)) between 8 and 180),
  summary text not null check (char_length(btrim(summary)) between 20 and 500),
  body_markdown text,
  video_provider text,
  video_id text,
  jurisdiction text not null default 'Bangladesh' check (char_length(btrim(jurisdiction)) between 2 and 100),
  author_name text check (author_name is null or char_length(btrim(author_name)) between 2 and 120),
  source_notes text check (source_notes is null or char_length(source_notes) <= 4000),
  status text not null default 'draft'
    check (status in ('draft','in_review','approved','published','rejected','archived')),
  author_user_id uuid not null references auth.users(id) on delete restrict,
  reviewer_user_id uuid references auth.users(id) on delete restrict,
  reviewed_at timestamptz,
  review_note text check (review_note is null or char_length(review_note) between 5 and 1000),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint knowledge_content_payload_consistent check (
    (content_type = 'article' and body_markdown is not null
      and char_length(btrim(body_markdown)) between 100 and 30000
      and video_provider is null and video_id is null)
    or
    (content_type = 'video' and body_markdown is null
      and video_provider in ('youtube','vimeo')
      and video_id ~ '^[A-Za-z0-9_-]{6,32}$')
  ),
  constraint knowledge_content_review_consistent check (
    (status in ('draft','in_review') and reviewer_user_id is null and reviewed_at is null and review_note is null and published_at is null)
    or
    (status in ('approved','published','rejected','archived') and reviewer_user_id is not null and reviewed_at is not null and review_note is not null)
  ),
  constraint knowledge_content_publication_consistent check (
    (status = 'published' and published_at is not null)
    or (status <> 'published' and published_at is null)
  )
);

create index knowledge_content_publication_idx
  on public.knowledge_content(status, content_type, published_at desc)
  where status = 'published';
create index knowledge_content_author_idx
  on public.knowledge_content(author_user_id, updated_at desc);

alter table public.knowledge_content enable row level security;
revoke all on public.knowledge_content from public, anon, authenticated;
grant all on public.knowledge_content to service_role;

-- Expose only fields intended for public reading. Review notes, source notes,
-- reviewer identity and internal author ownership never enter the browser API.
create view public.published_knowledge_content
with (security_barrier = true)
as
select id, slug, content_type, title, summary,
       video_provider, video_id, jurisdiction, author_name, published_at
from public.knowledge_content
where status = 'published';

revoke all on public.published_knowledge_content from public;
grant select on public.published_knowledge_content to anon, authenticated;

create or replace function public.transition_knowledge_content(
  p_content_id uuid,
  p_to_status text,
  p_reason text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_content public.knowledge_content%rowtype;
  v_is_editor boolean;
  v_is_admin boolean;
begin
  if auth.uid() is null then
    raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
  end if;

  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role_code = 'content_editor'
      and ur.revoked_at is null
      and coalesce((auth.jwt() -> 'app_metadata' -> 'roles') ? 'content_editor', false)
  ) into v_is_editor;

  v_is_admin := private.has_active_listing_staff_role('administrator');

  if not (v_is_editor or v_is_admin) then
    raise exception using errcode = '42501', message = 'ACTIVE_CONTENT_EDITOR_OR_ADMIN_REQUIRED';
  end if;

  if p_reason is null or char_length(btrim(p_reason)) < 5
     or char_length(p_reason) > 1000 or p_reason ~ '[[:cntrl:]]' then
    raise exception using errcode = '22023', message = 'CONTENT_TRANSITION_REASON_REQUIRED';
  end if;

  select * into v_content
  from public.knowledge_content
  where id = p_content_id
  for update;

  if not found then
    raise exception using errcode = 'P0002', message = 'KNOWLEDGE_CONTENT_NOT_FOUND';
  end if;

  if p_to_status = 'in_review' then
    if v_content.status <> 'draft' or not (v_is_editor or v_is_admin) then
      raise exception using errcode = '42501', message = 'INVALID_CONTENT_SUBMISSION';
    end if;
    update public.knowledge_content
    set status = 'in_review', updated_at = now()
    where id = p_content_id;
  elsif p_to_status in ('approved','rejected') then
    if not v_is_admin or v_content.status <> 'in_review' then
      raise exception using errcode = '42501', message = 'ADMIN_REVIEW_REQUIRED';
    end if;
    if v_content.author_user_id = auth.uid() then
      raise exception using errcode = '42501', message = 'CONTENT_AUTHOR_CANNOT_REVIEW_OWN_WORK';
    end if;
    update public.knowledge_content
    set status = p_to_status, reviewer_user_id = auth.uid(),
        reviewed_at = now(), review_note = btrim(p_reason), updated_at = now()
    where id = p_content_id;
  elsif p_to_status = 'published' then
    if not v_is_admin or v_content.status <> 'approved' then
      raise exception using errcode = '42501', message = 'APPROVED_CONTENT_REQUIRED_FOR_PUBLICATION';
    end if;
    update public.knowledge_content
    set status = 'published', published_at = now(), updated_at = now()
    where id = p_content_id;
  elsif p_to_status = 'archived' then
    if not v_is_admin or v_content.status <> 'published' then
      raise exception using errcode = '42501', message = 'ONLY_PUBLISHED_CONTENT_CAN_BE_ARCHIVED';
    end if;
    update public.knowledge_content
    set status = 'archived', published_at = null, updated_at = now()
    where id = p_content_id;
  else
    raise exception using errcode = '22023', message = 'UNSUPPORTED_CONTENT_TRANSITION';
  end if;

  insert into public.audit_events(actor_user_id, action, resource_type, resource_id, after_summary)
  values (
    auth.uid(), 'knowledge_content.status_changed', 'knowledge_content', p_content_id,
    jsonb_build_object('from_status', v_content.status, 'to_status', p_to_status, 'reason', btrim(p_reason))
  );

  return jsonb_build_object('content_id', p_content_id, 'status', p_to_status);
end;
$$;

revoke all on function public.transition_knowledge_content(uuid,text,text) from public, anon, service_role;
grant execute on function public.transition_knowledge_content(uuid,text,text) to authenticated;

commit;
