# Public listing media publication design

**Status: design only. No publication RPC, public media endpoint, or public listing image query is enabled by this document.**

## Security decision

Do not make the quarantine bucket public and do not copy approved images into a public bucket. Supabase public buckets bypass row-level authorization for object retrieval; hiding object keys from database queries is not an access-control boundary.

Serve published images through a same-origin application route backed by the private quarantine bucket. Every request must re-check current database state before returning bytes. This makes listing withdrawal and media unpublication effective without relying on object deletion or CDN invalidation.

## Current code status

A pure domain policy helper exists at `src/lib/listing-media-publication.mjs`, with tests covering active publisher claims plus current active database roles, owner independence, reason validation, approved-only publication, explicit publish/unpublish toggles, and the three-condition public-delivery gate. This helper is defense-in-depth only; it is not a database authorization boundary and is not wired to any public route.

The database publication RPC, publisher queue, public delivery route, and public listing projection are not implemented. Public images remain disabled.

## Required state model

Keep moderation and publication as separate decisions:

- Moderation: `pending` -> `approved` or `rejected`. Existing review is final; a new upload is required after rejection.
- Publication: `unpublished` -> `published` -> `unpublished`, only for approved media.
- A listing must independently be in `published` status at image-delivery time.
- Publishing a listing does not automatically publish its media.
- Approving media does not automatically publish it.
- Unpublishing a listing must immediately make all its media unavailable through the public route, even if their media publication flag remains published.
- Re-publishing a listing may restore delivery only for media that still has an explicit published media decision. A publisher can separately unpublish individual media.

## Publisher authorization and audit

A publication RPC must require an authenticated actor and an active `listing_publisher` or `administrator` database role. Do not trust role claims alone. Reviewer permissions must not imply publisher permissions.

Publishing requires a non-empty reason and records actor, timestamp, media ID, listing ID, and reason in the audit log. Unpublishing also requires a reason and records a distinct audit action. Both operations must be transactional with the audit event.

The publisher must not be the media owner. The publisher queue must exclude the actor's own uploads, just as the reviewer queue does. The database RPC—not only the UI—must enforce this independence rule.

## Public delivery endpoint

A public GET route may accept only a media UUID. It must:
1. Resolve the media row and its parent listing using a server-only Supabase secret.
2. Require media moderation status `approved` and publication status `published`.
3. Require parent listing status `published`.
4. Fetch the object only from the private quarantine bucket using the stored key.
5. Verify canonical WebP signature and a strict byte limit before responding.
6. Return only image bytes and a fixed `image/webp` content type; never return storage keys, database rows, signed URLs, or private metadata.
7. Use a conservative cache policy. Until a tested purge/invalidation design exists, use `private, no-store` so unpublish and listing withdrawal do not leave cached public copies.
8. Return the same not-found response for unknown, unapproved, unpublished, rejected, or withdrawn media to avoid state disclosure.

No public API may list arbitrary media IDs or expose quarantine metadata. Public listing queries should join only an explicit public projection of published media and only for currently published listings. Do not select `quarantine_storage_key`, owner IDs, reviewer IDs, audit data, or internal notes into browser-facing payloads.

## Required tests before implementation can be called complete

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
