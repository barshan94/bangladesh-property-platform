# Public listing media publication design

**Status: publisher decision workflow implemented in source and under CI verification. Public media delivery remains disabled.**

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

## Public delivery endpoint — not implemented

A public GET route may accept only a media UUID. It must:
1. Resolve the media row and parent listing using a server-only Supabase secret.
2. Require media moderation status `approved` and publication status `published`.
3. Require parent listing status `published`.
4. Fetch the object only from the private quarantine bucket using the stored key.
5. Verify canonical WebP signature and a strict byte limit before responding.
6. Return only image bytes and a fixed `image/webp` content type; never return storage keys, database rows, signed URLs, or private metadata.
7. Use `private, no-store` until a tested purge/invalidation design exists.
8. Return the same not-found response for unknown, unapproved, unpublished, rejected, or withdrawn media.

No public API may list arbitrary media IDs or expose quarantine metadata. Public listing queries must join only an explicit public projection of published media and only for currently published listings.

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
