# Database Schema

**Status:** Initial PostgreSQL schema, Auth profile bootstrap trigger and nine previously reconciled migration history records are present; the two subsequent migrations (atomic quota reservation and trusted scan-result transition) remain local and unapplied remotely in the dedicated Supabase project. Source migrations are in `supabase/migrations/`; generated client types are in `src/types/database.types.ts`.

## Provider and environment
- Provider: Supabase Free project, isolated in the MRA Supabase account.
- Project ref: `xpbjdeknjudurulogjkr`.
- Region: `ap-south-1`.
- Database: PostgreSQL 17.
- Existing projects in the MRA organization were not modified.
- The manual migration-history reconciliation completed successfully; a live migration listing verified the nine migrations that had already been applied remotely. The tenth migration (`20261113140000`) adds atomic private-document quota reservation, and the eleventh (`20261113150000`) adds a server-only digest-bound scan-result transition and audit. Both have passed isolated local replay and CI probes, but neither has been applied to the remote project.

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
- Inquiry, service-request, private-document, audit, consent and document-access records have no client grants and explicit deny policies. Trusted server routes own these workflows.
- The `private-evidence` Storage bucket is private, limited to PDF/JPEG/PNG and 15 MiB. No client Storage policies exist.
- `POST /api/private-documents` accepts authenticated multipart uploads (maximum 4 MiB file plus 128 KiB bounded multipart overhead) only after verifying that the caller owns the referenced listing or service request. It checks file size, detects supported file signatures from bytes, reserves a pending-document slot atomically per owner in PostgreSQL, stores the object under a random quarantine key, writes SHA-256 and pending metadata, and appends an upload access event. The endpoint returns no file URL. The atomic quota RPC is in migration `20261113140000`, the scan transition in `20261113150000`, and per-owner upload throttling (10 attempts/hour) in `20261113160000`. These three migrations passed isolated local replay but are not applied to the live project; the live endpoint must remain disabled until they are deliberately applied and integration-tested.
- The upload route uses the server-only `SUPABASE_SECRET_KEY`. It must never be copied to a `NEXT_PUBLIC_*` variable, committed, or returned to the browser.
- Pending uploads are quarantined only by application state and private bucket access controls. A server-only scan-completion RPC records a one-way result only when the submitted SHA-256 matches stored metadata, and writes a scan audit event atomically; CI tests role restrictions, digest mismatch denial, state transition and audit persistence. This is a database primitive only: there is still no malware scanner or authenticated scan-result callback. Do not treat signature detection or a manually supplied RPC result as proof that a file is safe. No download route exists.
- Supabase Storage operations use the Storage API; the Storage metadata schema is not modified directly.

## Constraints and indexes
- UUID primary keys; UTC timestamps.
- Bangladesh listing prices are currently constrained to BDT.
- Area value, unit and basis must be supplied together to prevent ambiguous area measurements.
- Listing states use the established lifecycle vocabulary; public publication requires a publication timestamp.
- The private Storage bucket accepts PDF/JPEG/PNG and has a 15 MiB object limit; the current HTTP upload route imposes a stricter 4 MiB file cap plus 128 KiB multipart overhead for the Vercel function request-body ceiling. Metadata checks and magic-byte detection are not malware scanning.
- Foreign keys and the primary public search/owner/status paths are indexed.

## Not implemented yet
- Production Auth redirect URLs, email delivery configuration, bot protection and end-to-end mailbox verification.
- Live JWT/RLS tests for each application role and browser E2E authentication.
- Malware scanning, scanner-result authenticity, retry/recovery and quarantine cleanup.
- Authorized document preview/download, short-lived signed URLs and download audit.
- Full file format validation, verification of deployed host request-size enforcement and live upload integration tests.
- Public media bucket and moderation pipeline.
- Content CMS, saved listings, visits, case management, notifications and search/geospatial enhancements.
- Non-production remote migration drift validation and automated remote migration checks.

## Important exposure note
Supabase changed the default behavior for new projects: new public tables are not automatically exposed through the Data API. Explicit SQL grants have been applied only where intended. Confirm the project's Data API exposed-schema/table configuration before enabling browser access. RLS and grants remain mandatory regardless of that setting.

## Legal and privacy constraints
Do not collect passport/NID numbers or title documents through ordinary contact forms. Foreign ownership eligibility is fact-specific and must not be promised. Listing moderation, record searches, physical inspection and a scoped legal title opinion are distinct services. Legal pages and workflows require Bangladesh counsel review before production.
