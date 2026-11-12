-- Create a profile row for every Supabase Auth user.
-- The function lives in a non-exposed schema and accepts no caller-controlled role data.

create schema if not exists private;

revoke all on schema private from public;
revoke all on schema private from anon;
revoke all on schema private from authenticated;
revoke all on schema private from service_role;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public;
revoke all on function private.handle_new_auth_user() from anon;
revoke all on function private.handle_new_auth_user() from authenticated;
revoke all on function private.handle_new_auth_user() from service_role;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function private.handle_new_auth_user();
