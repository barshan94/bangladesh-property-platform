# Public inquiry API

## Endpoint
`POST /api/inquiries` accepts a small JSON body containing `name`, `email`, optional `phone`, `message`, and `consent: true`. Unknown fields are rejected. Passport/NID numbers, deeds, attachments and confidential case materials are not accepted.

## Controls
- Server-only Supabase secret key; no privileged key is exposed to browser bundles.
- Fixed-window persistent rate limiting in PostgreSQL, incremented atomically by an upsert.
- The rate-limit key is an HMAC-SHA256 digest of the platform-provided client IP; raw IP is not persisted.
- Inquiry, affirmative consent provenance and audit event are written in one PostgreSQL function transaction.
- Generic errors avoid disclosing database details.
- Rate limit: 5 requests per 15 minutes per hashed IP.
- Consent notice version: `inquiry-v1`.

## Deployment configuration
Set `SUPABASE_SECRET_KEY` and `INQUIRY_RATE_LIMIT_SECRET` as private server environment variables in the deployment platform. The latter must be a random high-entropy secret and must not be reused for other purposes. The API returns 503 when either is absent. Do not add either to GitHub or any `NEXT_PUBLIC_*` variable.

## Limitations
This endpoint records an initial contact inquiry only. It does not provide legal advice, create a service engagement, accept confidential documents, or guarantee a response time. No verified public phone/address is represented.
