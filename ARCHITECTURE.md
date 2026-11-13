# Architecture

## Current status

The application is a Next.js modular monolith backed by a dedicated Supabase PostgreSQL 17 project. The repository contains a functional foundation and substantial marketplace, inquiry, service-request, moderation and private-document quarantine workflows. It is **not production-ready**: the remote database has unapplied migrations, production hosting and email are not verified, no malware scanner is deployed, and legal/operational readiness is incomplete.

## Selected infrastructure

- Web: Next.js 15, React 19, TypeScript.
- Backend: dedicated Supabase Free project, region `ap-south-1`.
- Database: PostgreSQL 17 with versioned SQL migrations, RLS and server-only RPCs.
- Storage: private `private-evidence` and `listing-media-quarantine` buckets. Browser access is disabled; accepted files remain quarantined until their respective workflows permit access.
- CI: GitHub Actions with reproducible `npm ci`, dependency audit, domain tests, TypeScript, ESLint, production build, local Supabase migration replay and authorization probes.
- No paid service or paid add-on is assumed by the current architecture.

## Logical components

### Public corporate website
- Company and service information, educational content, FAQs, video content, contact and consultation entry points.
- A code-only editorial database foundation supports article/video drafts, administrator review/publication and published-only browser reads. CMS UI, sanitized Markdown rendering, safe video embeds and reviewed content remain incomplete; do not imply that unreviewed content or property claims are verified.

### Property marketplace
- Public catalogue and detail pages expose published listings only.
- Sellers can create and submit their own drafts.
- Reviewer and publisher queues enforce separate review and publication decisions through database lifecycle functions.
- Public inventory and approved listing-image publication are not populated/complete.

### Client workspace
- Supabase SSR authentication and protected dashboard routes.
- Authenticated users can view their own listing and service-request records.
- Service-request creation is implemented with consent/audit persistence and per-user rate limiting.
- Secure evidence download and full case-document access are deliberately disabled.

### Operations and staff workspace
- Reviewer and publisher listing queues.
- Staff service-request queue with role- and assignment-gated reads and status transitions.
- Audited staff-role provisioning/revocation Edge Function with guarded first-administrator bootstrap.
- Initial staff provisioning and production operator onboarding remain manual operational tasks.

### Application/API layer
- Next.js route handlers enforce authentication, validation, ownership checks, rate limiting and server-side authorization.
- Public inquiry intake persists consent and audit records and uses atomic database rate limiting.
- Private document intake uses same-origin cookie authentication, parent ownership checks, a bounded streaming request-body reader, file-signature identification, SHA-256 metadata, atomic pending-slot reservation and upload audit.
- Listing image intake uses direct locked sharp, bounded JPEG/PNG/WebP decoding, canonical WebP re-encoding, metadata stripping, per-owner rate limiting, a serialized pending quota, private quarantine storage and audit logging. Reviewer previews are served through a role-checked, no-store endpoint and audited on access.
- A signed scanner-result callback and stale-quarantine recovery route exist, but no actual scanner is deployed. Quarantined evidence is not downloadable.

### Data and storage
- PostgreSQL tables cover profiles, staff roles, property listings, private property details, listing-media moderation, private-document metadata, inquiries, service requests, editorial knowledge content, consent and audit records.
- RLS is enabled for application tables. Privileged workflows use narrowly scoped server-side functions and service credentials.
- Private Storage objects use non-user-controlled quarantine keys. No public bucket or browser download policy is enabled.

## Trust boundaries

1. **Anonymous visitor:** published listing data and approved public content only; public inquiry submission is rate-limited and consent-gated.
2. **Authenticated client:** own profile, own listing records, own service requests and permitted client actions.
3. **Staff:** active trusted roles plus workflow-specific permissions; case-manager access is assignment-scoped.
4. **Privileged server:** performs sensitive inquiry, service-request, moderation, document metadata, audit and Storage operations. Secret keys must never enter browser bundles.
5. **Private object storage:** deny-by-default to browsers. Pending evidence remains quarantined and cannot be downloaded.
6. **External vendors:** no scanner, email, SMS/WhatsApp, maps/geocoding or analytics vendor is considered production-approved until privacy, cost, data location and operational controls are reviewed.

## Security requirements

- Keep RLS enabled on every application table and test it using real Supabase Auth JWTs.
- Use signed `app_metadata` claims and current non-revoked database role rows for staff authorization; never trust editable `user_metadata`.
- Never expose Supabase secret/service credentials in frontend bundles.
- Keep public listing fields separate from exact property location and confidential evidence.
- Enforce server-side validation, rate limiting, idempotency where required and audit logging for sensitive workflows.
- Treat file magic-byte detection as format-family identification only, not structural validation or malware scanning.
- Keep all documents quarantined until a separately operated, maintained scanner has independently verified the exact object digest and returned an authenticated result.
- Do not issue signed download URLs until scoped authorization, expiry, download audit and retention controls are implemented.
- Do not modify Supabase-managed `storage` schema directly.

## Implementation and operational gates

1. **Database and authorization:** initial schema, RLS, private bucket and generated types are implemented. Repository migrations 10–21 have passed isolated local replay and policy probes but remain pending on the dedicated remote database; do not claim remote schema parity.
2. **Authentication and roles:** email/password flows and protected routes are implemented. Production redirect URLs, email provider/templates, first-admin bootstrap and staff onboarding remain outstanding.
3. **Marketplace and moderation:** seller draft/submission, reviewer decisions, publisher-only publication and published-only public queries are implemented. Real inventory and approved public media remain outstanding.
4. **Client operations:** public inquiry and authenticated service-request flows are implemented in code. Production secrets, consent/legal approval and deployed HTTPS smoke tests remain outstanding.
5. **Private evidence:** bounded quarantine intake, quota/rate controls, digest-bound callback and stale-record recovery are implemented in code. No malware scanner is deployed; uploads must remain disabled for real customer evidence. Hosting request-body limits, remote migrations, full format validation, cleanup, secure downloads and live tests remain outstanding.
6. **Production operations:** hosting/domain, email, monitoring/alerts, retention, encrypted backups and restore rehearsal, security/accessibility/device testing, legal/privacy review and named operational ownership remain outstanding.

## Production safety statement

A successful CI build is not proof of production readiness. Do not launch customer-facing document intake or claim legal/title verification, safe ownership, verified listings or guaranteed transaction outcomes. Qualified Bangladesh counsel must review eligibility, service scope, privacy notices, cross-border processing and marketing claims. See `ROADMAP.md`, `docs/SECURITY_AND_PRIVACY.md`, `docs/DEPLOYMENT.md` and `docs/BANGLADESH_LEGAL_COMPLIANCE.md` for the current release gates.


## Editorial content

The code-only editorial migrations provide an audited article/video lifecycle. Browser roles can read only published rows and selected public columns; they cannot write content. Active content editors can submit drafts; administrators review, approve/reject and publish; authors cannot review their own work. The public renderer supports a safe Markdown subset and allowlisted video embeds. The migrations remain unapplied remotely. See `docs/KNOWLEDGE_CONTENT_WORKFLOW.md`.


## Knowledge Hub CMS workspace

Authenticated users with the active `content_editor` role and administrators can access `/dashboard/content`. Draft listing/saving and status transitions call dedicated security-definer RPCs that re-check active database role records and JWT role claims. The browser receives no direct write grant on the content table. Public reads are limited by column grants and an RLS policy to published records only. Editors see only their own records; administrators see the editorial queue. The workspace requires the code-only editorial migrations to be applied; it does not apply migrations or deploy the site.


## Public Knowledge Hub rendering

The public /knowledge index and /knowledge/[slug] detail route read from published_knowledge_content only. The public-read-boundary migration switches the view to security_invoker=true, applies an RLS policy restricted to status = 'published', and grants only the specific public columns (including article Markdown) to anon/authenticated roles. Internal source notes, review notes, reviewer identity and author ownership remain unavailable. The visible reviewed_at timestamp is included as editorial provenance. Article Markdown is rendered as React text/elements through a limited safe subset renderer; raw HTML is not interpreted. Video embeds are generated from allowlisted providers and validated opaque IDs, never arbitrary URLs. These routes remain unavailable until the code-only migrations are applied through the approved process.


## Listing media intake and moderation

Seller uploads are accepted only for an authenticated owner's draft or changes-requested listing. The server decodes JPEG/PNG/WebP using the direct locked sharp dependency, rejects unsupported or multi-page content, applies orientation, re-encodes to metadata-stripped WebP, hashes the exact stored bytes and writes only to the private quarantine bucket. Database rate limiting and a listing-row lock enforce per-owner and per-listing pending quotas.

Reviewers and administrators receive a pending-only queue that excludes their own uploads. Storage keys are not included in the queue response. A separate server route verifies both signed role claims and an active database role before streaming a pending image; every preview is audited and marked no-store. Approve/reject actions require a reason, and the database prevents an owner from reviewing their own upload.

The listing-media intake, review queue and moderation migrations are code-only and have not been applied to the live Supabase project. There is no malware scanner, public bucket, publisher-controlled public promotion or public listing-image query. Public listing pages must continue to return no images. See `docs/LISTING_MEDIA_PIPELINE.md`.
