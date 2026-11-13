-- Make the public content projection SECURITY INVOKER and enforce publication
-- visibility with RLS. Public roles can read only the explicitly approved columns.
begin;

drop policy if exists "published knowledge content is publicly readable" on public.knowledge_content;
create policy "published knowledge content is publicly readable"
on public.knowledge_content
for select
to anon, authenticated
using (status = 'published');

grant select (
  id, slug, content_type, title, summary, body_markdown,
  video_provider, video_id, jurisdiction, author_name, published_at
) on public.knowledge_content to anon, authenticated;

alter view public.published_knowledge_content
set (security_invoker = true);

create or replace view public.published_knowledge_content
with (security_barrier = true, security_invoker = true)
as
select id, slug, content_type, title, summary,
       video_provider, video_id, jurisdiction, author_name, published_at,
       body_markdown
from public.knowledge_content
where status = 'published';

revoke all on public.published_knowledge_content from public;
grant select on public.published_knowledge_content to anon, authenticated;

commit;
