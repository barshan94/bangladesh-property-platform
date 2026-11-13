# Authenticated service-request workflow

## User experience
- Signed-in users create requests at `/dashboard/service-requests`.
- The account email is read from verified Supabase Auth claims; it is not accepted from the browser payload.
- Users can view their own request history through an RLS-protected query.
- The form accepts name, optional phone, ISO 3166-1 alpha-2 country code, supported service code, Bangladesh property district and a short description.
- No files, identity numbers, deed contents, payment details or confidential case evidence are accepted.

## API and database
- `POST /api/service-requests` requires a valid authenticated session.
- The server derives the requester UUID and account email from verified claims.
- The server-only Supabase secret invokes `create_service_request`; it is never sent to the browser.
- The database function validates fields, confirms any listing reference is published or owned by the requester, and applies a per-user atomic limit of 5 requests per 15 minutes using a transaction advisory lock.
- Request row, `service_request_processing` consent record and audit event are written in one transaction.
- Direct client INSERT/UPDATE/DELETE remains denied. Authenticated SELECT is limited to the requester or trusted `app_metadata.roles` of `intake_coordinator`, `case_manager` or `administrator`.
- The request status is always initialized as `new`; clients cannot set workflow status.

## Constraints and service taxonomy
- The original database accepted a legacy service-code set that did not match the current eight-item service catalogue. The database now accepts both sets to preserve legacy compatibility.
- Country of residence is stored as an uppercase two-letter ISO code because the existing column is limited to two characters.
- `property_district` is stored separately instead of being hidden inside the free-text summary.

## Deployment and limitations
- Requires the same private server environment variables as the inquiry API: `SUPABASE_SECRET_KEY` and `NEXT_PUBLIC_SUPABASE_URL`.
- If the secret is not configured, submission fails closed with HTTP 503.
- No staff assignment, status-transition interface, notifications, document intake or response-time promise is implemented by this milestone.
- A request is not legal advice, proof of ownership, confirmation of service availability or a signed engagement.
