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
- The repository currently has no committed lockfile. This means dependency resolution can vary between installs; add and commit a reviewed npm lockfile before production release, then switch CI from `npm install` to `npm ci`.

## Public inquiry abuse controls

The application now includes `POST /api/inquiries`, connected to the public contact form. The endpoint:
- Rejects request bodies larger than 8 KiB and validates an explicit field allowlist.
- Derives a rate-limit key by HMAC-SHA256 hashing the trusted hosting-platform client-IP header; raw IP values are not persisted by the rate-limit implementation.
- Enforces a PostgreSQL fixed-window limit of 5 requests per 15 minutes using an atomic database operation.
- Returns a bounded 429 response with a `Retry-After` header when the limit is reached, and fails closed if rate-limit identity or storage is unavailable.
- Requires server-only Supabase and HMAC secrets; no privileged key is committed to the repository or exposed to browser code.

This is implemented application logic, not proof of live deployment configuration. Private deployment secrets and a live smoke test remain outstanding. CAPTCHA/bot detection, abuse alerting, and a reviewed retention policy for rate-limit records are not yet implemented. Confirm that the hosting platform supplies the expected trusted client-IP header before enabling public production traffic; do not substitute a client-controlled header.

## Consent evidence requirements

The public inquiry API requires affirmative consent and selects the notice version on the server (`inquiry-v1`). The database RPC writes the inquiry, consent provenance and audit event in one transaction. The browser cannot choose the authoritative notice version or consent timestamp.

This does not complete the broader privacy lifecycle. The approved notice text/version archive, proof of notice display, consent withdrawal workflow, retention enforcement and handling of data-subject requests still require legal/privacy review and implementation. Do not collect live inquiries until the notice wording and purposes have been approved for the actual service.

## Baseline browser security headers

The Next.js application applies a shared, tested baseline to all routes: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, a restrictive Permissions-Policy for unused device capabilities, and Cross-Origin-Opener-Policy. The policy is centralized in `src/lib/security-headers.mjs` and tested. Content Security Policy is intentionally deferred until all script/style, image, video, map and integration origins are inventoried and a report-only policy can be tested. HSTS is deployment-specific and must be enabled only after the production HTTPS/domain setup is confirmed. Reassess COOP if future authentication or payment flows rely on cross-origin popups.

## Private document intake policy — 2026-11-12

The repository includes a tested pure policy utility, `src/lib/private-document-policy.mjs`, with TypeScript declarations. It accepts only the `listing_evidence` and `client_case` purposes, PDF/JPEG/PNG MIME types, and files from 1 byte through 15 MiB. A clean scan state passes policy; pending or errored scans remain quarantined; an infected scan or unsupported/oversized input is rejected.

**This is not a secure upload pipeline.** The utility does not inspect file bytes, authenticate users, scan malware, write to private storage, authorize downloads, issue signed URLs, or persist audit events. MIME type and scan state must come from trusted server-side inspection/scanning—not the browser. The private Storage bucket currently has no client upload/download access. Until the full server-authorized pipeline exists, do not accept confidential evidence through a public form or describe documents as securely uploaded.
