begin;

-- Cover the six foreign keys identified by the live Supabase Performance Advisor.
-- These indexes improve parent-row delete/update checks and common actor/inquiry lookups.
create index if not exists inquiry_staff_notes_actor_user_id_idx
  on public.inquiry_staff_notes (actor_user_id);
create index if not exists inquiry_staff_notes_inquiry_id_idx
  on public.inquiry_staff_notes (inquiry_id);
create index if not exists knowledge_content_reviewer_user_id_idx
  on public.knowledge_content (reviewer_user_id);
create index if not exists listing_media_published_by_idx
  on public.listing_media (published_by);
create index if not exists listing_media_reviewed_by_idx
  on public.listing_media (reviewed_by);
create index if not exists service_pages_updated_by_idx
  on public.service_pages (updated_by);

-- The previous permissive UPDATE policies are OR-combined by PostgreSQL.
-- Consolidate their exact predicates into one policy without changing the
-- owner/staff access boundary, reducing repeated policy evaluation.
drop policy if exists listings_update_own_unpublished on public.property_listings;
drop policy if exists listings_update_staff on public.property_listings;

create policy listings_update_owner_or_staff
  on public.property_listings
  for update
  to authenticated
  using (
    (
      (select auth.uid()) = owner_user_id
      and status in ('draft', 'changes_requested')
    )
    or private.has_active_listing_staff_role('listing_reviewer')
    or private.has_active_listing_staff_role('listing_publisher')
  )
  with check (
    (
      (select auth.uid()) = owner_user_id
      and status in ('draft', 'submitted', 'changes_requested', 'withdrawn')
    )
    or private.has_active_listing_staff_role('listing_reviewer')
    or private.has_active_listing_staff_role('listing_publisher')
  );

commit;
