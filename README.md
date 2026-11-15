# Bangladesh Property Platform

A Bangladesh-focused property marketplace and property-assistance platform for local clients and overseas Bangladeshis. The product scope includes sale, rent and lease listings, client inquiries, authenticated service requests, and staff-managed listing and case workflows.

> **Current status: implemented application foundation and draft client handoff; not yet deployed.** The repository contains a working Next.js application, a dedicated Supabase backend, seller/reviewer/publisher workflows, a Knowledge Hub CMS, and automated CI/browser/database tests. Passing CI verifies the tested code paths; it does not configure a production environment or approve live customer data processing.

## Implemented application

- Next.js 15 / React 19 / TypeScript application with Supabase SSR authentication.
- Email/password signup, sign-in, password recovery, callback handling and protected dashboard routes.
- Seller-owned listing drafts and submission for review.
- Database-enforced listing lifecycle, reviewer queue and separate publisher approval.
- Public catalogue and property detail pages that read **published listings only**, with approximate OpenStreetMap pins and nearby mapped landmarks when sellers supply private coordinates. Public pins are rounded to 2 decimal places; exact coordinates are never exposed. The live inventory is currently empty; no demo listings or testimonials are fabricated.
- Public inquiry form and API with server-side validation, consent/audit recording and atomic PostgreSQL rate limiting.
- Authenticated service-request creation, requester-owned history, and a role/assignment-gated staff queue with status history.
- Staff-role management Edge Function with restricted first-administrator bootstrap logic.
- Private evidence Storage bucket configured without client upload/download access.
- Authenticated seller listing-image intake with canonical WebP re-encoding, private quarantine, rate/quota limits, reviewer-only previews and audited review decisions.
- Publisher-controlled listing-media publication/unpublication with reason-required actions, owner-independence checks, row-locked database transitions and atomic audit events.
- Public listing-media delivery from private quarantine; each request rechecks media approval/publication and parent-listing publication, returns canonical WebP only, and does not expose Storage keys or signed URLs.
- Knowledge Hub article/video CMS with editor drafts, administrator approval/publication and published-only public routes. Editorial migrations remain code-only on the dedicated remote database.
- Confidential document exchange is explicitly excluded from the submitted MVP; upload, scan-callback and recovery endpoints are disabled (HTTP 410). No confidential files are accepted, processed or downloadable.
- Automated unit/domain tests, isolated Supabase migration/policy tests, browser authentication E2E, TypeScript, lint and production build.

## Important delivery boundaries

- **No production website/domain is deployed or verified.**
- The dedicated remote Supabase project records migrations 1–9; migrations 10–21 remain unapplied pending schema-drift review, a verified recovery plan and explicit authorization.
- No Auth users or staff roles have been provisioned in the dedicated project; first-administrator bootstrap remains an operator task.
- Public inquiry and authenticated service-request APIs still need production secrets and live end-to-end smoke tests.
- **Confidential document exchange is excluded from this MVP.** Upload, scanner-callback and recovery endpoints are disabled (HTTP 410); do not submit confidential files.
- Previous PDF/JPEG/PNG inspection and quarantine code is dormant and not exposed as an MVP capability.
- Public listing-media publication and the privacy-preserving map projection are implemented in source but cannot be used live until their pending migrations are deliberately applied and the deployed runtime is verified. Listings without seller-supplied map coordinates will not show a pin.
- The Knowledge Hub CMS and public routes are implemented in source, but editorial migrations are not applied remotely and reviewed production content has not been supplied.
- Production Auth/email/CAPTCHA setup, deployed endpoint checks, monitoring/alerting, retention enforcement, backup/restore drill and broader accessibility/browser/device/security testing remain launch activities.
- Bangladesh legal/privacy review, real operator identity, service credentials, verified property inventory and operational support arrangements must be confirmed before launch.

## Safety and trust

- A published listing is not proof of ownership, title clearance, legal verification, physical inspection or guaranteed property condition.
- Moderation approval is not legal advice or a guarantee that a transaction is safe.
- Foreign nationality alone does not establish eligibility to own property in Bangladesh. Eligibility depends on the person's status and transaction and must be confirmed by qualified Bangladesh counsel.
- Confidential ownership, identity and case documents are not accepted by this MVP. Public contact forms and service-request text fields are not secure document channels.
- Use synthetic data for development and tests. Never commit secrets or client documents.

## Project documentation

- [Roadmap and completion gates](ROADMAP.md)
- [Client handoff and acceptance checklist](docs/CLIENT_HANDOFF.md)
- [Evidence-based production release gates](docs/PRODUCTION_RELEASE_GATES.md)
- [Project definition](PROJECT.md)
- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Architecture](ARCHITECTURE.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [Authentication](docs/AUTHENTICATION.md)
- [Staff role management and first-admin bootstrap](docs/STAFF_ROLE_MANAGEMENT.md)
- [Listing lifecycle](docs/PROPERTY_LISTING_LIFECYCLE.md)
- [Service-request workflow](docs/SERVICE_REQUEST_WORKFLOW.md)
- [Security and privacy](docs/SECURITY_AND_PRIVACY.md)
- [Database migration reconciliation](docs/DATABASE_MIGRATION_RECONCILIATION.md)
- [Deployment requirements](docs/DEPLOYMENT.md)
- [Backup and recovery](docs/BACKUP_AND_RECOVERY.md)
- [Bangladesh legal compliance review](docs/BANGLADESH_LEGAL_COMPLIANCE.md)
- [Listing media intake and publication](docs/LISTING_MEDIA_PIPELINE.md)
- [Knowledge Hub editorial workflow](docs/KNOWLEDGE_CONTENT_WORKFLOW.md)

## Development

Requirements: Node.js 20+ and npm.

```bash
npm ci
cp .env.example .env.local
npm run test
npm run typecheck
npm run lint
npm run build
npm run dev
```

Use only the dedicated development Supabase project and synthetic records. A reviewed `package-lock.json` is committed. CI uses `npm ci` so installs are reproducible; update the lockfile in the same commit whenever dependencies change.

## License

No open-source license has been selected. Unless a license is added, all rights are reserved by the repository owner.
