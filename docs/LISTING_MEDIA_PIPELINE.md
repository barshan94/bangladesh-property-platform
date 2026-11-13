# Property listing image intake and processing

**Status: implemented in source; not deployed or enabled against live Supabase.**

## Intake boundary

POST /api/listing-media accepts one multipart image and a listing UUID. It requires:
- Same-origin request matching NEXT_PUBLIC_SITE_URL.
- Cookie-authenticated user session.
- Server-only SUPABASE_SECRET_KEY using the Supabase secret-key format.
- Ownership of the listing and status draft or changes_requested.
- Request body capped at 4 MiB plus a bounded multipart envelope; per-owner limit of 10 attempts per hour.
- Maximum eight pending media records per listing. The insert trigger locks the listing row before counting pending rows, preventing concurrent requests from reserving the same final slot.

## Image processing

sharp is a direct production dependency pinned at 0.35.5 and represented in the npm lockfile. The processor:
- Decodes actual raster content; accepts JPEG, PNG and WebP only.
- Limits source width/height to 8,192 and total pixels to 24 million.
- Rejects malformed decode, unsupported formats and multi-page/animated input.
- Applies EXIF orientation and resizes within 2,560 × 2,560 without enlargement.
- Re-encodes every accepted image to WebP at quality 82.
- Does not preserve EXIF, XMP, IPTC or ICC metadata.
- Caps canonical output at 8 MiB and hashes the exact bytes stored.

The original upload is never stored. A random owner/listing-scoped key is generated server-side. The metadata row is reserved before storage upload; storage or audit failure triggers best-effort removal of both the object and row. The endpoint returns only a media ID and pending status, never a storage key, signed URL or public URL.

## Database controls

The listing-media-quarantine bucket is private and has no browser Storage policies. The listing_media table has no browser grants. Insert validation enforces owner/listing binding, editable listing state and the serialized pending quota. A private database rate-limit ledger and service-role-only RPC throttle upload attempts. Reviewer decisions remain a separate authenticated RPC with reason and audit event.

## Release boundary

The intake route and its migrations are committed source only. They have not been applied to the live Supabase project and the route has not been tested on a selected production host. Do not accept real customer uploads until migration review/application, host runtime verification, scanner integration, reviewer UI, retention/deletion behavior and operational recovery are complete.

No malware scanner is connected. No public bucket, publisher-controlled promotion or public image query exists. Public listing pages must continue to return an empty image list. Never place pending or approved-but-not-published media in a public bucket: public buckets expose objects independently of listing-table RLS.

## Required remaining tests

- Real metadata-bearing JPEG/PNG/WebP samples; verify orientation and metadata stripping.
- Truncated, malformed, signature-prefixed payloads and polyglots.
- Extreme aspect ratios, dimension/pixel bombs, memory/CPU exhaustion and animation rejection.
- Storage failure, DB insert failure, audit failure, cleanup failure and concurrent quota attempts.
- Cross-owner listing IDs, non-editable listings, missing auth, cross-origin requests and spoofed MIME/filename.
- Production-host native binary compatibility and memory/time limits.
