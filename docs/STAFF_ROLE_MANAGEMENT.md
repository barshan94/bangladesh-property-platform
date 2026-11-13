# Trusted Staff Role Management

## Deployment model

Staff role changes run in the Supabase Edge Function `manage-staff-role`, not in browser code or a public Next.js server action. The function uses the project's server-managed `SUPABASE_SERVICE_ROLE_KEY`; that key is never copied into the repository, GitHub Actions, or client environment variables.

The function requires a valid Supabase access token (`verify_jwt=true`) and independently resolves the actor with Auth. It accepts only `action`, `targetUserId` (Auth UUID), and `roleCode`; it never accepts email addresses or client-supplied role lists.

## One-time bootstrap

1. Create/confirm the intended administrator account through the normal Supabase Auth signup flow.
2. In Supabase Dashboard → Authentication → Users, copy that account's immutable UUID.
3. In Supabase Dashboard → Edge Functions → Secrets, set `STAFF_BOOTSTRAP_ADMIN_USER_ID` to that exact UUID. Do not put it in GitHub or a `NEXT_PUBLIC_*` variable.
4. Deploy `supabase/functions/manage-staff-role/index.ts` with JWT verification enabled.
5. While no active administrator exists, only that exact user can call the function to grant `administrator` to their own UUID. The function rejects bootstrap attempts targeting any other user and refuses bootstrap after an administrator record exists.
6. Remove `STAFF_BOOTSTRAP_ADMIN_USER_ID` from Edge Function secrets after the first administrator role has been established.

The bootstrap identity is intentionally not guessed or hardcoded. Until the secret is configured, the function cannot bootstrap anyone.

## Subsequent grant/revoke calls

POST JSON to the function URL with the caller's Supabase access token:

```json
{ "action": "grant", "targetUserId": "AUTH-USER-UUID", "roleCode": "listing_reviewer" }
```

Use `"revoke"` to revoke an active role. Allowed role codes are `seller`, `listing_reviewer`, `listing_publisher`, `intake_coordinator`, `case_manager`, `content_editor`, and `administrator`.

An active administrator must have both an active `user_roles` administrator row and the matching trusted `app_metadata.roles` claim. The function updates Auth metadata and the role record, then appends an audit event. It attempts compensating rollback if a later write fails. It refuses to revoke the last active administrator. A target user must refresh their session before updated JWT claims are reflected in their browser.

## Operational caveats

- The Auth Admin API and Postgres are separate systems; no cross-system transaction exists. The function uses compensating rollback, but operators must review any 502 response with `rollbackAttempted`.
- Use MFA for administrator accounts and restrict dashboard access.
- Never grant roles from user-editable `user_metadata`, client forms, or query parameters.
- The function's deployment and source do not activate a staff role by themselves. Bootstrap secret configuration and a real authenticated invocation are still required.
