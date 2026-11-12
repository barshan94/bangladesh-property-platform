-- Bangladesh Property Platform: initial backend foundation
-- Applied to Supabase project xpbjdeknjudurulogjkr (MRA account).
-- All exposed application tables use RLS. Sensitive workflows remain server-only.

begin;

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 120),
  preferred_language text not null default 'en' check (preferred_language in ('en','bn')),
  country_of_residence text check (country_of_residence is null or char_length(country_of_residence) <= 2),
  timezone text check (timezone is null or char_length(timezone) <= 64),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_code text not null check (role_code in (
    'seller','listing_reviewer','listing_publisher','intake_coordinator',
    'case_manager','content_editor','administrator'
  )),
  granted_by uuid references auth.users(id) on delete set null,
  granted_at timestamptz not null default now(),
  revoked_at timestamptz,
  constraint user_roles_valid_revocation check (revoked_at is null or revoked_at >= granted_at)
);
create unique index user_roles_one_active_role
  on public.user_roles(user_id, role_code) where revoked_at is null;
create index user_roles_user_active_idx on public.user_roles(user_id) where revoked_at is null;
create index user_roles_granted_by_idx on public.user_roles(granted_by) where granted_by is not null;

create table public.property_listings (
  id uuid primary key default gen_random_uuid(),
  public_reference text not null unique check (public_reference ~ '^BPP-[A-Z0-9]{6,12}$'),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  listing_kind text not null check (listing_kind in ('sale','rent','lease')),
  property_type text not null check (property_type in ('apartment','house','land','commercial','industrial','other')),
  headline text not null check (char_length(btrim(headline)) between 10 and 180),
  description text not null check (char_length(btrim(description)) between 30 and 12000),
  division text not null check (char_length(btrim(division)) between 2 and 80),
  district text not null check (char_length(btrim(district)) between 2 and 80),
  upazila text check (upazila is null or char_length(upazila) <= 80),
  locality text check (locality is null or char_length(locality) <= 160),
  public_location_label text check (public_location_label is null or char_length(public_location_label) <= 180),
  price_amount numeric(16,2) check (price_amount is null or price_amount >= 0),
  currency_code text not null default 'BDT' check (currency_code = 'BDT'),
  area_value numeric(14,3) check (area_value is null or area_value > 0),
  area_unit text check (area_unit is null or area_unit in ('sqft','sqm','katha','decimal','acre')),
  area_basis text check (area_basis is null or area_basis in ('land','floor','built_up','carpet','gross')),
  bedrooms integer check (bedrooms is null or bedrooms between 0 and 100),
  bathrooms numeric(4,1) check (bathrooms is null or bathrooms between 0 and 100),
  occupancy_status text not null default 'unknown' check (occupancy_status in ('unknown','vacant','occupied','under_construction')),
  status text not null default 'draft' check (status in (
    'draft','submitted','under_review','changes_requested','approved',
    'published','rejected','withdrawn','expired','archived'
  )),
  submitted_at timestamptz,
  published_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_area_fields_together check (
    (area_value is null and area_unit is null and area_basis is null)
    or (area_value is not null and area_unit is not null and area_basis is not null)
  ),
  constraint listing_published_timestamp check (status <> 'published' or published_at is not null)
);
create index property_listings_public_search_idx
  on public.property_listings(status, division, district, property_type, listing_kind, price_amount)
  where status = 'published';
create index property_listings_owner_status_idx
  on public.property_listings(owner_user_id, status, updated_at desc);

create table public.listing_private_details (
  listing_id uuid primary key references public.property_listings(id) on delete restrict,
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  exact_address text check (exact_address is null or char_length(exact_address) <= 1000),
  latitude numeric(9,6) check (latitude is null or latitude between -90 and 90),
  longitude numeric(9,6) check (longitude is null or longitude between -180 and 180),
  access_notes text check (access_notes is null or char_length(access_notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index listing_private_details_owner_idx on public.listing_private_details(owner_user_id);

create table public.listing_status_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.property_listings(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  from_status text check (from_status is null or from_status in (
    'draft','submitted','under_review','changes_requested','approved','published','rejected','withdrawn','expired','archived'
  )),
  to_status text not null check (to_status in (
    'draft','submitted','under_review','changes_requested','approved','published','rejected','withdrawn','expired','archived'
  )),
  reason_code text check (reason_code is null or char_length(reason_code) <= 80),
  reason text check (reason is null or char_length(reason) <= 2000),
  request_id text check (request_id is null or char_length(request_id) <= 128),
  created_at timestamptz not null default now()
);
create index listing_status_events_listing_created_idx on public.listing_status_events(listing_id, created_at desc);
create index listing_status_events_actor_idx on public.listing_status_events(actor_user_id) where actor_user_id is not null;

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.property_listings(id) on delete set null,
  requester_user_id uuid references auth.users(id) on delete set null,
  contact_name text not null check (char_length(btrim(contact_name)) between 2 and 120),
  email_normalized text not null check (char_length(email_normalized) between 3 and 254),
  phone text check (phone is null or char_length(phone) <= 32),
  message text not null check (char_length(btrim(message)) between 10 and 5000),
  consent_version text not null check (char_length(consent_version) between 1 and 40),
  status text not null default 'new' check (status in ('new','triaged','assigned','in_progress','resolved','closed','spam')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inquiries_status_created_idx on public.inquiries(status, created_at desc);
create index inquiries_listing_idx on public.inquiries(listing_id) where listing_id is not null;
create index inquiries_requester_idx on public.inquiries(requester_user_id) where requester_user_id is not null;

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid references auth.users(id) on delete set null,
  service_code text not null check (service_code in (
    'property_verification','title_due_diligence','remote_property_inspection',
    'property_management','buying_assistance','selling_assistance',
    'inheritance_guidance','legal_consultation','other'
  )),
  property_listing_id uuid references public.property_listings(id) on delete set null,
  contact_name text not null check (char_length(btrim(contact_name)) between 2 and 120),
  email_normalized text not null check (char_length(email_normalized) between 3 and 254),
  phone text check (phone is null or char_length(phone) <= 32),
  country_of_residence text check (country_of_residence is null or char_length(country_of_residence) <= 2),
  summary text not null check (char_length(btrim(summary)) between 10 and 5000),
  consent_version text not null check (char_length(consent_version) between 1 and 40),
  status text not null default 'new' check (status in (
    'new','triaged','assigned','in_progress','waiting_on_client','resolved','closed','spam'
  )),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index service_requests_status_created_idx on public.service_requests(status, created_at desc);
create index service_requests_requester_idx on public.service_requests(requester_user_id) where requester_user_id is not null;
create index service_requests_property_listing_idx on public.service_requests(property_listing_id) where property_listing_id is not null;

create table public.private_documents (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete restrict,
  purpose text not null check (purpose in ('listing_evidence','client_case')),
  listing_id uuid references public.property_listings(id) on delete restrict,
  service_request_id uuid references public.service_requests(id) on delete restrict,
  storage_key text not null unique check (char_length(storage_key) between 1 and 512),
  original_filename text not null check (char_length(original_filename) between 1 and 255),
  detected_mime_type text not null check (detected_mime_type in ('application/pdf','image/jpeg','image/png')),
  size_bytes bigint not null check (size_bytes between 1 and 15728640),
  sha256_hex text check (sha256_hex is null or sha256_hex ~ '^[a-f0-9]{64}$'),
  scan_status text not null default 'pending' check (scan_status in ('pending','clean','infected','error')),
  review_status text not null default 'pending' check (review_status in ('pending','accepted','rejected')),
  uploaded_at timestamptz not null default now(),
  retention_until timestamptz,
  deleted_at timestamptz,
  constraint private_document_parent_matches_purpose check (
    (purpose = 'listing_evidence' and listing_id is not null and service_request_id is null)
    or (purpose = 'client_case' and service_request_id is not null and listing_id is null)
  )
);
create index private_documents_owner_idx on public.private_documents(owner_user_id, uploaded_at desc);
create index private_documents_listing_idx on public.private_documents(listing_id) where listing_id is not null;
create index private_documents_service_request_idx on public.private_documents(service_request_id) where service_request_id is not null;

create table public.document_access_events (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.private_documents(id) on delete restrict,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (action in ('upload','preview','download','share_link_created','delete','scan','review')),
  purpose text not null check (char_length(purpose) between 3 and 160),
  request_id text check (request_id is null or char_length(request_id) <= 128),
  created_at timestamptz not null default now()
);
create index document_access_events_document_created_idx on public.document_access_events(document_id, created_at desc);
create index document_access_events_actor_idx on public.document_access_events(actor_user_id) where actor_user_id is not null;

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null check (char_length(action) between 2 and 100),
  resource_type text not null check (char_length(resource_type) between 2 and 80),
  resource_id uuid,
  before_summary jsonb,
  after_summary jsonb,
  request_id text check (request_id is null or char_length(request_id) <= 128),
  created_at timestamptz not null default now()
);
create index audit_events_resource_created_idx on public.audit_events(resource_type, resource_id, created_at desc);
create index audit_events_actor_created_idx on public.audit_events(actor_user_id, created_at desc) where actor_user_id is not null;

create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  consent_type text not null check (char_length(consent_type) between 2 and 80),
  notice_version text not null check (char_length(notice_version) between 1 and 40),
  granted_at timestamptz not null default now(),
  withdrawn_at timestamptz,
  source text not null check (source in ('website_form','account_settings','service_intake','staff_recorded')),
  constraint consent_withdrawal_after_grant check (withdrawn_at is null or withdrawn_at >= granted_at)
);
create index consent_records_user_idx on public.consent_records(user_id, granted_at desc) where user_id is not null;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.property_listings enable row level security;
alter table public.listing_private_details enable row level security;
alter table public.listing_status_events enable row level security;
alter table public.inquiries enable row level security;
alter table public.service_requests enable row level security;
alter table public.private_documents enable row level security;
alter table public.document_access_events enable row level security;
alter table public.audit_events enable row level security;
alter table public.consent_records enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select on public.user_roles to authenticated;
grant select, insert, update on public.property_listings to anon, authenticated;
grant select, insert, update on public.listing_private_details to authenticated;
grant select on public.listing_status_events to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy profiles_insert_own on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);
create policy profiles_update_own on public.profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy user_roles_select_own on public.user_roles for select to authenticated
  using ((select auth.uid()) = user_id);

create policy listings_read_published_or_owned_or_staff on public.property_listings for select to anon, authenticated
  using (
    status = 'published'
    or (select auth.uid()) = owner_user_id
    or ((select auth.jwt()) -> 'app_metadata' -> 'roles') ?| array['listing_reviewer','listing_publisher','administrator']
  );
create policy listings_insert_own_draft on public.property_listings for insert to authenticated
  with check ((select auth.uid()) = owner_user_id and status = 'draft');
create policy listings_update_own_unpublished on public.property_listings for update to authenticated
  using ((select auth.uid()) = owner_user_id and status in ('draft','submitted','changes_requested'))
  with check ((select auth.uid()) = owner_user_id and status in ('draft','submitted','changes_requested'));

create policy listing_private_details_read_own on public.listing_private_details for select to authenticated
  using ((select auth.uid()) = owner_user_id);
create policy listing_private_details_insert_own on public.listing_private_details for insert to authenticated
  with check (
    (select auth.uid()) = owner_user_id
    and exists (select 1 from public.property_listings l
                where l.id = listing_id and l.owner_user_id = (select auth.uid()))
  );
create policy listing_private_details_update_own on public.listing_private_details for update to authenticated
  using ((select auth.uid()) = owner_user_id)
  with check (
    (select auth.uid()) = owner_user_id
    and exists (select 1 from public.property_listings l
                where l.id = listing_id and l.owner_user_id = (select auth.uid()))
  );

create policy listing_status_events_read_owner_or_staff on public.listing_status_events for select to authenticated
  using (
    exists (select 1 from public.property_listings l
            where l.id = listing_id and l.owner_user_id = (select auth.uid()))
    or ((select auth.jwt()) -> 'app_metadata' -> 'roles') ?| array['listing_reviewer','listing_publisher','administrator']
  );

-- Explicit deny policies make the intended server-only boundary visible to auditors.
create policy inquiries_deny_client_access on public.inquiries for all to anon, authenticated
  using (false) with check (false);
create policy service_requests_deny_client_access on public.service_requests for all to anon, authenticated
  using (false) with check (false);
create policy private_documents_deny_client_access on public.private_documents for all to anon, authenticated
  using (false) with check (false);
create policy document_access_events_deny_client_access on public.document_access_events for all to anon, authenticated
  using (false) with check (false);
create policy audit_events_deny_client_access on public.audit_events for all to anon, authenticated
  using (false) with check (false);
create policy consent_records_deny_client_access on public.consent_records for all to anon, authenticated
  using (false) with check (false);

-- Quarantine bucket is private and has no client Storage policies yet.
-- Upload/download will be enabled only after trusted server-side inspection and malware scanning exist.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('private-evidence', 'private-evidence', false, 15728640,
        array['application/pdf','image/jpeg','image/png'])
on conflict (id) do nothing;

commit;
