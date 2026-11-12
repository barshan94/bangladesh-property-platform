# Database Schema

**Status:** Initial PostgreSQL schema and Auth profile bootstrap trigger are implemented in the dedicated Supabase project. Source migrations are in `supabase/migrations/`. Generated client types are in `src/types/database.types.ts`.

## Provider and environment
- Provider: Supabase Free project, isolated in the MRA Supabase account.
- Project ref: `xpbjdeknjudurulogjkr`.
- Region: `ap-south-1`.
- Database: PostgreSQL 17.
- Existing projects in the MRA organization were not modified.
- The initial schema migration and the profile-bootstrap migration are committed to GitHub after being applied to the hosted project. A local Supabase CLI migration-history pull/reconciliation is still outstanding.

## Implemented tables
| Table | Purpose | Client access |
|---|---|---|
| `profiles` | Minimal account profile and language preference | Authenticated user can read/write own row |
| `user_roles` | Trusted application role grants and revocations | User can read own role rows; no client writes |
| `property_listings` | Public listing fields, owner, price, area, location label and lifecycle status | Public can read published rows; owner can read own rows and create/update own unpublished rows |
| `listing_private_details` | Exact address, coordinates and access notes | Owner only; not granted to anonymous users |
| `listing_status_events` | Append-only listing status history | Owner and trusted staff claims can read; clients cannot write |
| `inquiries` | Contact and property inquiry data | Server-only; client access explicitly denied |
| `service_requests` | Verification, inspection and assistance intake | Server-only; client access explicitly denied |
| `private_documents` | Private evidence metadata, scan and review states | Server-only; client access explicitly denied |
| `document_access_events` | Sensitive document access audit | Server-only; client access explicitly denied |
| `audit_events` | Privileged action audit metadata | Server-only; client access explicitly denied |
| `consent_records` | Versioned consent provenance | Server-only; client access explicitly denied |

## Security model
- RLS is enabled on all 11 application tables.
- Anonymous users can only query the listing table, and RLS limits rows to `status = 'published'`.
- Authenticated sellers can read their own listings, create drafts and edit only draft or changes-requested content. A SECURITY INVOKER transition RPC plus a private database trigger enforce seller, reviewer and publisher transitions; status history and audit rows are inserted atomically. Reviewer decisions require a reason. Sellers cannot approve or publish listings, reviewers cannot publish, and administrator claims do not bypass role separation.
- Listing reviewer/publisher/admin read access uses signed `app_metadata.roles` JWT claims. Never use user-editable `user_metadata` for authorization. Role assignment must happen through a trusted server/admin workflow; token claims may remain stale until refresh.
- New Supabase Auth users automatically receive a minimal `profiles` row through `private.handle_new_auth_user()`. The trigger copies only the Auth user UUID; it does not trust user-editable metadata for roles or permissions.
- The trigger function is in the non-exposed `private` schema, uses `SECURITY DEFINER` with an empty `search_path`, schema-qualifies its insert, and has execution revoked from API roles. It is invoked only by the `auth.users` insert trigger.
- Private exact address and coordinates are stored separately from public listing fields.
- Inquiry, service-request, private-document, audit, consent and document-access records have no client grants and explicit deny policies. Trusted server routes must own these workflows.
- The `private-evidence` Storage bucket is private, limited to PDF/JPEG/PNG and 15 MiB. No client Storage policies exist yet; uploads and downloads remain disabled until trusted byte inspection, malware scanning and authorization endpoints are implemented.
- No service-role or secret key belongs in browser code or GitHub.
- Supabase's Storage metadata schema is not modified directly; file operations must use the Storage API.

## Constraints and indexes
- UUID primary keys; UTC timestamps.
- Bangladesh listing prices are currently constrained to BDT.
- Area value, unit and basis must be supplied together to prevent ambiguous area measurements.
- Listing states use the established lifecycle vocabulary; public publication requires a publication timestamp.
- Private documents accept only PDF/JPEG/PNG metadata and a maximum size of 15 MiB. Metadata checks are not malware scanning.
- Foreign keys and the primary public search/owner/status paths are indexed.

## Not implemented yet
- Production Auth redirect URLs, email delivery configuration, bot protection and end-to-end mailbox verification.
- Trusted role provisioning and staff assignment/authorization workflow.
- Server API routes for inquiries, service requests, moderation, publication and audit writes.
- Idempotency and replay protection for lifecycle transitions; staff role provisioning, staff workspaces and live moderation operations.
- Actual file-byte inspection, malware scanner, quarantine processing, private upload/download endpoints and signed URLs.
- Public media bucket and moderation pipeline.
- Content CMS, saved listings, visits, case management, notifications and search/geospatial enhancements.
- Automated RLS tests using real anon, seller and staff JWTs.
- Supabase CLI local migration history reconciliation and CI migration validation.

## Important exposure note
Supabase changed the default behavior for new projects: new public tables are not automatically exposed through the Data API. Explicit SQL grants have been applied only where intended. Confirm the project's Data API exposed-schema/table configuration before enabling browser access. RLS and grants remain mandatory regardless of that setting.

## Legal and privacy constraints
Do not collect passport/NID numbers or title documents through ordinary contact forms. Foreign ownership eligibility is fact-specific and must not be promised. Listing moderation, record searches, physical inspection and a scoped legal title opinion are distinct services. Legal pages and workflows require Bangladesh counsel review before production.
