-- Per-owner abuse throttling for private document intake.
-- The rate-limit ledger and RPC are inaccessible to browser roles.
begin;

create table private.private_document_upload_rate_limits (
  owner_user_id uuid primary key,
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 0),
  updated_at timestamptz not null default pg_catalog.now()
);

create index private_document_upload_rate_limits_updated_at_idx
  on private.private_document_upload_rate_limits(updated_at);

create or replace function private.consume_private_document_upload_rate_limit(
  p_owner_user_id uuid,
  p_limit integer default 10,
  p_window_seconds integer default 3600
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_start timestamptz;
  v_count integer;
  v_reset timestamptz;
begin
  if p_owner_user_id is null
     or p_limit is null or p_limit < 1 or p_limit > 50
     or p_window_seconds is null or p_window_seconds < 60 or p_window_seconds > 86400 then
    raise exception 'INVALID_PRIVATE_DOCUMENT_RATE_LIMIT_ARGUMENTS' using errcode = '22023';
  end if;

  with expired as (
    select owner_user_id
    from private.private_document_upload_rate_limits
    where updated_at < v_now - interval '2 days'
    order by updated_at
    limit 100
    for update skip locked
  )
  delete from private.private_document_upload_rate_limits r
  using expired e
  where r.owner_user_id = e.owner_user_id;

  insert into private.private_document_upload_rate_limits(
    owner_user_id, window_started_at, request_count, updated_at
  ) values (p_owner_user_id, v_now, 1, v_now)
  on conflict (owner_user_id) do update
  set window_started_at = case
        when private.private_document_upload_rate_limits.window_started_at
             + pg_catalog.make_interval(secs => p_window_seconds) <= v_now then v_now
        else private.private_document_upload_rate_limits.window_started_at end,
      request_count = case
        when private.private_document_upload_rate_limits.window_started_at
             + pg_catalog.make_interval(secs => p_window_seconds) <= v_now then 1
        else private.private_document_upload_rate_limits.request_count + 1 end,
      updated_at = v_now
  returning private.private_document_upload_rate_limits.window_started_at,
            private.private_document_upload_rate_limits.request_count
  into v_start, v_count;

  v_reset := v_start + pg_catalog.make_interval(secs => p_window_seconds);
  return query select
    v_count <= p_limit,
    greatest(0, p_limit - v_count),
    case when v_count <= p_limit then 0
         else greatest(1, ceil(extract(epoch from (v_reset - v_now)))::integer) end;
end;
$$;

revoke all on function private.consume_private_document_upload_rate_limit(uuid,integer,integer)
  from public, anon, authenticated;
grant usage on schema private to service_role;
grant execute on function private.consume_private_document_upload_rate_limit(uuid,integer,integer)
  to service_role;

create or replace function public.consume_private_document_upload_rate_limit(
  p_owner_user_id uuid,
  p_limit integer default 10,
  p_window_seconds integer default 3600
)
returns table(allowed boolean, remaining integer, retry_after_seconds integer)
language sql
security invoker
set search_path = ''
as $$
  select * from private.consume_private_document_upload_rate_limit(
    p_owner_user_id, p_limit, p_window_seconds
  );
$$;

revoke all on function public.consume_private_document_upload_rate_limit(uuid,integer,integer)
  from public, anon, authenticated;
grant execute on function public.consume_private_document_upload_rate_limit(uuid,integer,integer)
  to service_role;

commit;
