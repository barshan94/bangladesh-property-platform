# API Design (Conceptual)

**Status:** No API routes or persistence are implemented. This document defines intended boundaries, not existing endpoints.

## General contract
- Authenticate and authorize every protected operation on the server.
- Validate request and response schemas; reject unknown or disallowed fields.
- Use pagination with bounded page size and allowlisted sort/filter fields.
- Apply rate limits, abuse protection and idempotency to public submissions and critical mutations.
- Return stable error codes; do not leak stack traces, private record existence, storage keys or internal notes.
- Log sensitive actions without logging secrets or document contents.
- Public API responses must use explicit response DTOs, never serialize database rows directly.

## Public content
- GET /api/content?type=&language=&cursor= — published content only.
- GET /api/content/:slug — published item only.
- GET /api/services — approved public service descriptions.

## Property marketplace
- GET /api/listings — published listings only; allowlisted filters: district, upazila, property type, price range, area range and bedrooms.
- GET /api/listings/:publicReference — public fields and approved public media only.
- POST /api/listings/:publicReference/inquiries — rate-limited inquiry creation; never returns other inquiries.
- POST /api/listings/:publicReference/visit-requests — creates a request, not a confirmed appointment.
- POST /api/seller/listings — authenticated seller creates a draft.
- PATCH /api/seller/listings/:id — seller edits own draft only; material edits to submitted content create a revision and require re-review.
- POST /api/seller/listings/:id/submit — submits own draft for moderation. Client-supplied status is rejected.

## Moderation (staff-only)
- GET /api/admin/listing-reviews — assigned/policy-authorized review queue.
- POST /api/admin/listings/:id/decision — approve, request changes or reject with reason; validates reviewer permission and current state transactionally.
- POST /api/admin/listings/:id/publish — publish only an approved revision; records actor and event.
- POST /api/admin/listings/:id/withdraw — authorized withdrawal with reason.
- No public or seller endpoint may set approved/published/verified status.

## Service and case intake
- POST /api/service-requests — minimal initial intake, consent version, eligibility questions; no sensitive document upload through a general contact endpoint.
- GET /api/client/cases — own cases only.
- GET /api/client/cases/:reference — own case status and explicitly client-visible updates only.
- POST /api/client/cases/:reference/documents/upload-intents — authenticated, authorized, constrained upload intent after storage and security controls are implemented.
- Staff case assignment/status endpoints verify assignment and role on every request.

## Private upload lifecycle
1. Authorize requester and verify case/listing access.
2. Create a pending document record with a purpose-specific upload intent.
3. Issue a short-lived upload authorization for a private storage location.
4. Verify actual object size, MIME/signature, extension and malware scan status server-side.
5. Mark accepted only after checks; quarantine failures.
6. Issue short-lived download authorization only after a fresh authorization check.
7. Record access events and apply approved retention/deletion rules.

## Error semantics
Suggested stable codes: VALIDATION_ERROR, UNAUTHENTICATED, FORBIDDEN, NOT_FOUND, RATE_LIMITED, CONFLICT, INVALID_STATE_TRANSITION, UPLOAD_REJECTED, INTERNAL_ERROR.
Do not use error differences that reveal another client's private record.

## Required tests
- Anonymous user cannot read unpublished listings or private evidence.
- Seller cannot edit another seller's listing or set review/publication status.
- Reviewer cannot access unrelated confidential legal cases by default.
- Client cannot read another client's inquiry, case or document.
- Invalid and concurrent state transitions are rejected without partial writes.
- Search filters cannot bypass published-only visibility.
- Upload/download authorization expires and cannot be reused outside its scope.


## Implemented domain policy (not an API)

The repository now contains `src/lib/listing-lifecycle.mjs` and TypeScript declarations. It encodes the allowed status-transition matrix and narrow role permissions for sellers, listing reviewers and listing publishers. The administrator role has no implicit lifecycle bypass. Automated Node.js tests cover the state matrix and role boundaries.

This module is not an authorization system by itself. A future API must authenticate the actor, derive role/assignment from trusted server-side data, load the current status from the database, validate the transition, and persist the state update plus append-only event atomically. Never trust a client-supplied role or current status.


## Seller draft validation (implemented domain utility; no endpoint)

`src/lib/listing-validation.mjs` exports `validateListingDraft(input)`. It treats the request body as untrusted and returns either normalized seller-editable data or field-level error codes. It enforces:
- Required bounded text fields and allowlisted property/listing types.
- A finite positive BDT amount (the currency is server-defined, not seller-supplied).
- Complete area value/unit/basis groups when area is provided.
- Non-negative integer bedroom/bathroom counts.
- A bounded image list with descriptive alt text and HTTPS or same-origin-relative image paths only.
- A strict seller-field allowlist; status, IDs, references, trust labels, publication timestamps and other server-managed fields are rejected.

Automated tests cover invalid input shapes, unsafe prices and image URLs, unknown/server-managed fields, control characters, and input immutability. This utility does not authenticate the seller, authorize ownership, scan uploaded files, establish image rights, persist drafts, or moderate/title-verify a property. Those checks remain mandatory at the eventual server/API and operational layers.


## Public service inquiry validation (implemented domain utility; no endpoint)

`src/lib/inquiry-validation.mjs` exports `validateInquiry(input)` for a deliberately minimal, non-confidential initial inquiry. It validates contact name/email, optional phone/country/property district, an allowlisted service code, a bounded plain-text summary and affirmative consent. Email is normalized to lowercase.

The input allowlist explicitly rejects unexpected fields, including attachments, identity numbers, deed contents and administrative fields. The public inquiry path must not be used to transmit confidential documents or sensitive identity information.

This is validation only. It does not send, save, email, assign, or acknowledge an inquiry; does not provide rate limiting, spam protection, CAPTCHA, consent-record persistence or a privacy retention workflow. Those controls must exist in a real server endpoint before this is advertised as a live contact channel. Keep service codes synchronized with `src/data/services.ts` and test that mapping when service content changes.
