# Roadmap

Statuses: **Not started**, **In progress**, **Completed**, **Blocked**, **Deferred**. A status is not a promise; update it only with evidence.

## M0 — Product definition and repository foundation
- [x] Create repository and baseline documentation.
- [x] Record initial product scope, risks, and unresolved decisions.
- [x] Define public sitemap, page responsibilities, and core form requirements.
- [x] Define MVP acceptance criteria and launch gates.
- [x] Record initial product decisions, including public-repository security constraints.
- [ ] Confirm company/brand identity and operating entity.
- [ ] Confirm service geography, legal partners, and service delivery model.
- [ ] Validate target customer segments and priority use cases.

## M1 — Requirements and service validation
- [ ] Approve MVP scope and measurable success criteria.
- [ ] Validate every legal-service description with Bangladesh counsel.
- [ ] Confirm foreign-client eligibility screening and escalation process.
- [ ] Confirm listing sources, seller authority checks, and moderation policy.
- [ ] Define service pricing, payments, refunds, and client communication responsibilities.
- [ ] Define support hours, response SLAs, and escalation ownership.

## M2 — UX and technical foundation
- [ ] Approve sitemap, wireframes, and responsive design system.
- [ ] Select stack, hosting, database, authentication, maps, email, and storage.
- [ ] Approve threat model, data classification, and retention schedule.
- [x] Draft conceptual schema, API boundaries, listing lifecycle and audit requirements (design only; no backend implementation).
- [ ] Establish development, preview, and production environments.

## M3 — Corporate website and content
- [ ] Homepage, About, Why Choose Us, Contact, and consultation flows.
- [ ] Property service catalogue and service detail pages.
- [ ] Knowledge hub, articles, FAQs, and video library.
- [ ] Testimonials with consent and moderation.
- [ ] SEO metadata, structured data, sitemap, and analytics consent review.

## M4 — Marketplace MVP
- [ ] Search, filters, property detail pages, and map.
- [ ] Seller submission and private document intake.
- [ ] Listing moderation and publication workflow.
- [ ] Inquiry, saved listings, and site-visit requests.
- [ ] Admin listing and lead management.

## M5 — Client assistance workflows
- [ ] Secure consultation and legal evaluation intake.
- [ ] Client account and case-status timeline.
- [ ] Private document upload, access control, and audit trail.
- [ ] Property inspection request and report workflow.
- [ ] Power-of-attorney assistance workflow, subject to counsel approval.
- [ ] Tenant/property management features only after operating model approval.

## M6 — Assurance and launch
- [ ] Functional, security, privacy, accessibility, and performance testing.
- [ ] Legal review of public claims, forms, contracts, and disclaimers.
- [ ] Backup restore drill and incident-response rehearsal.
- [ ] Operational runbooks, support ownership, and monitoring.
- [ ] Limited pilot with explicit acceptance criteria.
- [ ] Production launch approval.

## Deferred / excluded until approved
- Online payments, escrow, commissions, automated legal conclusions, native mobile apps, and advanced property-management accounting.

## Completion rule
Each task requires a linked PR/commit, test result, review record, or other verifiable evidence. Documentation-only completion must not be confused with a deployed feature.


## M1 — Public website foundation
- [x] Add Next.js and TypeScript application scaffold.
- [x] Build initial homepage and responsive visual foundation.
- [x] Add shared inner-page shell and navigation/footer components.
- [x] Add service catalogue and individual service detail routes.
- [x] Add About, Contact, Properties, Buy, Sell, FAQs, Knowledge and Videos routes.
- [x] Run and pass CI domain tests, typecheck, lint and production build (GitHub Actions run 43214807903 passed all validation and build steps at commit 2031f437).
- [ ] Perform responsive and accessibility review.

## M2 — Functional public content and property catalogue
- [ ] Finalize company identity, actual contact details and approved public claims.
- [ ] Implement CMS or controlled content workflow for articles, FAQs and videos.
- [ ] Implement property listing data model, moderation and public search (typed public model, empty inventory source and client-side catalogue filters implemented; persistent backend, real inventory and moderation remain pending).
- [ ] Add property detail pages and listing inquiry workflow (detail route implemented; real listing data and live inquiry handling remain pending).
- [ ] Add seller submission with private document intake only after security design is approved.

## M3 — Secure client and operations workflows
- [ ] Select backend, authentication and private file storage.
- [ ] Implement client accounts and role-based access.
- [ ] Implement confidential case intake, private attachments and audit logs.
- [ ] Implement staff/admin case and listing management.
- [ ] Add legal review and eligibility workflows.

## M4 — Release readiness
- [ ] Complete security, privacy and legal review.
- [ ] Complete automated and manual testing.
- [ ] Configure production domain, monitoring and backup/restore.
- [ ] Deploy after release gates are satisfied.


## Marketplace implementation progress — 2026-11-12
- [x] Add a typed public property listing contract with explicit area units, listing purpose, property types and narrow evidence-backed trust labels.
- [x] Add an intentionally empty published-listings source; no fictional property inventory is shown.
- [x] Add responsive client-side keyword, district, type, sale/rent and maximum-price filters.
- [x] Add public property detail route with explicit disclosure and trust-label presentation.
- [ ] Connect a persistent database and server-side published-only search.
- [x] Implement a standalone listing transition policy and automated role-boundary tests (domain logic only; not yet connected to authenticated API routes or persistence).
- [x] Implement seller-draft input validation with strict field allowlisting, value bounds, safe image URL rules and automated tests (CI run 43215900701 passed; validation utility only, no API/authentication/persistence).
- [x] Implement privacy-minimal public service inquiry validation with consent, service allowlist and rejection of confidential attachments/identity fields (validation utility only; no delivery or persistence).
- [ ] Implement seller draft/submission, reviewer decisions and immutable status events.
- [ ] Add listing inquiries only after secure delivery, abuse protection and privacy requirements are implemented.
- [x] Implement a standalone service-request lifecycle policy with intake/case-manager role boundaries and automated tests (domain logic only; no authenticated assignment or persistence).
- Validation note: GitHub Actions run 43216409377 passed domain tests, TypeScript validation, ESLint and production build for commit 9f7808f. Browser, responsive, accessibility and security testing remain outstanding.


### Service-request workflow implementation — 2026-11-12
- [x] Add explicit service-request states from new intake through triage, assignment, active work, client wait, resolution, closure or spam.
- [x] Restrict intake coordination and case-management transitions to separate roles; administrator has no implicit bypass.
- [x] Add TypeScript declarations and Node.js tests for valid transitions, role boundaries, terminal states, invalid/prototype keys and immutable policy.
- [ ] Connect the policy to authenticated staff assignment, persistent records, atomic status-event writes and notifications.
