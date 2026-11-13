# Bangladesh Property Platform

A Bangladesh-focused property marketplace and property-assistance platform for local clients and overseas Bangladeshis. The product scope includes sale, rent and lease listings, client inquiries, authenticated service requests, and staff-managed listing and case workflows.

> **Current status: functional foundation, not production-ready.** The repository contains a working Next.js application and a dedicated Supabase backend. Passing CI verifies code quality and build output; it does not prove that production hosting, email delivery, staff onboarding, legal review, document intake or real-world operations are ready.

## Implemented

- Next.js 15 / React 19 / TypeScript application with Supabase SSR authentication.
- Email/password signup, sign-in, password recovery, callback handling and protected dashboard routes.
- Seller-owned listing drafts and submission for review.
- Database-enforced listing lifecycle, reviewer queue and separate publisher approval.
- Public catalogue and property detail pages that read **published listings only**. The live inventory is currently empty; no demo listings or testimonials are fabricated.
- Public inquiry form and API with server-side validation, consent/audit recording and atomic PostgreSQL rate limiting.
- Authenticated service-request creation, requester-owned history, and a role/assignment-gated staff queue with status history.
- Staff-role management Edge Function with restricted first-administrator bootstrap logic.
- Private evidence Storage bucket configured without client upload/download access.
- Transactional live database probes for service-request RLS and staff RPC authorization.
- CI checks for dependency audit, domain tests, TypeScript, ESLint and production build.

## Important limitations

- **No production website/domain is deployed or verified.**
- No Auth users or staff roles have been provisioned in the dedicated project; first-administrator bootstrap remains an operator task.
- Supabase migration-history reconciliation is prepared as a manual workflow but has not yet been run.
- Public inquiry and authenticated service-request APIs still need production secrets and live end-to-end smoke tests.
- No confidential document upload/download is enabled. The current file policy is only a validation utility; it does not inspect bytes, scan malware, store files, authorize downloads or issue signed URLs.
- Public listing inventory and approved listing-image workflow are not populated.
- Email delivery, CAPTCHA/bot protection, monitoring/alerting, retention enforcement, backup/restore drill and full browser/device/accessibility testing remain outstanding.
- Bangladesh legal/privacy review, real operator identity, service credentials and operational support arrangements must be confirmed before launch.

## Safety and trust

- A published listing is not proof of ownership, title clearance, legal verification, physical inspection or guaranteed property condition.
- Moderation approval is not legal advice or a guarantee that a transaction is safe.
- Foreign nationality alone does not establish eligibility to own property in Bangladesh. Eligibility depends on the person's status and transaction and must be confirmed by qualified Bangladesh counsel.
- Never send confidential ownership, identity or case documents through public contact forms. The platform must not accept such evidence until a fully server-authorized, inspected and audited private-document pipeline is implemented.
- Use synthetic data for development and tests. Never commit secrets or client documents.

## Project documentation

- [Roadmap and completion gates](ROADMAP.md)
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
