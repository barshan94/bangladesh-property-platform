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

## Private document intake — 2026-11-13

The repository includes:
- A tested byte-signature detector for PDF, JPEG and PNG. It identifies file families from bytes; it is not a complete parser or malware scanner.
- An authenticated, same-origin `POST /api/private-documents` route. It checks the caller's session, verifies ownership of the associated listing or service request through trusted database reads, and limits each file to 15 MiB.
- An atomic per-owner PostgreSQL reservation that serializes concurrent uploads and rejects a sixth pending document. The reservation inserts metadata in the same transaction as the quota check; a failed Storage upload attempts to release that reservation. This closes the original concurrent-count race, but broader request-rate controls and stale-reservation recovery are still outstanding.
- A content-length guard when the ingress supplies that header. The route still parses multipart form data before checking the parsed file size; configure and verify a platform-level request-body limit before deployment.
- Random non-user-controlled Storage object keys under a quarantine prefix, server-detected MIME metadata, SHA-256 digest metadata, and an append-only upload access event.
- Cleanup attempts if metadata or audit persistence fails after the object has been stored.

The endpoint uses `SUPABASE_SECRET_KEY` only on the server. It does not grant browser Storage access and returns no signed URL. Every accepted document remains in `scan_status = pending`; it is not downloadable.

**Important limitations:** a magic-byte match does not prove that a file is benign or structurally valid. No malware scanning service, scanner callback/signature verification, quarantine retry/cleanup worker, download authorization, short-lived signed URL or download audit route exists yet. The route has not been live-tested against deployed Supabase Auth and Storage. The atomic quota RPC is in migration `20261113140000_atomic_private_document_quota.sql`; this migration passed isolated local replay but has not been applied to the live project. Keep the route disabled from real customer workflows until the migration is deliberately applied, live integration tests pass, broader abuse limits and platform request-size limits are completed.
