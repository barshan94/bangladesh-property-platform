# Live Supabase schema audit — 2026-11-16

Project: `xpbjdeknjudurulogjkr`  
Repository: `barshan94/bangladesh-property-platform`  
Account/project context: dedicated Bangladesh Property Platform Supabase project, region `ap-south-1`.

This audit used read-only Supabase catalog queries and the migration ledger. No SQL DDL, data writes, migration application, or hosting changes were performed.

## Migration ledger

- Remote migration ledger contains 10 entries.
- Repository contains 28 migration files.
- 18 repository migrations (versions 10–27) remain unapplied remotely.
- The database-only backup workflow has been corrected, but a successful backup artifact and restore rehearsal have not been verified.

## Confirmed live schema snapshot

| Capability / object | Live result | Meaning |
| --- | --- | --- |
| `public.property_listings` | Exists; no public latitude/longitude or rounded map-coordinate columns | The public map projection migration is not installed. |
| `public.inquiries` | Exists | Base inquiry schema is present. |
| `public.service_requests` | Exists | Base service-request schema is present. |
| `public.listing_media` | Absent | Listing media intake/moderation/publication migrations are not installed. |
| `public.knowledge_articles` / `public.knowledge_hub_articles` | Both absent | Knowledge Hub editorial schema is not installed. |
| `public.site_visit_requests` / `public.site_visits` | Both absent | Site-visit request migration is not installed. |
| `public.private_documents` | Exists with `scan_status`; no `scanned_at` or `scan_engine` columns | Base dormant table exists, but pending scanner metadata migration is not installed. The related application endpoints remain disabled; do not collect confidential documents. |

The live `public.create_service_request` function was inspected with `pg_get_functiondef`. Its INSERT column/value mapping currently places `property_listing_id` third, then trimmed `contact_name`, and maps the remaining fields to their intended columns. This confirms that specific historical function correction is present in the current remote function definition; it does not prove every application route or permission path works end-to-end.

## Current live data and Storage snapshot

Read-only counts at audit time:

| Resource | Count |
| --- | ---: |
| Auth users | 0 |
| Property listings | 0 |
| Inquiries | 0 |
| Service requests | 0 |
| Storage objects | 0 |

One Storage bucket exists:

- ID/name: `private-evidence`
- Public: `false`
- File size limit: 15 MiB
- Allowed MIME types: PDF, JPEG, PNG

The bucket is empty, but the existence of a private bucket is not proof that Storage configuration, object bytes, or Auth settings are recoverable. The database export alone does not back up managed Auth/Storage schemas or Storage object bytes.

## Interpretation

The live database is not merely missing a few optional records. It lacks database objects required by several source-level features:

- Listing media intake/review/publication is not live.
- Knowledge Hub CMS is not live.
- Public map coordinate projection is not live.
- Site-visit request support is not live.
- Scanner metadata is not live, and confidential document exchange is excluded from the MVP regardless.

The base public listing, inquiry and service-request tables exist. The current service-request RPC definition has the corrected column mapping. Those facts do not close the remaining migration gap or replace live authenticated/anonymous application smoke tests.

## Safe next steps

1. Run the corrected encrypted database backup and verify the artifact; download it to durable secure storage before seven-day artifact retention expires.
2. Define separate recovery for Auth settings/users, Storage bucket configuration and Storage object bytes, then rehearse restore.
3. Review each pending migration against this live snapshot and inspect all preconditions, triggers, functions, grants and RLS policies. The inventory above is a focused audit, not a complete schema-diff.
4. Resolve the known pending scan-metadata CHECK constraint defect with a reviewed forward-only migration workflow. Do not edit an already-applied migration or manually alter migration history.
5. Obtain explicit authorization before any remote schema change. Only after backup, recovery and drift gates are satisfied should migrations be applied in a controlled sequence.
6. After migration, run database authorization probes and deployed smoke tests for every enabled workflow.

## Release decision

**NO-GO for public production and real customer data.** This audit strengthens the evidence for the migration gap; it does not authorize applying migrations. No remote database changes were made.
