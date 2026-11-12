# Project Memory and Decision Log

This file is the durable project context. Keep decisions concise, dated, and evidence-based. Do not store credentials, personal identity documents, or confidential client details here.

## Current project snapshot
- Repository: bangladesh-property-platform.
- Product: Bangladesh-focused real estate marketplace plus property legal/verification and remote property assistance.
- Primary audience: local clients and overseas people with property interests in Bangladesh.
- Corporate content is a first-class product area: company profile, services, articles, videos, FAQs, testimonials, consultation, and contact.
- Current phase: public website scaffold implemented; marketplace and secure workflows remain in design/implementation planning.
- Implementation status: static website routes and UI are present; no production backend or live business workflow is operational.

## Confirmed direction
- Keep the scope focused on real estate and property-related services; exclude unrelated general legal categories.
- Build for remote clients as well as local users.
- Require human review and clear evidence for property verification and legal-service outcomes.
- Do not imply that listing approval is equivalent to legal title verification.
- Foreign nationals' ability to own or acquire property must be screened against current Bangladesh law and professional advice.
- Keep confidential client documents out of Git and public media storage.

## Proposed, not yet approved
- Modular monolith as the initial architecture.
- Client workspace and admin workspace.
- Separate public listing images from private case documents.
- Free/low-cost infrastructure may be preferred, but providers and limits must be evaluated before selection.

## Decisions pending
- Company/brand name and legal operating entity.
- Exact service geography and professional legal partners.
- Foreign client eligibility and service boundaries.
- Listing inventory source and verification standards.
- Technology stack, hosting, database, storage, maps, email, and messaging.
- Revenue model, pricing, payment/refund policy.
- Languages and translation ownership.
- Support coverage, SLAs, case ownership, and retention policy.

## Change log
### 2026-11-12 — Initial repository documentation
- Established project charter, initial requirements, proposed architecture, roadmap, security principles, and open-question register.
- No application implementation or legal-service availability is claimed.


## 2026-11-12 — First application implementation
- Added a Next.js 15 / React 19 / TypeScript application scaffold.
- Added the initial responsive homepage, shared inner-page shell, shared navigation and footer.
- Added service catalogue data and static service detail routes.
- Added public routes for properties, buying, selling, about, contact, FAQs, knowledge, videos, privacy, terms and not-found.
- Added a GitHub Actions workflow for typecheck, lint and production build, with manual dispatch enabled.
- The repository remains public by explicit owner decision. Do not commit secrets, private client data or confidential documents.
- Verification limitation: repository files were re-fetched and confirmed on main. The GitHub commit status endpoint returned no status records; no successful CI run or local production build has been verified. Keep the M1 test gate open.
- Known pre-launch configuration: replace the placeholder metadata base URL and deliberately disabled indexing after the real production domain and public content are approved.
- Known operational gaps: no backend, database, authentication, secure uploads, live form processing, CMS, listing records, admin portal or deployment yet.


## 2026-11-12 — Listing lifecycle and API design milestone
- Added docs/PROPERTY_LISTING_LIFECYCLE.md defining explicit listing states, allowed transitions, moderation evidence, public trust labels, versioning, audit and security acceptance criteria.
- Expanded docs/DATABASE_SCHEMA.md with proposed property, listing revision, evidence, review, status event, inquiry, case, document and audit entities.
- Expanded docs/API_DESIGN.md with public listing/search boundaries, seller and staff endpoints, private upload lifecycle and required authorization tests.
- Corrected GitHub Actions setup-node configuration: removed npm caching because the repository has no package-lock.json, which otherwise makes cache dependency-file discovery fail.
- These are specifications/configuration corrections only. No database, API, real listings, private uploads or moderation workflow has been implemented.
- No CI run result has yet been verified; typecheck, lint, build and manual responsive/accessibility checks remain open.
