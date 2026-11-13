# Security and Privacy Requirements

## Data classification
- **Public:** published listings, public service descriptions, articles, public contact channels.
- **Internal:** operational notes, unpublished content, staff procedures.
- **Confidential:** client inquiries, case notes, seller evidence, ownership documents, identity documents, inspection reports.
- **Restricted secrets:** passwords, tokens, private keys, signing keys, recovery codes.

## Mandatory controls
- TLS for data in transit and provider-supported encryption at rest.
- Private object storage for confidential documents; no public bucket or permanent public URL.
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
Use synthetic data only. Redact logs. Do not attach client documents to GitHub issues or pull requests. Keep public property media separate from private evidence.

## Dependency security gate
- Pin the framework and runtime React packages to reviewed patch releases; update Next.js, React and react-dom together when React Server Components advisories affect the supported framework line.
- CI runs `npm audit --audit-level=high` after dependency installation and must fail on high or critical advisories. Do not use `npm audit fix --force` as an automatic response; review dependency paths and compatibility first.
- `package-lock.json` is committed and CI uses `npm ci` for reproducible installs. CI also runs `npm audit --audit-level=high`, tests, TypeScript, ESLint and a production build.

## Public inquiry abuse controls

The application now includes `POST /api/inquiries`, connected to the public contact form. The endpoint:
- Rejects request bodies larger than 8 KiB and validates an explicit field allowlist.
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

## Private document intake — 2026-11-13

The repository includes:
- A tested byte-signature detector for PDF, JPEG and PNG. It identifies file families from bytes; it is not a complete parser or malware scanner.
- An authenticated, same-origin `POST /api/private-documents` route. It checks the caller's session, verifies ownership of the associated listing or service request through trusted database reads, and limits each file to 4 MiB at the HTTP route (the private Storage bucket itself permits up to 15 MiB).
- An atomic per-owner PostgreSQL reservation that serializes concurrent uploads and rejects a sixth pending document. The reservation inserts metadata in the same transaction as the quota check; a failed Storage upload attempts to release that reservation. This closes the original concurrent-count race, but per-owner upload throttling now allows 10 attempts per hour and runs before multipart parsing; the stale-quarantine recovery endpoint marks old pending scans as failed, releasing their pending quota, while retaining the original object for manual review.
- A request-body cap enforced while streaming the raw multipart body (4 MiB file ceiling plus 128 KiB bounded multipart overhead), even when `Content-Length` is absent; only the bounded buffer is passed to multipart parsing. The route separately validates the parsed file size. Configure and verify the hosting platform's own request-body limit and memory behavior before deployment.
- Random non-user-controlled Storage object keys under a quarantine prefix, server-detected MIME metadata, SHA-256 digest metadata, and an append-only upload access event.
- Cleanup attempts if metadata or audit persistence fails after the object has been stored.

The endpoint uses `SUPABASE_SECRET_KEY` only on the server. It does not grant browser Storage access and returns no signed URL. Every accepted document remains in `scan_status = pending`; it is not downloadable. A new server-only database RPC can record a one-way scan result only when the supplied SHA-256 matches the stored object metadata, and writes the scan audit event in the same transaction. CI checks client-role denial, digest mismatch rejection, state transition and audit persistence. This RPC does not scan files and must only be called by a future backend that has independently authenticated a real scanner's result.

**Important limitations:** a magic-byte match does not prove that a file is benign or structurally valid. The repository now includes an HMAC-authenticated scanner callback and a cron-secret-protected stale-record recovery route, but no malware-scanning service is deployed or connected. The callback authenticates the sender and binds a result to the stored SHA-256; it cannot prove that the sender actually scanned the file. Only a separately operated scanner that retrieves the exact quarantined object, computes and verifies its digest, scans it with a maintained engine/signature database, and signs the result may call this endpoint. Never expose the callback secret to browsers or allow ordinary application routes to invoke the scan-completion RPC. Quarantine object cleanup, download authorization, short-lived signed URLs and download audit remain unimplemented. The route has not been live-tested against deployed Supabase Auth and Storage. The atomic quota RPC is in migration `20261113140000_atomic_private_document_quota.sql`; this migration passed isolated local replay but has not been applied to the live project. Keep the route disabled from real customer workflows until the atomic quota, scan-transition and upload-rate migrations are deliberately applied, live integration tests pass, and the deployed hosting request-size limit is verified. The route conservatively caps files at 4 MiB plus 128 KiB multipart overhead to fit below Vercel's 4.5 MiB function request-body ceiling; the Storage bucket's 15 MiB cap is not the route's effective limit.


## Malware-scanner deployment decision — 2026-11-13

The application has a signed result-ingestion endpoint, not a scanner. No free scanner has been approved for confidential customer evidence. Public multi-tenant file-scanning APIs are not acceptable by default because they may retain, inspect, share or otherwise process uploaded identity/title documents under terms that are unsuitable for confidential records. An ephemeral CI runner is also not an approved production scanner because it would move client evidence into a source-control/CI vendor's processing environment without a reviewed data-processing and retention design.

A production scanner must:
1. Run in an isolated service with private network access to the quarantine bucket and least-privilege read access to only the object being scanned.
2. Stream the object, enforce size/time limits, compute SHA-256 independently, and compare it with the immutable upload metadata.
3. Use a maintained malware engine and signature database; record engine/version and scan timestamp.
4. Treat timeouts, unsupported formats, encrypted/password-protected files, parser failures and scanner outages as **not clean**. Keep the object quarantined.
5. Send only a digest-bound result through the HMAC callback, with a unique request ID and short timestamp window.
6. Have independent secret rotation, replay protection, health monitoring and a documented incident/recovery process.
7. Be covered by provider, data-location, retention and cross-border privacy review before processing real client documents.

The current Free-tier-only constraint does not establish that a suitable always-on scanning service is available. Supabase Edge Functions are not a substitute for a maintained ClamAV daemon, and a public file-scanning API must not be used for confidential documents without explicit legal, contractual and security approval. Therefore the safe default is **fail closed**: no scanner means no clean status and no downloads. Do not enable document intake for real customer data until the scanner and its operational controls are approved and tested.


## Document structure checks — 2026-11-13

The upload detector now goes beyond leading-byte signatures:
- PDF candidates must contain a PDF header within the first 1,024 bytes and a trailing `startxref`/ `%%EOF` sequence whose offset is within the file.
- PNG candidates must contain a first-position IHDR with valid basic dimensions/encoding fields, valid CRCs for every chunk, at least one IDAT, and a final empty IEND with no trailing bytes.
- JPEG candidates must contain a bounded SOF frame segment with non-zero dimensions, an SOS segment, and an EOI marker.

These checks reject several malformed or signature-only inputs, but they are deliberately described as **structural sanity checks**, not complete PDF/image parsers. They do not establish that a file is safe, renderable, non-polyglot, or free of parser exploits. They do not replace maintained format parsers, malware scanning, sandboxing or human review. Documents remain quarantined and inaccessible for download regardless of these checks.
