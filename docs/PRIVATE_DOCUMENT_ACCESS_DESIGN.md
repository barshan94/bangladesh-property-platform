# Private document access design

**Status: design only. No download endpoint, signed URL flow, or live database change is enabled.** This document defines the conditions that must be met before quarantined evidence can leave private Storage.

## Non-negotiable release gate

A document is never retrievable unless its current database record is active and has `scan_status = 'clean'`, with a non-null scanner timestamp and scanner identity, and the bytes retrieved from private Storage match the recorded size and SHA-256 digest. `pending`, `infected`, `error`, missing scan metadata, scanner timeout, missing credentials, database errors, Storage errors, or integrity mismatch all deny access.

A byte-signature or structural parser check is not malware scanning. The current upload and HMAC callback code does not constitute an operational scanner. Until a real scanner is selected, configured, and verified, every uploaded document remains inaccessible.

## Authorization matrix

Authorization must be checked server-side against current database state on every request. Do not trust user-editable profile metadata, stale role claims alone, a document UUID, or a previously issued URL.

| Document purpose | Permitted actors |
| --- | --- |
| `listing_evidence` | The listing owner; an active `listing_reviewer`; an active `administrator` |
| `client_case` | The service-request owner; its currently assigned active `case_manager`; an active `intake_coordinator`; an active `administrator` |

A `case_manager` must be assigned to that exact service request. A revoked role, an unassigned case manager, a publisher-only role, or a role for a different listing/case does not grant access. Do not infer access from a public listing state. If a future operational role is needed, add it through an explicit reviewed migration and test.

## Required request sequence

1. Authenticate the caller with Supabase Auth `getClaims()`; reject missing or malformed subject IDs.
2. Call a narrowly scoped server-only database authorization operation. It must re-check the document, parent record, active role/assignment, deletion/retention state, and clean scan metadata using current database state. It may return only the minimum storage key, expected digest, byte size, and safe content type needed by the server.
3. Fetch bytes only from the private `private-evidence` bucket. Never create a public bucket or expose a Storage key, service key, or signed URL to the browser.
4. Enforce the recorded size and hard byte ceiling; recompute SHA-256 and compare in constant time. Any mismatch denies the response.
5. Record a `download` event with actor, document, purpose, and request ID through a server-only database operation. If the audit write fails, do not return the file.
6. Return bytes with `private, no-store`, `X-Content-Type-Options: nosniff`, a restrictive content security policy, and attachment disposition by default. Never reflect the original filename into a header without strict sanitization.
7. Use generic not-found responses for unauthorized, missing, deleted, unscanned, infected, and integrity-failed documents. Avoid revealing whether a document UUID exists.

## Required tests before enabling downloads

- Owner can download only their own document after a clean scan.
- Another owner is denied, including guessed UUIDs.
- Listing reviewer/admin access is limited to listing evidence and active roles.
- Case manager access requires current assignment to that exact case.
- Intake coordinator/admin access is limited to client-case records under the documented role policy.
- Revoked roles, stale JWT role claims, publisher-only roles, and unassigned case managers are denied.
- Pending, infected, error, missing scan metadata, expired retention, deleted rows, and scanner timeout are denied.
- Storage object missing, oversized, wrong size, wrong digest, database unavailable, and audit failure are fail-closed.
- Audit records contain no file bytes, storage keys, secrets, or unnecessary personal data.
- Browser clients cannot read metadata, audit rows, or Storage objects directly.
- No public/signed URL is emitted; responses are non-cacheable and safe for untrusted file types.

## Scanner integration prerequisites

Before the route can be enabled, document the scanner vendor/runtime, confidential-data processing and retention terms, data residency, network boundaries, authentication secret rotation, retry/idempotency behavior, timeout/failure handling, alerting, and operator ownership. Scanner results must bind to the exact uploaded SHA-256 digest and be authenticated using the existing HMAC callback contract. Public scanning sites and CI runners are not acceptable for private property or identity evidence.

## Current implementation boundary

The repository currently supports authenticated upload to private quarantine, hash metadata, an HMAC-authenticated scan-result callback primitive, and a stale-record recovery endpoint that marks timeouts as errors without deleting files. There is no operational scanner, no authorized download endpoint, no signed-URL flow, and no production document access. Keep this boundary until all gates above are implemented and verified.
