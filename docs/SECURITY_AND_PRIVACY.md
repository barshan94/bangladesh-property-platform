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

The repository includes a pure fixed-window rate-limit decision utility with tests. It is not enforcement: no API endpoint, identity derivation, counter store, atomic increment, CAPTCHA, bot detection or monitoring exists yet. Before public inquiries go live, select a shared store and implement atomic server-side enforcement, privacy-minimal key derivation, bounded 429/Retry-After responses, abuse monitoring and a documented retention period for rate-limit records. Never trust a client-supplied rate-limit key or use a non-atomic read/check/write sequence.

## Consent evidence requirements

A boolean form value alone is not an adequate audit record. The repository now includes a pure consent-record builder that requires affirmative consent, a server-selected notice version and a server-generated canonical UTC timestamp. It fixes the purpose and channel and rejects client-controlled metadata. This is a domain utility only: no notice publication/version archive, proof of display, identity binding, persistence, withdrawal workflow or retention enforcement exists. Before live inquiry collection, legal/privacy review must approve the notice wording and purpose; the server must persist the exact notice version/content reference with the inquiry in one transaction and define how consent withdrawal and retention are handled. Do not treat a client-provided timestamp or notice version as authoritative.

## Baseline browser security headers

The Next.js application applies a shared, tested baseline to all routes: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, a restrictive Permissions-Policy for unused device capabilities, and Cross-Origin-Opener-Policy. The policy is centralized in `src/lib/security-headers.mjs` and tested. Content Security Policy is intentionally deferred until all script/style, image, video, map and integration origins are inventoried and a report-only policy can be tested. HSTS is deployment-specific and must be enabled only after the production HTTPS/domain setup is confirmed. Reassess COOP if future authentication or payment flows rely on cross-origin popups.

## Private document intake policy — 2026-11-12

The repository now includes a tested pure policy utility, `src/lib/private-document-policy.mjs`, with TypeScript declarations. It accepts only the `listing_evidence` and `client_case` purposes, PDF/JPEG/PNG MIME types, and files from 1 byte through 15 MiB. A clean scan state passes policy; pending or errored scans remain quarantined; an infected scan or unsupported/oversized input is rejected.

**This is not a secure upload pipeline.** The utility does not inspect file bytes, authenticate users, scan malware, write to private storage, authorize downloads, issue signed URLs, or persist audit events. MIME type and scan state must come from trusted server-side inspection/scanning—not the browser. Until those controls exist, do not accept confidential evidence through a public form or describe documents as securely uploaded.
