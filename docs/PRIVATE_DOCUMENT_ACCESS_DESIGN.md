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


## Selected free architecture — 2026-11-15

**Decision:** use a self-hosted, open-source worker. Do not send private evidence to a paid scanning API or cloud OCR/AI provider.

- **Malware scanning:** ClamAV (clamd) with regularly refreshed official signature databases. A missing, stale, unhealthy or unavailable scanner is a hard failure; it must never be interpreted as clean.
- **PDF validation:** qpdf --check in a resource-limited, non-root worker container. Existing upload signature checks remain only an early bounded filter, not a replacement for this parser.
- **Text extraction:** Poppler pdftotext for PDFs and local metadata extraction for supported images.
- **OCR:** Tesseract 5 with locally installed language packs. OCR is document text extraction only; it is not an LLM, legal review, ownership verification or automated trust decision.
- **Image handling:** use Tesseract for OCR and a maintained image decoder in the isolated worker; reject malformed, oversized, unsupported or resource-exhausting files.

### Processing sequence

1. Claim a pending document through an atomic, lease-based database operation. Never let two workers process the same job concurrently.
2. Download the object from the private private-evidence bucket using a server-only credential; verify stored size and SHA-256 against the database row before scanning.
3. Run ClamAV first. FOUND marks the file infected; scanner error, timeout, unavailable daemon or stale signatures marks processing as error. No error path may produce clean.
4. For a malware-free file, run the appropriate parser/decoder and OCR in a no-network, non-root, resource-limited container. Reject parser warnings, malformed structures, excessive pages/pixels, timeouts and output-limit violations.
5. Bind every result to the original document ID, storage key, byte size and SHA-256. Submit the result through the existing timestamped HMAC callback; callback idempotency and replay protection remain mandatory.
6. Only a digest-matched clean result can satisfy the access design's authorization preconditions. Authorized downloads, audit-before-response, short-lived server-mediated access and retention cleanup must be implemented separately before any download is enabled.

### Free-tier and operations boundary

The worker software has no per-document licence/API charge, but it requires continuously available CPU, memory, disk for temporary files and network access to Supabase. Do not rely on ephemeral serverless functions, free CI runners, public scanning websites or an uncommitted free-tier promise for production processing. Run it on a client/operator-controlled always-on host or an explicitly approved host with adequate resources. If no such host is available, keep confidential evidence intake disabled; do not downgrade to an untrusted public scanner.

No provider or worker host is deployed by this repository decision. ClamAV/Tesseract are selected as the free software stack, not represented as operationally installed or production-tested.
