# Architecture

## Status
The web application is a Next.js modular monolith. A dedicated Supabase PostgreSQL 17 project has now been created and its initial schema, RLS policies and private evidence bucket are implemented. The browser/server Supabase integration and operational workflows are not yet complete.

## Selected infrastructure
- Web: Next.js 15, React 19, TypeScript.
- Backend: Supabase Free, project `xpbjdeknjudurulogjkr`, region `ap-south-1`.
- Database: PostgreSQL 17.
- Storage: private `private-evidence` bucket, PDF/JPEG/PNG, 15 MiB cap; client access intentionally disabled until server-side scanning and authorization exist.
- Existing Supabase projects in both connected accounts are separate and untouched.
- No paid service, paid add-on or paid branch is part of the design.

## Logical components
- **Public web experience:** corporate pages, service pages, knowledge hub, FAQs, videos, contact and consultation entry points.
- **Marketplace:** property search, listing details, seller submissions and moderation.
- **Client workspace:** profile, submitted requests, case status and future secure document access.
- **Operations/admin workspace:** listing review, lead triage, case assignment, content management, permissions and audit review.
- **Application/API layer:** authentication, authorization, validation, business rules, rate limiting and integrations. These server workflows remain to be implemented.
- **Data layer:** profiles, trusted roles, property listings, private property details, inquiries, service requests, private-document metadata, consent and audit records.
- **Private file storage:** non-public evidence bucket, currently deny-by-default for client access.
- **External services:** email/SMS/WhatsApp, maps/geocoding and analytics remain unselected and must be reviewed for privacy, availability and cost.

## Trust boundaries
1. Anonymous visitor: published listing rows only.
2. Authenticated client: own profile, own listing rows and own private property details.
3. Staff: trusted role claims for limited read access; assignment-scoped staff workflows are not implemented yet.
4. Privileged server: handles inquiries, service requests, moderation writes, document metadata, audit events and private file operations.
5. Private object storage: no public bucket and no direct client policies yet.
6. External vendors: no integration until provider, data sharing and cost are reviewed.

## Security requirements
- RLS enabled on every application table.
- Use signed `app_metadata` claims, not editable `user_metadata`, for staff authorization.
- Never expose service-role or secret API keys in frontend bundles.
- Public listing fields and private address/coordinates are separate.
- Inquiry, service-request, evidence metadata and audit tables are server-only.
- Private evidence remains unavailable until trusted byte inspection, malware scanning and scoped upload/download authorization are implemented.
- Do not modify Supabase's managed `storage` schema directly.
- Enforce server-side validation, rate limiting, idempotency and audit logging for all sensitive workflows.

## Implementation sequence
1. Database schema, RLS, private bucket and generated types — initial foundation implemented; verification and CI reconciliation ongoing.
2. Supabase SSR/client setup and environment validation.
3. Auth flows, profile bootstrap and trusted role provisioning.
4. Server-side inquiry/service-request endpoints with validation, rate limiting and consent.
5. Listing submission, moderation, status transitions and public listing queries.
6. Private evidence quarantine, byte inspection, malware scanning, scoped downloads and access audit.
7. Staff/client workspaces, content management, monitoring and operational recovery.
8. Deployment, real-device/accessibility/security testing and legal review.

## Operational caveats
A database schema is not a production service by itself. No live contact channel, legal team, verified property inventory, title verification service, malware scanning pipeline or deployed production environment is claimed. See `docs/DATABASE_SCHEMA.md`, `docs/SECURITY_AND_PRIVACY.md` and `ROADMAP.md`.
