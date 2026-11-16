-- The public listing SELECT policy checks staff roles in public.user_roles.
-- PostgREST must have table-level SELECT privilege to evaluate that EXISTS
-- subquery for anonymous visitors. RLS remains enabled, and the only
-- user_roles SELECT policy is authenticated-user self access, so anon sees
-- no user-role rows while published listing reads can be evaluated safely.
GRANT SELECT ON TABLE public.user_roles TO anon;
