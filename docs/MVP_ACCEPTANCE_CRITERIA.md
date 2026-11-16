# Freelance MVP acceptance criteria — Bangladesh Property Platform

**Developer status:** The agreed MVP source implementation has been merged into `main`. Required automated workflows passed on the PR head before merge. Client acceptance remains intentionally pending.

**Merged source commit:** `725f7c19aa88a393b2b4cdc0dee72be204ab46cd`  
**Pull request:** [#1](https://github.com/barshan94/bangladesh-property-platform/pull/1) — merged on 2026-11-16.

## 1. Included freelance MVP scope

| Requirement | Source status | Evidence / limitation |
| --- | --- | --- |
| Responsive public corporate website, homepage and public information routes | Implemented | Client must supply/approve final business identity and copy |
| Public property catalogue and detail pages | Implemented | Public queries are restricted to published listings; live inventory is empty |
| Property search and filters | Implemented | Keyword/location, district, type, sale/rent/lease, price range, unit-safe area, bedrooms, bathrooms and evidence-backed review labels |
| Approximate property map | Implemented with privacy limit | Seller coordinates are optional; public projection rounds coordinates to two decimal places; not a precise meeting point |
| Public inquiries and site-visit requests | Implemented | Validation, consent/audit persistence and database rate limiting; site visits require a valid property reference |
| Seller-owned drafts and listing submission | Implemented | Seller cannot directly publish their own listing |
| Separate reviewer and publisher decisions | Implemented | Reasoned, audited state transitions; live operation depends on pending remote migrations |
| Listing-image intake and publication workflow | Implemented in source | Private quarantine, canonical WebP processing, reviewer preview and publisher-controlled public delivery; do not enable live before approved migrations and deployed verification |
| Authenticated service requests | Implemented in source | Requester-owned history and staff role/assignment-gated queue; production credentials and staff setup remain operator tasks |
| Knowledge Hub CMS | Implemented in source | Editor draft and administrator review/publication; remote editorial migrations and real content remain pending |
| Automated checks | Passed on PR head | CI, database policy probes and browser authentication E2E; these verify automated source/local paths, not production deployment |

## 2. Verified automated checks

All three required workflows passed on the PR head `ce118695b47d89f96ffd7073cb569be1835888e8` before merge:

- [CI — run 43744178605](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43744178605)
- [Database policy tests — run 43744178566](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43744178566)
- [Browser authentication E2E — run 43744178604](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43744178604)

These results verify automated source/local test paths only. They do not establish production deployment, legal approval, penetration-test completion, or live database acceptance. A separate post-merge workflow run was not returned by the PR-triggered workflow lookup at the time this document was updated.

## 3. Explicit exclusions from this freelance MVP

The following are not part of this freelance MVP unless separately contracted:

- Confidential document exchange, identity/title evidence upload, OCR, malware scanning and secure document downloads. Related upload, scanner-callback and recovery routes are disabled and return HTTP 410.
- Payments, escrow, rent collection, transaction execution or legal representation.
- Automatic property geocoding, exact-address map pins, route planning or guaranteed map availability.
- Proof of property ownership, title clearance, physical inspection or guaranteed listing accuracy.
- Populated live inventory, fabricated demo listings, testimonials, staff identities or Knowledge Hub articles.
- Production hosting/domain procurement, live data migration approval, client account provisioning or ongoing operations.

Do not direct users to send confidential documents through inquiry text, service requests, email or another improvised channel.

## 4. Developer handoff checklist

- [x] Source implementation merged into the repository's `main` branch.
- [x] Setup instructions and environment-variable inventory are documented in [Client handoff](CLIENT_HANDOFF.md).
- [x] Automated domain tests, type checking, lint, production build, database policy probes and browser authentication E2E passed in GitHub Actions on the PR head.
- [x] Scope exclusions, migration status and production limitations are documented.
- [ ] Client reviews the merged deliverable and confirms acceptance of the included scope and explicit exclusions.
- [ ] Client/receiving developer confirms they can install dependencies and run the application using their own authorized development credentials.

The final two items require client action; they are not code defects and must not be marked complete on the client's behalf.

## 5. Client/operator tasks before public launch

These tasks remain outside the developer's authority until the client supplies credentials, approvals, data and operational ownership:

- [ ] Select hosting and domain; configure HTTPS, environment variables, trusted proxy headers and rollback.
- [ ] Reconcile the remote Supabase schema. The project records 10 migrations remotely (the original nine plus the targeted anonymous-read permission fix); 18 repository migrations (versions 10–27) remain unapplied. Review drift, verify a recoverable backup, obtain explicit authorization and apply only approved migrations.
- [ ] Configure Supabase Auth URLs, email delivery, CAPTCHA/bot controls and production secrets.
- [ ] Provision the first administrator and named least-privilege staff accounts; remove the one-time bootstrap secret.
- [ ] Supply verified property inventory, authorized seller coordinates, approved business details and reviewed Knowledge Hub content.
- [ ] Obtain qualified Bangladesh legal/privacy review for service descriptions, public claims, notices, consent and data handling.
- [ ] Complete deployed HTTPS smoke tests for authentication, inquiry, service requests, role boundaries, listing/media publication and approximate map behavior.
- [ ] Configure monitoring, incident response, retention and backup/restore; perform a restore rehearsal and name an operational owner.
- [ ] Complete keyboard/screen-reader, contrast, real-device, browser, security and performance acceptance checks.

No production deployment or remote Supabase migration was performed as part of this merge.

## 6. Handoff decision

**Developer source-code work:** merged into `main`; ready for client review and acceptance.  
**Client acceptance:** pending.  
**Production launch:** not performed and not approved by this handoff.

The source-code package can be reviewed and accepted without deploying the site or modifying the client's live Supabase project.