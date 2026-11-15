# Freelance MVP acceptance criteria — Bangladesh Property Platform

**Submission status:** Application source is implemented for the agreed MVP and the required automated workflows have passed. This document separates the developer's source-code deliverable from the client's later production-launch responsibilities.

**Reviewed source:** `0b13fb81aa1410d5473ffeccbff5e383dc98d355`  
**Current PR head at last review:** `9549115fc81d841ee929a23927d3d3aaf31db748` (documentation-only after the reviewed source commit).  
**Pull request:** [#1](https://github.com/barshan94/bangladesh-property-platform/pull/1) — open, draft, unmerged.

## 1. Included freelance MVP scope

| Requirement | Source status | Evidence / limitation |
| --- | --- | --- |
| Responsive public corporate website, homepage and public information routes | Implemented | Included in the Next.js application; client must supply/approve final business identity and copy |
| Public property catalogue and detail pages | Implemented | Public queries are restricted to published listings; live inventory is empty |
| Property search and filters | Implemented | Keyword/location, district, type, sale/rent/lease, price range, unit-safe area, bedrooms, bathrooms and evidence-backed review labels |
| Approximate property map | Implemented with privacy limit | Seller coordinates are optional; public projection rounds coordinates to two decimal places; not a precise meeting point |
| Public inquiries and site-visit requests | Implemented | Validation, consent/audit persistence and database rate limiting; site visits require a valid property reference |
| Seller-owned drafts and listing submission | Implemented | Seller cannot directly publish their own listing |
| Separate reviewer and publisher decisions | Implemented | Reasoned, audited state transitions; live operation depends on pending remote migrations |
| Listing-image intake and publication workflow | Implemented in source | Private quarantine, canonical WebP processing, reviewer preview and publisher-controlled public delivery; do not enable live before approved migrations and deployed verification |
| Authenticated service requests | Implemented in source | Requester-owned history and staff role/assignment-gated queue; production credentials and staff setup remain operator tasks |
| Knowledge Hub CMS | Implemented in source | Editor draft and administrator review/publication; remote editorial migrations and real content remain pending |
| Automated checks | Passed | CI, database policy probes and browser authentication E2E; see links below |

## 2. Verified automated checks

All three required workflows passed on the reviewed application-source commit:

- [CI — run 43740014248](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43740014248): dependency audit, domain tests, TypeScript, ESLint and production build.
- [Database policy tests — run 43740014252](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43740014252): isolated migration replay and authorization probes.
- [Browser authentication E2E — run 43740014292](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43740014292): local Supabase/browser authentication flow.

The later documentation-only PR head `9549115fc81d841ee929a23927d3d3aaf31db748` also passed all three workflows:

- [CI — run 43740444125](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43740444125)
- [Database policy tests — run 43740444053](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43740444053)
- [Browser authentication E2E — run 43740444073](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43740444073)

These results verify automated source/local test paths only. They do not establish production deployment, legal approval, penetration-test completion, or live database acceptance.

## 3. Explicit exclusions from this freelance MVP

The following are not part of the delivered MVP unless separately contracted:

- Confidential document exchange, identity/title evidence upload, OCR, malware scanning and secure document downloads. Related upload, scanner-callback and recovery routes are disabled and return HTTP 410.
- Payments, escrow, rent collection, transaction execution or legal representation.
- Automatic property geocoding, exact-address map pins, route planning or guaranteed map availability.
- Proof of property ownership, title clearance, physical inspection or guaranteed listing accuracy.
- Populated live inventory, fabricated demo listings, testimonials, staff identities or Knowledge Hub articles.
- Production hosting/domain procurement, live data migration approval, client account provisioning or ongoing operations.

Do not direct users to send confidential documents through inquiry text, service requests, email or another improvised channel.

## 4. Developer source-handoff checklist

- [x] Source repository and reviewed implementation branch are available to the client.
- [x] Setup instructions and environment-variable inventory are documented in [Client handoff](CLIENT_HANDOFF.md).
- [x] Automated domain tests, type checking, lint, production build, database policy probes and browser authentication E2E passed in GitHub Actions.
- [x] Scope exclusions, migration status and production limitations are documented.
- [ ] Client reviews the pull request and confirms acceptance of the included scope and explicit exclusions.
- [ ] Client/receiving developer confirms they can install dependencies and run the application using their own authorized development credentials.

The final two items require client action; they are not code defects that the developer can truthfully mark complete on the client's behalf.

## 5. Client/operator tasks before public launch

These are not prerequisites for accepting the source-code deliverable, but they must be completed before operating a live public service:

- [ ] Select hosting and domain; configure HTTPS, environment variables, trusted proxy headers and rollback.
- [ ] Reconcile the remote Supabase schema. The project records migrations 1–9 remotely; migrations 10–26 remain unapplied. Review drift, verify a recoverable backup, obtain explicit authorization and apply only the approved migrations.
- [ ] Configure Supabase Auth URLs, email delivery, CAPTCHA/bot controls and production secrets.
- [ ] Provision the first administrator and named least-privilege staff accounts; remove the one-time bootstrap secret.
- [ ] Supply verified property inventory, authorized seller coordinates, approved business details and reviewed Knowledge Hub content.
- [ ] Obtain qualified Bangladesh legal/privacy review for service descriptions, public claims, notices, consent and data handling.
- [ ] Complete deployed HTTPS smoke tests for authentication, inquiry, service requests, role boundaries, listing/media publication and approximate map behavior.
- [ ] Configure monitoring, incident response, retention and backup/restore; perform a restore rehearsal and name an operational owner.
- [ ] Complete keyboard/screen-reader, contrast, real-device, browser, security and performance acceptance checks.

## 6. Handoff decision

**Freelance source-code delivery: ready for client review and acceptance. Production launch: not approved or included.**

The source-code package can be accepted without deploying the site or modifying the client's live Supabase project. The PR remains open and draft; the client/repository owner must review and accept it. No merge, deployment or remote migration is implied by the passing checks.
