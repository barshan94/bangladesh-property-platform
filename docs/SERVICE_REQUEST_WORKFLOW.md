# Authenticated service-request workflow

## Client experience
- Signed-in users create requests at `/dashboard/service-requests`.
- The account email and requester UUID are derived from verified Supabase Auth claims, never from browser-supplied identity.
- Users can view only their own request history through RLS.
- The form accepts name, optional phone, ISO 3166-1 alpha-2 country code, supported service code, Bangladesh property district and a short description.
- No files, identity numbers, deed contents, payment details or confidential case evidence are accepted.
- Request submission writes the request, consent provenance and audit event atomically. Per-user intake is rate-limited to five requests per 15 minutes.

## Staff workspace
- Authorized staff use `/dashboard/service-requests/manage`.
- Access is limited to trusted `app_metadata.roles` for `intake_coordinator`, `case_manager` or `administrator`; the database also requires a matching non-revoked `user_roles` row.
- Intake coordinators and administrators can view the operational queue and assign requests to active intake coordinators, case managers or administrators.
- The staff directory returns only user ID, display name and role. It never exposes staff email addresses. When a profile has no display name, the UI uses a short ID suffix to distinguish staff accounts.
- Case managers can read request details and status history only for requests assigned to their own user ID.
- Case managers can progress only their assigned requests. Intake coordinators handle triage/routing and limited closure transitions. Administrators can assign but do not receive an implicit status-transition bypass.
- Status changes and assignment require a reason. The database locks the request row and writes status history and audit events in the same transaction.
- The UI filters actions by role, but PostgreSQL remains the authoritative authorization and lifecycle boundary.

## API and database security
- `POST /api/service-requests` requires a valid authenticated session.
- The server derives the requester UUID and account email from verified claims.
- The server-only Supabase secret invokes `create_service_request`; it is never sent to the browser.
- The database validates fields, confirms any listing reference is published or owned by the requester, and applies an atomic per-user rate limit.
- Direct client INSERT/UPDATE/DELETE remains denied.
- Public PostgREST staff RPCs are SECURITY INVOKER wrappers. Their privileged implementations live in the non-exposed `private` schema and verify `auth.uid()`, trusted JWT role claims and active database roles.
- The inquiry and service-request server-side RPCs are service-role-only. Anonymous and authenticated clients cannot execute them.

## Live transactional verification
- `supabase/tests/service_request_rls_probe.sql` tests owner visibility, two separate case-manager assignments, intake queue visibility, revoked-role denial and absence of anonymous SELECT grants.
- `supabase/tests/service_request_rpc_probe.sql` tests intake assignment, assigned case-manager progress, cross-case-manager transition denial, case-manager assignment denial, administrator transition denial, revoked-role denial and protected staff-directory access.
- Both scripts run inside a transaction and end with ROLLBACK; synthetic Auth users, role rows, requests, history and audit records are not retained.
- These are live database authorization probes, not browser end-to-end tests. They do not validate real user sessions, token refresh, actual staff account onboarding or deployed email delivery.

## Constraints and service taxonomy
- The database accepts the current service catalogue and legacy service codes to preserve compatibility.
- Country of residence is stored as an uppercase two-letter ISO code.
- `property_district` is stored separately instead of being hidden inside the free-text summary.

## Deployment and limitations
- Requires private server environment variables `SUPABASE_SECRET_KEY` and `NEXT_PUBLIC_SUPABASE_URL`.
- If the secret is not configured, submission fails closed with HTTP 503.
- No staff notifications, document intake, malware scanning, signed URL access or response-time promise is implemented.
- Production staff accounts and first-administrator bootstrap have not been configured; the Auth user table was empty during the latest verification.
- Migration-history reconciliation is prepared as a manual, guarded GitHub Actions workflow and remains pending until its repository secrets are configured and the workflow is run.
- A request is not legal advice, proof of ownership, confirmation of service availability or a signed engagement.
