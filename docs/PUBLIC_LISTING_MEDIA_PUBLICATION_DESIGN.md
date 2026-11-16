# Public listing media publication design

**Status: publisher decision workflow and fail-closed public image delivery implemented in source on draft PR #1; CI, isolated migration replay, SQL policy probes, TypeScript, lint, production build and browser-auth E2E passed on commit `5ea18a20`. Remote migration application and production release remain blocked.**

## Security decision

Do not make the quarantine bucket public and do not copy approved images into a public bucket. Supabase public buckets bypass row-level authorization for object retrieval; hiding object keys from database queries is not an access-control boundary.

The publisher workflow now provides a second, explicit decision after moderation. It does not return image bytes or make a Storage object public. Public delivery remains a separate milestone and must re-check current database state on every request.

## Implemented in source

- `listing_media.publication_status` defaults to `unpublished`; moderation and publication remain separate.
- A database RPC requires an authenticated actor with both an allowed JWT role claim and a current non-revoked `listing_publisher` or `administrator` database role.
- The publisher cannot publish their own upload. The database RPC locks the media row, accepts only approved media, requires a reason, and records publish/unpublish audit events in the same transaction.
- The trigger keeps source metadata and moderation evidence immutable while permitting only valid publication transitions after approval.
- A publisher queue excludes the actor's own uploads and omits Storage keys, hashes, reviewer identities and internal metadata.
- A server action validates form cardinality, UUID, decision and reason before calling the database RPC.
- The dashboard exposes the publisher queue to publisher and administrator claims.

## Public delivery endpoint — implemented in source

- `GET /api/public/listing-media/:mediaId` accepts only a UUID and uses the server-only `SUPABASE_SECRET_KEY` to read records and download bytes from the private quarantine bucket.
- Every request re-checks `moderation_status = approved`, `publication_status = published`, and the parent listing's current `status = published`. Previously published image IDs stop working immediately when either state changes.
- The route enforces the recorded 8 MiB maximum, checks the RIFF/WEBP signature and SHA-256 digest, and returns only bytes with a fixed `image/webp` content type.
- Unknown, unapproved, unpublished, rejected, withdrawn, or integrity-failing media return a generic not-found response. Backend configuration/storage failures return a generic unavailable response.
- Responses use `private, no-store`; no signed URLs, public bucket, or browser Storage policy are created.
- `list_public_listing_media(text[])` is a narrow public SQL projection that returns only listing references and media UUIDs. It filters both publication decisions and the current listing status, limits results to 12 images per listing, and never returns Storage keys, hashes, owner IDs or review metadata.
- The catalogue and detail-page data loaders consume this projection. Property detail pages now render approved published images.

No public API lists arbitrary private metadata or exposes quarantine keys. The media UUID is a locator only, not authorization: the byte route rechecks all three state conditions on every request.

## Required tests before public delivery

- Only active publisher/admin can publish or unpublish; reviewer-only, revoked, unauthenticated and ordinary users are denied.
- Media owner cannot publish their own upload; own uploads are absent from publisher queue.
- Pending/rejected media cannot be published.
- Missing/short/control-character reasons are rejected.
- Publish/unpublish and audit event are atomic.
- Concurrent publish/unpublish attempts produce one valid final state and complete audit history.
- Public delivery denies pending, approved-but-unpublished, rejected, unpublished, missing and listing-withdrawn media.
- Listing withdrawal blocks delivery immediately; re-publication does not publish media that was explicitly unpublished.
- Public query projection never contains storage keys or private ownership/review fields.
- Malformed stored bytes and oversized objects are rejected.
- No signed URL, public bucket, browser Storage policy, or cacheable response is introduced.
- Isolated migration replay, SQL privilege probes, API/domain tests, TypeScript, lint, production build and browser tests pass.

## Release gates outside this milestone

Even after publication code and isolated tests pass, customer-facing image delivery remains blocked until the migration is reviewed and deliberately applied to the dedicated remote Supabase project, production host behavior is verified, malware scanning and retention/recovery are implemented, and production smoke/security tests pass. No remote migration apply or deployment is authorized by this design document.
