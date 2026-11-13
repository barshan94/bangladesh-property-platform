begin;

create table if not exists public.inquiry_rate_limits (
  key_hash text primary key check (key_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default now()
);
alter table public.inquiry_rate_limits enable row level security;
revoke all on public.inquiry_rate_limits from anon, authenticated;
revoke all on public.inquiry_rate_limits from public;

create or replace function public.consume_inquiry_rate_limit(
  p_key_hash text,
  p_limit integer default 5,
  p_window_seconds integer default 900
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := clock_timestamp();
  v_start timestamptz;
  v_count integer;
  v_reset timestamptz;
begin
  if p_key_hash !~ '^[a-f0-9]{64}$' or p_limit < 1 or p_limit > 100
     or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'INVALID_RATE_LIMIT_ARGUMENTS' using errcode = '22023';
  end if;

  insert into public.inquiry_rate_limits(key_hash, window_started_at, request_count, updated_at)
  values (p_key_hash, v_now, 1, v_now)
  on conflict (key_hash) do update
  set window_started_at = case
        when public.inquiry_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now then v_now
        else public.inquiry_rate_limits.window_started_at end,
      request_count = case
        when public.inquiry_rate_limits.window_started_at + make_interval(secs => p_window_seconds) <= v_now then 1
        else public.inquiry_rate_limits.request_count + 1 end,
      updated_at = v_now
  returning public.inquiry_rate_limits.window_started_at, public.inquiry_rate_limits.request_count
  into v_start, v_count;

  v_reset := v_start + make_interval(secs => p_window_seconds);
  return query select
    v_count <= p_limit,
    greatest(0, p_limit - v_count),
    case when v_count <= p_limit then 0 else greatest(1, ceil(extract(epoch from (v_reset - v_now)))::integer) end;
end;
$$;

revoke all on function public.consume_inquiry_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_inquiry_rate_limit(text, integer, integer) to service_role;

create or replace function public.create_public_inquiry(
  p_contact_name text,
  p_email_normalized text,
  p_phone text,
  p_message text,
  p_consent_version text,
  p_request_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if char_length(btrim(p_contact_name)) not between 2 and 120
     or char_length(p_email_normalized) not between 3 and 254
     or char_length(btrim(p_message)) not between 10 and 5000
     or char_length(p_consent_version) not between 1 and 40
     or char_length(p_request_id) not between 1 and 128 then
    raise exception 'INVALID_INQUIRY_ARGUMENTS' using errcode = '22023';
  end if;

  insert into public.inquiries(
    contact_name, email_normalized, phone, message, consent_version
  ) values (
    btrim(p_contact_name), lower(btrim(p_email_normalized)), nullif(btrim(p_phone), ''),
    btrim(p_message), p_consent_version
  ) returning id into v_id;

  insert into public.consent_records(user_id, consent_type, notice_version, source)
  values (null, 'public_service_inquiry', p_consent_version, 'website_form');

  insert into public.audit_events(actor_user_id, action, resource_type, resource_id, after_summary, request_id)
  values (null, 'inquiry.created', 'inquiry', v_id,
          jsonb_build_object('consent_version', p_consent_version), p_request_id);

  return v_id;
end;
$$;

revoke all on function public.create_public_inquiry(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_public_inquiry(text, text, text, text, text, text) to service_role;

commit;
