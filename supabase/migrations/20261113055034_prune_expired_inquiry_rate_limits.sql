begin;

create index if not exists inquiry_rate_limits_updated_at_idx
  on public.inquiry_rate_limits (updated_at);

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

  -- Prune at most 100 expired keys per accepted API attempt. Two days
  -- exceeds the maximum supported 24-hour rate window, so active keys
  -- are never removed. SKIP LOCKED avoids blocking concurrent requests.
  with expired_keys as (
    select key_hash
    from public.inquiry_rate_limits
    where updated_at < v_now - interval '2 days'
    order by updated_at
    limit 100
    for update skip locked
  )
  delete from public.inquiry_rate_limits as rate_limits
  using expired_keys
  where rate_limits.key_hash = expired_keys.key_hash;

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

commit;
