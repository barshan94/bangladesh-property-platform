# Roadmap

## Implemented foundation and seller marketplace
- [x] Create a separate Supabase Free project in the MRA account and ap-south-1 region; preserve the existing MRA project.
- [x] Create 11 core PostgreSQL tables and enable RLS on all application tables.
- [x] Restrict anonymous listing reads to published listings and seller writes to their own eligible drafts.
- [x] Keep exact property location, evidence metadata, inquiries, service requests, consent and audit data outside public client access.
- [x] Retain private-evidence schema as dormant infrastructure only; confidential document exchange is excluded from the MVP and all related API routes are disabled.
- [x] Generate and commit Supabase TypeScript database types and initial schema migrations.
- [x] Implement Next.js 15 Supabase SSR/browser clients, cookie refresh middleware and environment validation. Middleware refresh now preserves existing response headers and cookies when rebuilding forwarded request state; a regression test covers this behavior.
- [x] Implement email/password sign-up, sign-in, confirmation callback, password reset/update, sign-out and protected account dashboard.
- [x] Implement authenticated seller draft creation, database-generated public references, atomic initial status events and seller-owned listing views.
- [x] Enforce listing lifecycle transitions in PostgreSQL, including seller submission, reviewer decisions, publisher-only publication, atomic status history and audit events.
- [x] Connect the homepage featured-property preview, public catalogue and detail pages to the same published-only database listing projection; the homepage shows at most three real published listings and has explicit empty/error states.\n- [x] Implement seller-supplied private map coordinates and a published-only public map projection rounded to 2 decimal places; render approximate OpenStreetMap pins and nearby mapped landmarks on property detail pages. Exact coordinates remain private; listings without coordinates simply omit the map.
- [x] Add seller listing validation and automated domain tests.
- [x] Add a passing CI workflow for dependency audit, domain tests, TypeScript, ESLint and production build.
- [x] Commit `package-lock.json` and enforce reproducible CI installation with `npm ci`.

## Staff moderation and access control
- [x] Add a claims-gated reviewer queue for submitted and in-review listings.
- [x] Add reviewer actions to start review, request changes, approve or reject with a mandatory reason, using the database transition RPC.
- [x] Implement a JWT-verified Supabase Edge Function for audited staff role provisioning/revocation, including restricted first-admin bootstrap logic (deployment and bootstrap configuration still required).
- [x] Implement a publisher-only queue for approved listings with reasoned publication through the database lifecycle RPC.
- [x] Add database-backed service-request assignment, active-role checks, role-specific status transitions, and append-only status/audit events.
- [x] Enforce assignment-based staff reads for case managers and active-role validation for intake/admin access.
- [x] Run a transactional live RLS probe for request owners, two separately assigned case managers, intake coordinators and revoked case managers; synthetic users, roles, requests and history rows are rolled back.
- [x] Run a transactional live RPC authorization probe for intake assignment, assigned case-manager progress, cross-case-manager denial, assignment denial, administrator transition denial and revoked-role denial; verify matching history/audit records and roll back all synthetic data.
- [x] Validate the real Supabase Auth JWT/RLS integration probe in CI for anonymous, seller, reviewer, publisher and administrator roles, including seller ownership, role-table own-row visibility/cross-user isolation, revoked-role handling and reviewer/publisher lifecycle actions. Database policy workflow #25 passed after correcting the test to match the intended own-role visibility policy.
- [x] Pass automated browser end-to-end authentication tests against a local isolated Supabase stack: protected dashboard redirect, real sign-in, authenticated dashboard access and sign-out. Browser workflow #2 passed on Ubuntu 24.04. Follow with deployed HTTPS smoke tests once deployment is authorized.
- [x] Run the guarded, manual Supabase CLI migration-history reconciliation workflow; verified all nine repository migrations are recorded in the dedicated remote project (workflow run 43383757509).
- [x] Historical baseline: the initial isolated local Supabase replay passed all thirteen migrations and five SQL probes, along with real Supabase Auth JWT/RLS integration. This was superseded by the later 21-migration replay recorded below; it is not evidence that the latest commits have passed CI.
- [x] Capture a read-only live Supabase security, performance and health advisor baseline; security and health returned no findings (performance notices documented).
- [x] Perform read-only remote migration-history comparison: the dedicated remote project records migrations 1–9; repository migrations 10–21 (12 migrations) are pending. This comparison made no remote schema changes.
- [x] Replay all 21 committed migrations in an isolated local Supabase stack and pass the database policy probes, including private documents, listing-media intake/review, Knowledge Hub and real Auth JWT/RLS integration. Migrations 10–21 remain unapplied remotely; remote schema drift and production apply remain unverified. No remote schema changes were made.
- [x] Replace direct cross-table role checks in listing RLS policies with a private SECURITY DEFINER helper that requires the caller's authenticated user ID, an allowed `app_metadata.roles` claim and a current non-revoked role row; keep direct client access to `user_roles` denied. (Local migration replay and real-JWT CI validation passed in database workflow #25.)

## Client operations and property evidence
- [x] Implement public inquiry persistence, atomic consent/audit records, PostgreSQL rate limiting, and a public contact form connected to the API. (Private deployment secrets and live smoke test remain pending.)
- [x] Implement authenticated service-request creation and owner/staff read boundaries, atomic consent/audit records, and per-user rate limiting. (Private deployment secret and live authenticated smoke test remain pending.)
- [x] Add a role-gated staff service-request queue with intake/admin assignment, case-manager assignment-scoped handling, reasoned status updates and recent status history. (Named-staff assignment is implemented; notifications and live JWT tests remain pending.)
- [x] Enforce private-document parent ownership again at the `private_documents` table boundary with a trigger that locks the parent listing/service-request row during insert or reassignment; SQL probes reject direct cross-owner inserts and attempts to change document ownership/parent association. (Isolated migration replay and all database authorization probes passed on `dbbca433f255015b21a40ac5853de1e3984ab195`.)
- [x] Previously implemented and tested the quarantine intake foundation, then disabled the upload endpoint for the submitted MVP because no complete scanner/download pipeline is deployed. No customer evidence is accepted in this release.
- [x] Replace the race-prone pending-file count check with an atomic per-owner database reservation enforcing the five-pending-file quota; failed Storage writes release the reservation. CI now exercises five successful reservations, sixth-file denial and server-only RPC grants.
- [x] Add atomic per-owner upload throttling (10 attempts/hour) before multipart parsing, with a 429 response and Retry-After; cap the HTTP intake at 4 MiB per file plus bounded multipart overhead to stay below the Vercel function request-body ceiling. CI tests server-only grants, rejection of the 11th attempt, and real ReadableStream behavior at the byte limit, above the limit and on stream failure.
- [ ] Verify the deployed hosting platform's actual request-body limit and operational behavior before enabling customer uploads.
- [x] Add a server-only, SHA-256-bound, one-way scan-completion RPC with atomic scan audit; CI verifies client roles cannot call it, digest mismatches are rejected, and successful results are recorded.
- [x] Disable the scanner callback endpoint (HTTP 410); the earlier HMAC callback primitive is retained only as dormant future-phase code history.
- [x] Disable the stale-quarantine recovery endpoint (HTTP 410) because confidential intake is excluded and no active quarantine jobs should be created.
- [x] Document the fail-closed private-document access policy, authorization matrix, audit requirements and scanner prerequisites in `docs/PRIVATE_DOCUMENT_ACCESS_DESIGN.md`. Design only; no download endpoint is enabled.
- [x] Explicitly exclude confidential document exchange from the submitted MVP. A complete worker, authorized downloads and retention controls are deferred to a separately scoped future release; do not accept confidential evidence in this MVP.
- [x] Add bounded structural sanity checks for PDF trailers, PNG chunk ordering/CRC/IHDR/IEND and JPEG frame/scan markers; reject oversized image dimensions/pixel counts and cover simple appended-payload fixtures. JPEG intake is deliberately restricted to 8-bit baseline sequential (SOF0), one complete-component scan, baseline spectral parameters and a narrow entropy subset (stuffed bytes and restart markers only). Regression tests reject progressive/unsupported coding modes, non-8-bit precision and invalid scan parameters. All three CI workflows passed on commit `5422cb9b7607615280bd06b20866970709da4a53` (CI, isolated database migration/policy probes, and browser-auth E2E). This is structural screening only—not a complete parser, comprehensive polyglot defense or malware scan.
- [ ] Add full document parser validation and live end-to-end upload tests.
- [x] Restrict both public listing queries to an explicit public-field projection; add regression coverage that rejects wildcard selects and private-evidence fields.
- [x] Add a private listing-media quarantine bucket and server-only metadata table with owner/listing binding, bounded image types and size, immutable source metadata, and a reviewer/admin-only reasoned moderation RPC with audit logging. Browser Storage access remains disabled.
- [x] Add direct locked `sharp` dependency and server-side listing image intake: bounded body, authenticated owner/editable-listing checks, rate limit, serialized pending quota, decoded JPEG/PNG/WebP validation, canonical WebP re-encoding, metadata stripping, SHA-256 and private quarantine storage. See `docs/LISTING_MEDIA_PIPELINE.md`. Add real Sharp processor integration tests using a metadata-bearing JPEG fixture; verify bounded WebP output, metadata removal, SVG/corrupt/oversized input rejection and filename sanitization. All three CI workflows passed on commit `91d359b384dee8c07c11618f608afafdce06bbfd` (CI run 43604252147, database policy run 43604252157, browser-auth E2E run 43604252145).
- [x] Add a reviewer-only pending queue, audited private WebP preview endpoint and reason-required approve/reject controls. The queue projection never exposes Storage keys.
- [x] Add deterministic resource-exhaustion bounds for document inspection: enforce the same 4 MiB byte ceiling as the upload route and cap JPEG marker processing at 8,192 markers, with exact-boundary and over-limit regression fixtures. These are bounded structural checks, not full parser validation.
- [x] Keep confidential document exchange excluded from the MVP; any future scanner implementation requires a separately approved scope and deployed acceptance.
- [x] Add a pure, tested domain policy for publisher/admin media publish/unpublish decisions, active-role intersection, owner independence, mandatory reasons and the three-condition public-delivery gate. This is not an authorization boundary and is not wired to the database or public routes.
- [x] Implement publisher-controlled publication state and audit RPCs for approved media, with publisher/admin authorization and owner-independence checks. The publisher queue, reason-required publish/unpublish action, row-locked database transition, and atomic audit events are implemented in source on draft PR #1. The separate public media delivery route and explicit public listing image projection are also implemented and covered by source-level tests and the isolated migration/SQL probe workflow. They are not live until the pending migrations are deliberately applied and the deployed runtime is verified; keep public listing images empty on the live site until those gates pass. See `docs/PUBLIC_LISTING_MEDIA_PUBLICATION_DESIGN.md`.
- [x] Implement and test the public listing-media delivery route and explicit public image projection. Re-check approved media publication and parent listing publication on every request, serve only bounded canonical WebP bytes from private quarantine with `private, no-store`, and return no storage metadata or signed URLs. (Source implementation, isolated migration replay, SQL projection probe, domain tests, TypeScript, lint, production build and browser-auth E2E passed on draft PR #1. Remote migration application and deployed-host verification remain blocked.)
- [x] Add a code-only knowledge-content editorial database foundation for articles/videos: published-only browser reads, no browser writes, content-editor submission, administrator review/publication, author self-review denial and audited transitions. The authenticated CMS workspace and public Knowledge Hub routes are implemented. The public renderer supports a safe Markdown subset and allowlisted video embeds; reviewed production content and runtime/database verification remain outstanding. See `docs/KNOWLEDGE_CONTENT_WORKFLOW.md` and `docs/KNOWLEDGE_CONTENT_CMS.md`.

## Production readiness — not yet achieved
- [ ] Configure production Auth redirect URLs, email provider/templates, CAPTCHA and test flows against a real mailbox and HTTPS domain.
- [ ] Confirm Data API exposure settings and test access boundaries on deployed endpoints.
- [x] Generate and commit a reproducible dependency lockfile.
- [ ] Complete accessibility, browser/device, security and penetration testing.
- [ ] Complete Bangladesh legal/privacy review and assign an operational owner.
- [x] Document Free-plan backup limitations and a local-only database-plus-Storage backup/restore runbook; actual encrypted off-site exports, Storage object export, restore rehearsal, RTO/RPO and operator assignment remain outstanding.
- [ ] Configure free-tier-compatible deployment/domain, monitoring, alerting, retention, backup and restore drill.
- [ ] Verify business identity, contact channels, legal credentials and real property inventory before public launch.

The repository has a working foundation, authentication flow, seller draft/submission workflow, published-only catalogue, inquiry and service-request intake. Confidential document exchange is excluded from the MVP and its upload, callback and recovery routes return HTTP 410. A passing CI build does not prove live email delivery, staff authorization setup, document safety, legal compliance, populated inventory, configured server secrets or deployed runtime behavior.


Listing-media intake, reviewer moderation, publisher-controlled publication, and fail-closed public media delivery are implemented in source and CI-gated on draft PR #1. They remain unavailable on the live site until the code-only migrations are deliberately applied through the approved process and deployment runtime is verified. The reviewer queue and audited private preview UI are implemented in source. Public images remain disabled on the live site. Confidential document exchange is an explicit MVP exclusion, not a delivered capability.


The editorial, CMS and public-read-boundary migrations are code-only and have not been applied remotely. The CMS and public Knowledge Hub routes are committed but remain unavailable until the migrations are applied through the approved process. The public renderer supports a safe Markdown subset and allowlisted video embeds; no reviewed production content has been supplied.


The CMS workspace is available at `/dashboard/content`; public Knowledge Hub listing and detail routes are available in source at `/knowledge` and `/knowledge/[slug]`. The code-only migrations must be applied through the approved process before either workflow can run against the live database. The renderer supports a limited safe Markdown subset and allowlisted video embeds. Reviewed production content and runtime verification remain outstanding.


## Latest verification — 2026-11-14
- [x] Strengthen PDF structural screening: a classic cross-reference table must contain a valid subsection header, at least one well-formed entry and a trailer; an xref-stream path must contain an indirect object dictionary with `/Type /XRef`, `/Size`, `/W` and a stream body. This remains bounded structural screening, not full PDF parsing, polyglot defense or malware scanning. Commit: `18b50bea8156e39b99218202510bada7110e2ab2`.
- [x] Replace the obsolete fake PDF used by browser authentication E2E with a generated minimal classic-xref PDF whose `startxref` points to the actual xref byte offset. The stricter application validator was not weakened. Commit: `fdba6a4545117f14ba031587f243fd2042e64eeb`.
- [x] Verify all three workflows on `fdba6a4545117f14ba031587f243fd2042e64eeb`: CI run `43613248418`, browser authentication E2E run `43613248405`, and database policy tests run `43613248400` — all completed successfully.

## Latest verification — 2026-11-15
- [x] Re-run all three required workflows on commit `79aa9b60d2d61668974f72a2b2268f098c82571c`: CI run `43625119349`, database policy run `43625119287`, and browser-auth E2E run `43625119320` — all completed successfully.
- [x] Additional PDF xref-stream hardening: reject duplicate structural dictionary keys (`/Length`, `/Type`, `/Size`, `/W`) and unsafe integer dimensions, with regression fixtures. Commit: `2c1be62d8c0ed106d744b2046b40d78338b3842e`.

- [x] Verify all three required workflows on exact current branch head `2c1be62d8c0ed106d744b2046b40d78338b3842e`: CI run `43665042360`, database policy run `43665042272`, and browser authentication E2E run `43665042359` — all completed successfully.


## Latest verification — 2026-11-15 (continued)
- [x] Complete the client-facing handoff README and `docs/CLIENT_HANDOFF.md`, separating delivered source capabilities from client/operator production acceptance. Commit: `9f4f8d6093fce1cded7fcc90b0cb38ed8af8bd6f`; CI run `43671783334`, database policy run `43671783349`, and browser-auth E2E run `43671783370` — all completed successfully.
- [x] Correct privacy disclosures to reflect implemented inquiry, account, service-request and private-document code paths, while explicitly stating that deployment is unverified and confidential-document intake is not approved for customer files. Commit: `3dab8f6cee3973d963f6af6a7ab6f86e617a6530`; CI run `43677458839`, database policy run `43677458596`, and browser-auth E2E run `43677458615` — all completed successfully.


- [x] Harden document inspection against oversized direct inputs and JPEG marker-storm CPU exhaustion; add 4 MiB and 8,192-marker boundary tests. Commit and current workflow verification will be recorded after CI completes.


- [x] On commit `361149a59781fdcc7e2066e5f7da00cc14a90f71`, enforce the 4 MiB document-inspection input ceiling and 8,192-marker JPEG processing budget; exact-boundary and over-limit regression tests pass. CI run `43678342722`, database policy run `43678342730`, and browser-auth E2E run `43678342783` — all completed successfully.

- [x] Tighten the bounded JPEG baseline subset to require restart markers to cycle in RST0–RST7 order; add accepted ordered and rejected out-of-order/skipped-marker fixtures. Implementation and regression tests are committed on the draft PR; latest workflow verification is pending.


## Latest verification — 2026-11-15 (document intake hardening)
- [x] Verify the current document-intake hardening commit `54e211a29423d3eb9d86e1bf7e99c05e2b6cfba8`: CI run #824, database policy run #215, and browser-auth E2E run #212 all completed successfully. The test updates align overflow-safe byte-limit assertions with the implementation and make the stream-failure fixture deterministic.
- [x] Defer all scanner/OCR worker implementation and explicitly exclude confidential document exchange from the MVP. The previously discussed ClamAV/qpdf/Poppler/Tesseract stack is a future option only, not an approved deployed service.


## Confidential document exchange MVP exclusion — 2026-11-15

- [x] Select a no-per-file-fee, self-hosted open-source stack: ClamAV for malware scanning, qpdf for PDF structural validation, Poppler pdftotext for text extraction, and Tesseract 5 for local OCR. No external AI/OCR or commercial scanning API is approved.
- [ ] Implement the isolated worker container, atomic job claim/lease, bounded processing, signature freshness checks, digest-bound callback, retry/idempotency and operational health reporting.
- [ ] Provide and verify an always-on client/operator-controlled worker host. The software is free; reliable compute, storage and operations are not guaranteed free.
- [ ] Implement full authorization-bound download, audit-before-response, safe quarantine cleanup and retention controls only after the worker and database transitions are verified.
- [ ] Keep real confidential-document intake and all downloads disabled until a deployed end-to-end scan, failure-injection, authorization and recovery acceptance run passes.

The MVP makes no claim to support document exchange. The upload, callback and recovery routes are disabled with HTTP 410. Future implementation requires a separate scope, operator-controlled host, legal/privacy review and complete deployed security acceptance.
