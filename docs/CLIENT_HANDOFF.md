# Client handoff — Bangladesh Property Platform

**Handoff state: application source and automated verification are available; production activation is not included in this code handoff.** The repository is a draft pull request and must be reviewed and accepted by the project owner before integration into the release branch.

This document separates work delivered in the repository from configuration and decisions that require the client or the client's authorized operators. It is intended to make the handoff actionable without pretending that a green build is a live production launch.

## 1. Delivered application capabilities

| Area | Delivered in source | Boundary |
| --- | --- | --- |
| Public website | Homepage, published-only property catalogue and detail routes, contact/inquiry entry points, Knowledge Hub routes | No fabricated listings, testimonials or credentials |
| Authentication | Supabase SSR email/password flows and protected dashboard | Production Auth URLs, email delivery and CAPTCHA need configuration |
| Seller workflow | Seller-owned drafts, submission, listing lifecycle and owner-scoped views | Staff users/roles must be provisioned |
| Moderation | Reviewer queue, reasoned decisions, publisher-only publication controls and audit trail | Depends on pending remote migrations |
| Property media | Private image intake, canonical WebP processing, reviewer preview, audited approval and publisher-controlled public delivery | Public delivery must remain disabled until migrations and deployment are verified |
| Inquiries | Validated API, consent/audit persistence and database rate limiting | Production secrets and deployed smoke tests required |
| Service requests | Authenticated creation, requester boundaries, staff assignment and status history | Production secrets and staff setup required |
| Confidential document exchange | Explicitly excluded from the submitted MVP; upload, scan-callback and recovery endpoints return HTTP 410 | No confidential evidence upload, processing, storage or download is supported |
| Knowledge Hub | CMS editor workflow, administrator review/publication and safe public renderer | Editorial migrations and reviewed content are not live remotely |
| Engineering verification | Unit/domain tests, CI build/type/lint checks, isolated database policy/migration tests and browser-auth E2E | CI is not a penetration test or production acceptance |

## 2. Current repository verification

Latest verified branch head: `361149a59781fdcc7e2066e5f7da00cc14a90f71`.

The following workflows completed successfully on that exact commit:

- CI: `43678342722` — passed
- Database policy tests: `43678342730` — passed
- Browser authentication E2E: `43678342783` — passed

The browser workflow replayed migrations in an isolated local Supabase stack and completed its real-browser authentication test. The latest document-inspection hardening also enforces a 4 MiB direct-input ceiling and an 8,192-marker JPEG processing budget, with exact-boundary and over-limit tests. These runs do not apply migrations to the client's remote project, configure production services, or test a deployed domain.

## 3. Required client/operator inputs

The client should provide or nominate an authorized operator for:

1. Approved production domain and hosting account, including confirmation of plan limits, region, request-body limits and trusted proxy headers.
2. Supabase project administrator to review schema drift, verify a recoverable backup and approve/apply pending migrations through the documented process.
3. Production Supabase Auth Site URL, redirect allowlist, email provider/templates and CAPTCHA/bot-protection configuration.
4. Named staff accounts and role assignments (administrator, reviewer, publisher, intake and case manager) with least privilege.
5. Approved business identity, public contact channels, service scope, credentials and customer-support owner.
6. Verified property inventory and documentary authorization for each listing; reviewed Knowledge Hub articles/videos and any testimonials with documented permission.
7. Bangladesh legal/privacy reviewer to approve notices, consent, retention, cross-border processing, claims and operational procedures.
8. Monitoring, alerting, incident response, retention and encrypted backup/restore ownership.

Do not send passwords, API secrets, identity documents or client evidence in this handoff document or public issue tracker. Configure secrets directly in the approved provider's secret manager.

## 4. Explicit MVP exclusion — confidential document exchange

Confidential document exchange is **out of scope for this submitted MVP**. The upload, scan-callback and recovery API routes are disabled and return HTTP 410. The MVP does not accept, store, scan, OCR, process, or serve identity documents, title deeds, ownership evidence, client-case attachments, or other confidential files. The related database schema and processing design are dormant foundations only; they are not an enabled product feature.

Customers must not send confidential evidence through public inquiries, service-request text fields, email, or other improvised channels. The ordinary service-request workflow is for non-confidential request details only. Do not describe the MVP as supporting secure document exchange.

A future separately scoped release may add this capability only after an isolated worker, malware scanning, parser/OCR limits, digest-bound processing, authorized audited downloads, retention/deletion, operational hosting, and deployed security acceptance are complete.

## 5. Controlled activation sequence

1. Review the draft pull request and code changes.
2. Select the production host and domain; verify current plan limits and data-processing terms.
3. Review the pending database migrations against the remote schema. Verify a restorable backup, obtain explicit authorization, then apply migrations through the approved process. Do not use migration-history reconciliation to bypass unapplied SQL.
4. Configure production secrets and Supabase Auth/email/CAPTCHA settings.
5. Provision the first administrator through the restricted bootstrap process, remove the one-time bootstrap secret, and provision named staff.
6. Run deployed HTTPS smoke tests for signup, confirmation, password reset, login/logout, inquiries, service requests, role boundaries and published listing/media delivery.
7. Keep confidential-document intake disabled until the scanner/download controls described above are complete.
8. Complete accessibility, browser/device, security/penetration, legal/privacy and business-content acceptance.
9. Verify monitoring, alerting, retention, encrypted backup and restore rehearsal; assign an operational owner.
10. Record the client's go-live approval and rollback contact before enabling public traffic.

## 6. Acceptance checklist

- [ ] Client has reviewed and accepted the application scope and known limitations.
- [ ] Pull request reviewed and integrated by an authorized repository owner.
- [ ] Production hosting/domain and secret configuration completed.
- [ ] Remote schema reviewed, backed up, approved and migrated.
- [ ] Production authentication/email/CAPTCHA flows verified.
- [ ] Named staff roles and authorization boundaries verified.
- [ ] Real property inventory and public business information verified.
- [ ] Legal/privacy and accessibility/security reviews accepted.
- [ ] Monitoring, backups, restore procedure and operational owner confirmed.
- [x] Confidential document exchange is excluded from this MVP; upload, callback and recovery endpoints are disabled.
- [ ] Client records a formal go-live decision.

## 7. Known exclusions from this code handoff

No production deployment, remote migration application, legal opinion, business identity verification, property due diligence, malware-scanning service procurement, confidential-document processing approval, or operational support service is represented as completed. These require client authorization, external accounts or qualified review. They are explicit acceptance dependencies, not hidden claims of completion.


## 6. Free private-document processing decision

Confidential document exchange is not included in the submitted MVP. A possible future phase may evaluate a self-hosted open-source worker (ClamAV, qpdf, Poppler and Tesseract), but that architecture is not implemented or approved for production. Any future implementation requires an operator-controlled host, full integration, legal/privacy approval and end-to-end acceptance.
