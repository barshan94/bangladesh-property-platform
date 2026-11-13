-- Secure editor-side CMS access without granting browser table access.
begin;

create or replace function public.list_knowledge_content_for_editor()
returns setof public.knowledge_content
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
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

  return query
    select kc.*
    from public.knowledge_content kc
    where v_is_admin or kc.author_user_id = auth.uid()
    order by kc.updated_at desc
    limit 100;
end;
$$;

create or replace function public.save_knowledge_content_draft(
  p_content_id uuid,
  p_slug text,
  p_content_type text,
  p_title text,
  p_summary text,
  p_body_markdown text,
  p_video_provider text,
  p_video_id text,
  p_jurisdiction text,
  p_author_name text,
  p_source_notes text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_is_editor boolean;
  v_is_admin boolean;
  v_content public.knowledge_content%rowtype;
  v_id uuid;
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

  if p_slug is null or p_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
     or char_length(p_slug) not between 3 and 160 then
    raise exception using errcode = '22023', message = 'INVALID_CONTENT_SLUG';
  end if;

  if p_content_id is null then
    insert into public.knowledge_content(
      slug, content_type, title, summary, body_markdown,
      video_provider, video_id, jurisdiction, author_name,
      source_notes, author_user_id
    ) values (
      p_slug, p_content_type, p_title, p_summary, p_body_markdown,
      p_video_provider, p_video_id, p_jurisdiction, p_author_name,
      p_source_notes, auth.uid()
    ) returning id into v_id;
  else
    select * into v_content
    from public.knowledge_content
    where id = p_content_id
    for update;

    if not found then
      raise exception using errcode = 'P0002', message = 'KNOWLEDGE_CONTENT_NOT_FOUND';
    end if;
    if v_content.author_user_id <> auth.uid() and not v_is_admin then
      raise exception using errcode = '42501', message = 'CONTENT_AUTHOR_ACCESS_REQUIRED';
    end if;
    if v_content.status not in ('draft','rejected') then
      raise exception using errcode = '42501', message = 'ONLY_DRAFT_OR_REJECTED_CONTENT_CAN_BE_EDITED';
    end if;

    update public.knowledge_content
    set slug = p_slug,
        content_type = p_content_type,
        title = p_title,
        summary = p_summary,
        body_markdown = p_body_markdown,
        video_provider = p_video_provider,
        video_id = p_video_id,
        jurisdiction = p_jurisdiction,
        author_name = p_author_name,
        source_notes = p_source_notes,
        status = 'draft',
        reviewer_user_id = null,
        reviewed_at = null,
        review_note = null,
        published_at = null,
        updated_at = now()
    where id = p_content_id
    returning id into v_id;
  end if;

  insert into public.audit_events(actor_user_id, action, resource_type, resource_id, after_summary)
  values (
    auth.uid(), 'knowledge_content.draft_saved', 'knowledge_content', v_id,
    jsonb_build_object('slug', p_slug, 'content_type', p_content_type)
  );

  return v_id;
end;
$$;

revoke all on function public.list_knowledge_content_for_editor() from public, anon, service_role;
grant execute on function public.list_knowledge_content_for_editor() to authenticated;
revoke all on function public.save_knowledge_content_draft(uuid,text,text,text,text,text,text,text,text,text,text) from public, anon, service_role;
grant execute on function public.save_knowledge_content_draft(uuid,text,text,text,text,text,text,text,text,text,text) to authenticated;

commit;
