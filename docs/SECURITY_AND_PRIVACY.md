# Security and Privacy Requirements

## Data classification
- **Public:** published listings, public service descriptions, articles, public contact channels.
- **Internal:** operational notes, unpublished content, staff procedures.
- **Confidential:** client inquiries, case notes, seller evidence, ownership documents, identity documents, inspection reports.
- **Restricted secrets:** passwords, tokens, private keys, signing keys, recovery codes.

## Mandatory controls
- TLS for data in transit and provider-supported encryption at rest.
- A private-evidence bucket/schema exists as dormant infrastructure only; confidential document exchange is excluded from the MVP and no customer documents are accepted.
- Short-lived, scoped download links after server-side authorization.
- MFA for privileged staff; strong password/session controls.
- Role- and assignment-based access, deny by default.
- Audit logs for access, upload, download, sharing, role changes, exports, and deletion.
- File type/size validation, malware scanning where feasible, safe storage names, and download headers.
- Rate limiting, input validation, CSRF protections where applicable, secure cookies, and abuse monitoring.
- Secrets stored in managed environment configuration, never in Git.
- Data minimization, retention schedule, secure deletion, and client request handling.
- Backups encrypted and access-controlled; restore tests recorded.
- Incident response, breach assessment, notification, and credential rotation procedure.

## Cross-border considerations
Overseas clients may access their own case information from abroad. Hosting location, vendor subprocessors, cross-border transfer, and applicable legal obligations must be reviewed before choosing providers.

## Development rules
Use synthetic data only. Redact logs. Do not attach client documents to GitHub issues or pull requests. Keep public property media separate from the dormant private-evidence infrastructure; do not use it for customer files in this MVP.

## Property listing media

The repository now defines a separate `listing-media-quarantine` bucket (private, 8 MiB cap, JPEG/PNG/WebP allowlist) and a `listing_media` metadata table. Browser roles have no table grants or Storage policies for this bucket. Server-created metadata is bound to the listing owner and an editable draft/changes-requested listing; quarantine object keys are namespaced by owner and listing.

A same-origin, cookie-authenticated POST /api/listing-media route now accepts bounded JPEG/PNG/WebP input only for an owner’s editable listing. It enforces a per-owner database rate limit and a serialized maximum of eight pending images per listing. sharp decodes the image under pixel/dimension limits, rejects multi-page inputs, applies orientation, re-encodes canonical WebP and strips source metadata by not preserving metadata. Only canonical bytes are written to the private quarantine bucket; originals, signed URLs and public URLs are never returned. Metadata and an audit event are persisted, with best-effort rollback of the object and row on partial failure.

The intake, review, publisher decision and public delivery routes are implemented in source. The reviewer-only queue and private preview endpoint verify both the session role claim and an active database role, serve only pending canonical WebP from private Storage, reject requests by the media owner, disable caching, and record preview access in the audit log. Publisher-controlled publication is a separate reason-required database transition with owner-independence checks, row locking and atomic audit events. The public delivery route re-checks approved/published media and the parent listing's published status on every request, then serves only bounded canonical WebP bytes from private quarantine without exposing Storage keys or signed URLs. The public listing projection exposes only the public media reference and media ID. These migrations remain unapplied to the live Supabase project, and the deployed runtime has not been verified; therefore this workflow is implemented in source but is not live. Do not enable public image delivery until the migrations are reviewed and deliberately applied and the deployed host is verified. No malware scanner is deployed for private evidence documents; that is a separate quarantine-only workflow. Never place unreviewed objects in a public bucket; public buckets expose objects independently of listing-table RLS.

## Dependency security gate
- Pin the framework and runtime React packages to reviewed patch releases; update Next.js, React and react-dom together when React Server Components advisories affect the supported framework line.
- CI runs `npm audit --audit-level=high` after dependency installation and must fail on high or critical advisories. Do not use `npm audit fix --force` as an automatic response; review dependency paths and compatibility first.
- `package-lock.json` is committed and CI uses `npm ci` for reproducible installs. CI also runs `npm audit --audit-level=high`, tests, TypeScript, ESLint and a production build.

## Public inquiry abuse controls

The application now includes `POST /api/inquiries`, connected to the public contact form. The endpoint:
- Enforces the 8 KiB request-body ceiling for public inquiries and authenticated service requests while streaming (including requests without `Content-Length`) before JSON parsing, then validates explicit field allowlists.
- Derives a rate-limit key by HMAC-SHA256 hashing the trusted hosting-platform client-IP header; raw IP values are not persisted by the rate-limit implementation.
- Enforces a PostgreSQL fixed-window limit of 5 requests per 15 minutes using an atomic database operation.
- Returns a bounded 429 response with a `Retry-After` header when the limit is reached, and fails closed if rate-limit identity or storage is unavailable.
- Prunes up to 100 rate-limit keys older than two days on each rate-limit operation; the cleanup column is indexed. Two days exceeds the function's maximum supported 24-hour rate window. This is opportunistic cleanup, not a scheduled deletion guarantee—if submissions stop, stale rows remain until the next request.
- Requires server-only Supabase and HMAC secrets; no privileged key is committed to the repository or exposed to browser code.

This is implemented application logic, not proof of live deployment configuration. Private deployment secrets and a live smoke test remain outstanding. CAPTCHA/bot detection, abuse alerting, and a legally reviewed retention policy for rate-limit records are still pending. Confirm that the hosting platform supplies the expected trusted client-IP header before enabling public production traffic; do not substitute a client-controlled header.

## Consent evidence requirements

The public inquiry API requires affirmative consent and selects the notice version on the server (`inquiry-v1`). The database RPC writes the inquiry, consent provenance and audit event in one transaction. The browser cannot choose the authoritative notice version or consent timestamp.

This does not complete the broader privacy lifecycle. The approved notice text/version archive, proof of notice display, consent withdrawal workflow, retention enforcement and handling of data-subject requests still require legal/privacy review and implementation. Do not collect live inquiries until the notice wording and purposes have been approved for the actual service.

## Baseline browser security headers

The Next.js application applies a shared, tested baseline to all routes: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, a restrictive Permissions-Policy for unused device capabilities, and Cross-Origin-Opener-Policy. The policy is centralized in `src/lib/security-headers.mjs` and tested. Content Security Policy is intentionally deferred until all script/style, image, video, map and integration origins are inventoried and a report-only policy can be tested. HSTS is deployment-specific and must be enabled only after the production HTTPS/domain setup is confirmed. Reassess COOP if future authentication or payment flows rely on cross-origin popups.

## Listing staff-role authorization — 2026-11-13

Listing RLS policies verify staff access with both the signed `app_metadata.roles` claim and a current, non-revoked row in `public.user_roles`. The lookup runs through `private.has_active_listing_staff_role(text)`, a narrowly scoped SECURITY DEFINER function in the non-exposed schema. It requires a non-null `auth.uid()`, accepts only reviewer/publisher/administrator role codes, and checks the caller's own active role row. Execution is granted only to the API roles needed by listing policies; direct client SELECT access to `user_roles` remains denied. This avoids granting anonymous users table access merely to let the public published-listing policy evaluate.

Migration `20261113170000_active_listing_role_policy_helper.sql` is a local migration source and must pass isolated replay and authorization probes before any remote application. The real Supabase Auth JWT integration test now covers anonymous published/unpublished visibility, seller ownership, denied direct role-table access, seller transition denial, reviewer approval and publisher publication. A passing local test does not replace deployed browser E2E verification.

## Confidential document exchange — MVP exclusion

Confidential document exchange is explicitly excluded from this MVP. The upload, scanner callback and recovery API routes return HTTP 410 before reading request bodies, accessing secrets, or contacting Supabase/Storage. This release does not accept, store, scan, OCR, process or serve identity documents, title deeds, ownership evidence, inspection reports or client-case attachments.

Do not send confidential evidence through public inquiries, service-request text fields, email or improvised channels. Service requests are for non-confidential request details only. The private-evidence bucket, document tables, migrations, inspection helpers and access-design notes are dormant future-phase foundations; they are not an active customer feature.

A future release must separately implement and deploy the isolated malware/parser/OCR worker, digest-bound job lifecycle, authorization-bound download, audit-before-response, retention/deletion, and operational monitoring. It also requires legal/privacy review and deployed end-to-end security acceptance. Until then, keep document exchange excluded.

## Listing-media upload gate — 2026-11-13

The repository now includes `sharp` as a direct locked production dependency and implements the listing-media upload route, bounded decoding, canonical WebP re-encoding, metadata stripping, SHA-256 recording, private quarantine storage, and reviewer-only moderation preview. The original filename is reduced to a bounded display name with path separators and C0/C1/DEL controls removed. This code remains unapplied to the live Supabase project. The implementation and malformed/polyglot fixture requirements are in `docs/LISTING_MEDIA_PIPELINE.md`. Public listing pages must continue to return no images; no public bucket or publisher-controlled promotion path is enabled.


## Editorial knowledge content

The code-only `knowledge_content` migration introduces an article/video workflow with published-only browser reads, no browser writes, content-editor submission, administrator review/publication, author self-review denial and audit events. The authenticated CMS workspace and public `/knowledge` listing and `/knowledge/[slug]` detail routes are implemented in source. The public renderer uses a limited Markdown subset, does not render raw HTML, permits only validated HTTPS links, and constructs video embeds from an allowlisted provider and validated video ID. The editorial migrations remain unapplied to the remote database, so the CMS and public content routes are not live against production data. Do not bypass the published status boundary or populate the site with unreviewed content. See `docs/KNOWLEDGE_CONTENT_WORKFLOW.md`.


## Knowledge Hub CMS workspace

The authenticated `/dashboard/content` workspace calls dedicated RPCs for listing and saving drafts and uses the audited status-transition RPC for submission, review and publication. RPCs re-check active roles server-side; editor reads are scoped to their own records and administrators can review the queue. The browser receives no direct access to the underlying content table. The workspace does not render Markdown or expose article bodies publicly. The relevant migrations remain code-only until applied through the approved migration process.


## Public Knowledge Hub rendering boundary

The public-read migration for editorial content changes published_knowledge_content to security_invoker=true, adds an RLS SELECT policy requiring status = 'published', and grants only selected public columns to anon and authenticated. The published article body is intentionally included in this restricted projection because it is public content; internal source notes, review notes, reviewer identity and author ownership are not granted. The source includes public Knowledge Hub listing/detail routes and a renderer that does not use dangerouslySetInnerHTML or interpret raw HTML. It supports a limited Markdown subset and only clickable HTTPS links. Video embed URLs are constructed from a provider allowlist and validated video IDs, with iframe sandbox and referrer policy. The migrations are committed but not applied to the live database; no production runtime claim is made.
