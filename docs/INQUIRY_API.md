# Public inquiry API

## Endpoint
`POST /api/inquiries` accepts required `name`, `email`, `serviceCode`, `message`, and `consent: true`; optional `phone`, `country`, and `propertyDistrict`. Unknown fields are rejected. Passport/NID numbers, deeds, attachments and confidential case materials are not accepted.

The public contact form at `/contact` submits to this endpoint and displays the generated reference after a successful response. It does not support file uploads.

## Controls
- Server-only Supabase secret key; no privileged key is exposed to browser bundles.
- Persistent PostgreSQL fixed-window rate limiting, incremented atomically by an upsert.
- Rate-limit key is an HMAC-SHA256 digest of the trusted platform client-IP header; raw IP is not persisted.
- Inquiry, consent provenance and audit event are written in one PostgreSQL transaction.
- Generic errors avoid exposing database details.
- Rate limit: 5 requests per 15 minutes per hashed IP.
- Consent notice version: `inquiry-v1`.

## Deployment configuration
Set `SUPABASE_SECRET_KEY` and `INQUIRY_RATE_LIMIT_SECRET` as private server environment variables in the deployment platform. The latter must be a random high-entropy secret (at least 32 characters). Do not add either to GitHub or any `NEXT_PUBLIC_*` variable. The API returns 503 until configured.

## Limitations
This endpoint records an initial contact inquiry only. It does not provide legal advice, create a service engagement, accept confidential documents, or guarantee a response time. A successful API response confirms database receipt, not that an operator has reviewed or replied. No verified public phone/address is represented.
