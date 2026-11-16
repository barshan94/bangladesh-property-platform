begin;

-- Allow an active administrator to correct listing content without impersonating
-- the seller or changing the independently controlled review/publication status.
create or replace function private.enforce_listing_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_roles jsonb := coalesce(auth.jwt() -> 'app_metadata' -> 'roles', '[]'::jsonb);
  v_actor_role text;
  v_reason text;
  v_request_id text;
  v_now timestamptz := pg_catalog.now();
begin
  if new.id is distinct from old.id
     or new.owner_user_id is distinct from old.owner_user_id
     or new.public_reference is distinct from old.public_reference
     or new.currency_code is distinct from old.currency_code
     or new.created_at is distinct from old.created_at
     or new.expires_at is distinct from old.expires_at then
    raise exception using errcode = '42501', message = 'LISTING_SYSTEM_FIELDS_ARE_IMMUTABLE';
  end if;

  if new.status is distinct from old.status then
    if (new.listing_kind, new.property_type, new.headline, new.description, new.division,
        new.district, new.upazila, new.locality, new.public_location_label, new.price_amount,
        new.area_value, new.area_unit, new.area_basis, new.bedrooms, new.bathrooms,
        new.occupancy_status) is distinct from
       (old.listing_kind, old.property_type, old.headline, old.description, old.division,
        old.district, old.upazila, old.locality, old.public_location_label, old.price_amount,
        old.area_value, old.area_unit, old.area_basis, old.bedrooms, old.bathrooms,
        old.occupancy_status) then
      raise exception using errcode = '22023', message = 'EDIT_CONTENT_SEPARATELY_FROM_STATUS_TRANSITION';
    end if;

    if v_actor is null then
      raise exception using errcode = '42501', message = 'AUTHENTICATION_REQUIRED';
    elsif v_actor = old.owner_user_id then
      v_actor_role := 'seller';
      if not ((old.status = 'draft' and new.status = 'submitted')
           or (old.status = 'changes_requested' and new.status in ('submitted','withdrawn'))) then
        raise exception using errcode = '42501', message = 'SELLER_TRANSITION_NOT_ALLOWED';
      end if;
    elsif v_roles ? 'listing_reviewer'
      and exists (select 1 from public.user_roles ur where ur.user_id=v_actor and ur.role_code='listing_reviewer' and ur.revoked_at is null)
      and ((old.status='submitted' and new.status='under_review')
        or (old.status='under_review' and new.status in ('changes_requested','approved','rejected'))) then
      v_actor_role := 'listing_reviewer';
    elsif v_roles ? 'listing_publisher'
      and exists (select 1 from public.user_roles ur where ur.user_id=v_actor and ur.role_code='listing_publisher' and ur.revoked_at is null)
      and ((old.status='approved' and new.status in ('published','withdrawn','expired'))
        or (old.status='published' and new.status in ('withdrawn','expired','archived'))) then
      v_actor_role := 'listing_publisher';
    else
      raise exception using errcode = '42501', message = 'ROLE_TRANSITION_NOT_ALLOWED';
    end if;

    v_reason := nullif(pg_catalog.current_setting('app.listing_transition_reason', true), '');
    v_request_id := nullif(pg_catalog.current_setting('app.listing_transition_request_id', true), '');
    if v_actor_role='listing_reviewer' and old.status='under_review' and new.status in ('changes_requested','approved','rejected')
       and (v_reason is null or pg_catalog.char_length(v_reason)>2000 or v_reason ~ '[[:cntrl:]]') then
      raise exception using errcode='22023', message='REVIEW_DECISION_REASON_REQUIRED';
    end if;
    if v_reason is not null and (pg_catalog.char_length(v_reason)>2000 or v_reason ~ '[[:cntrl:]]') then
      raise exception using errcode='22023', message='INVALID_TRANSITION_REASON';
    end if;
    if v_request_id is not null and pg_catalog.char_length(v_request_id)>128 then
      raise exception using errcode='22023', message='INVALID_TRANSITION_REQUEST_ID';
    end if;

    new.submitted_at := case when new.status='submitted' then v_now else old.submitted_at end;
    new.published_at := case when new.status='published' then v_now else old.published_at end;
    new.updated_at := v_now;
    insert into public.listing_status_events(listing_id,actor_user_id,from_status,to_status,reason_code,reason,request_id)
    values(old.id,v_actor,old.status,new.status,v_actor_role||'_'||new.status,v_reason,v_request_id);
    insert into public.audit_events(actor_user_id,action,resource_type,resource_id,before_summary,after_summary,request_id)
    values(v_actor,'listing.status_changed','property_listing',old.id,
      pg_catalog.jsonb_build_object('status',old.status),
      pg_catalog.jsonb_build_object('status',new.status,'public_reference',old.public_reference),v_request_id);
  else
    if pg_catalog.current_setting('app.admin_property_edit', true) = 'true'
       and private.has_active_listing_staff_role('administrator') then
      -- Content corrections must never rewrite lifecycle timestamps.
      if new.submitted_at is distinct from old.submitted_at
         or new.published_at is distinct from old.published_at then
        raise exception using errcode='42501', message='LISTING_LIFECYCLE_TIMESTAMPS_ARE_IMMUTABLE';
      end if;
      new.updated_at := v_now;
      insert into public.audit_events(actor_user_id,action,resource_type,resource_id,before_summary,after_summary,request_id)
      values(v_actor,'listing.admin_content_updated','property_listing',old.id,
        pg_catalog.jsonb_build_object(
          'headline',old.headline,'description',old.description,'listing_kind',old.listing_kind,
          'property_type',old.property_type,'division',old.division,'district',old.district,
          'upazila',old.upazila,'locality',old.locality,'public_location_label',old.public_location_label,
          'price_amount',old.price_amount,'area_value',old.area_value,'area_unit',old.area_unit,
          'area_basis',old.area_basis,'bedrooms',old.bedrooms,'bathrooms',old.bathrooms,
          'occupancy_status',old.occupancy_status),
        pg_catalog.jsonb_build_object(
          'headline',new.headline,'description',new.description,'listing_kind',new.listing_kind,
          'property_type',new.property_type,'division',new.division,'district',new.district,
          'upazila',new.upazila,'locality',new.locality,'public_location_label',new.public_location_label,
          'price_amount',new.price_amount,'area_value',new.area_value,'area_unit',new.area_unit,
          'area_basis',new.area_basis,'bedrooms',new.bedrooms,'bathrooms',new.bathrooms,
          'occupancy_status',new.occupancy_status),
        nullif(pg_catalog.current_setting('app.listing_admin_edit_request_id',true),''));
    else
      if v_actor is distinct from old.owner_user_id
         or old.status not in ('draft','changes_requested')
         or new.submitted_at is distinct from old.submitted_at
         or new.published_at is distinct from old.published_at then
        raise exception using errcode='42501', message='LISTING_CONTENT_UPDATE_NOT_ALLOWED';
      end if;
      new.updated_at := v_now;
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.admin_update_property_listing(
  p_listing_id uuid,
  p_headline text,
  p_description text,
  p_listing_kind text,
  p_property_type text,
  p_division text,
  p_district text,
  p_upazila text default null,
  p_locality text default null,
  p_public_location_label text default null,
  p_price_amount numeric default null,
  p_area_value numeric default null,
  p_area_unit text default null,
  p_area_basis text default null,
  p_bedrooms integer default null,
  p_bathrooms numeric default null,
  p_occupancy_status text default 'unknown',
  p_request_id text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_listing public.property_listings%rowtype;
begin
  if auth.uid() is null or not private.has_active_listing_staff_role('administrator') then
    raise exception using errcode='42501', message='ACTIVE_ADMINISTRATOR_REQUIRED';
  end if;
  if p_listing_id is null
     or p_headline is null or pg_catalog.char_length(pg_catalog.btrim(p_headline)) not between 10 and 180
     or p_description is null or pg_catalog.char_length(pg_catalog.btrim(p_description)) not between 30 and 12000
     or p_listing_kind not in ('sale','rent','lease')
     or p_property_type not in ('apartment','house','land','commercial','industrial','other')
     or p_division is null or pg_catalog.char_length(pg_catalog.btrim(p_division)) not between 2 and 80
     or p_district is null or pg_catalog.char_length(pg_catalog.btrim(p_district)) not between 2 and 80
     or (p_price_amount is not null and p_price_amount < 0)
     or (p_area_value is not null and p_area_value <= 0)
     or (p_area_value is null and (p_area_unit is not null or p_area_basis is not null))
     or (p_area_value is not null and (p_area_unit not in ('sqft','sqm','katha','decimal','acre') or p_area_basis not in ('land','floor','built_up','carpet','gross')))
     or (p_bedrooms is not null and p_bedrooms not between 0 and 100)
     or (p_bathrooms is not null and p_bathrooms not between 0 and 100)
     or p_occupancy_status not in ('unknown','vacant','occupied','under_construction')
     or (p_request_id is not null and pg_catalog.char_length(p_request_id)>128) then
    raise exception using errcode='22023', message='INVALID_PROPERTY_LISTING_CONTENT';
  end if;
  if (p_upazila is not null and pg_catalog.char_length(p_upazila)>80)
     or (p_locality is not null and pg_catalog.char_length(p_locality)>160)
     or (p_public_location_label is not null and pg_catalog.char_length(p_public_location_label)>180) then
    raise exception using errcode='22023', message='INVALID_PROPERTY_LOCATION_CONTENT';
  end if;

  perform pg_catalog.set_config('app.admin_property_edit','true',true);
  perform pg_catalog.set_config('app.listing_admin_edit_request_id',coalesce(p_request_id,''),true);
  update public.property_listings
  set headline=p_headline, description=p_description, listing_kind=p_listing_kind,
      property_type=p_property_type, division=p_division, district=p_district,
      upazila=p_upazila, locality=p_locality, public_location_label=p_public_location_label,
      price_amount=p_price_amount, area_value=p_area_value, area_unit=p_area_unit,
      area_basis=p_area_basis, bedrooms=p_bedrooms, bathrooms=p_bathrooms,
      occupancy_status=p_occupancy_status
  where id=p_listing_id
  returning * into v_listing;
  if not found then
    raise exception using errcode='P0002', message='PROPERTY_LISTING_NOT_FOUND';
  end if;
  return pg_catalog.jsonb_build_object('id',v_listing.id,'public_reference',v_listing.public_reference,'status',v_listing.status,'updated_at',v_listing.updated_at);
end;
$$;
revoke all on function public.admin_update_property_listing(uuid,text,text,text,text,text,text,text,text,text,numeric,numeric,text,text,integer,numeric,text,text) from public,anon;
grant execute on function public.admin_update_property_listing(uuid,text,text,text,text,text,text,text,text,text,numeric,numeric,text,text,integer,numeric,text,text) to authenticated;

-- Inquiry status is a business workflow, not a free-form service-role update.
create or replace function public.admin_update_inquiry_status(p_inquiry_id uuid,p_status text,p_request_id text default null)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before text;
  v_after text;
begin
  if auth.uid() is null or not private.has_active_listing_staff_role('administrator') then
    raise exception using errcode='42501', message='ACTIVE_ADMINISTRATOR_REQUIRED';
  end if;
  if p_inquiry_id is null or p_status not in ('new','triaged','assigned','in_progress','resolved','closed','spam')
     or (p_request_id is not null and pg_catalog.char_length(p_request_id)>128) then
    raise exception using errcode='22023', message='INVALID_INQUIRY_STATUS';
  end if;
  select status into v_before from public.inquiries where id=p_inquiry_id for update;
  if not found then raise exception using errcode='P0002', message='INQUIRY_NOT_FOUND'; end if;
  update public.inquiries set status=p_status, updated_at=pg_catalog.now() where id=p_inquiry_id returning status into v_after;
  insert into public.audit_events(actor_user_id,action,resource_type,resource_id,before_summary,after_summary,request_id)
  values(auth.uid(),'inquiry.status_changed','inquiry',p_inquiry_id,
    pg_catalog.jsonb_build_object('status',v_before),
    pg_catalog.jsonb_build_object('status',v_after),p_request_id);
  return pg_catalog.jsonb_build_object('id',p_inquiry_id,'status',v_after);
end;
$$;
revoke all on function public.admin_update_inquiry_status(uuid,text,text) from public,anon;
grant execute on function public.admin_update_inquiry_status(uuid,text,text) to authenticated;


-- Keep private inquiry notes behind the same active-role database check.
-- The application must not use the service-role key for an ordinary staff note.
create or replace function public.admin_add_inquiry_staff_note(
  p_inquiry_id uuid,
  p_note text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_note_id uuid;
begin
  if auth.uid() is null or not private.has_active_listing_staff_role('administrator') then
    raise exception using errcode='42501', message='ACTIVE_ADMINISTRATOR_REQUIRED';
  end if;
  if p_inquiry_id is null or p_note is null
     or pg_catalog.char_length(pg_catalog.btrim(p_note)) not between 5 and 4000 then
    raise exception using errcode='22023', message='INVALID_INQUIRY_FOLLOW_UP_NOTE';
  end if;
  if not exists (select 1 from public.inquiries where id=p_inquiry_id) then
    raise exception using errcode='P0002', message='INQUIRY_NOT_FOUND';
  end if;
  insert into public.inquiry_staff_notes(inquiry_id,actor_user_id,note)
  values(p_inquiry_id,auth.uid(),pg_catalog.btrim(p_note))
  returning id into v_note_id;
  return v_note_id;
end;
$$;
revoke all on function public.admin_add_inquiry_staff_note(uuid,text) from public,anon;
grant execute on function public.admin_add_inquiry_staff_note(uuid,text) to authenticated;

commit;
