# Client and staff operating guide — Bangladesh Property Platform

This guide is for the client/operator and authorized staff. It explains the role-based workspaces, what each role is expected to do, and which actions must wait for production activation.

## 1. Before operating the platform

**Current release state: preliminary Vercel Production deployment; full production operation is NO-GO.** The application is merged into `main` and the homepage/catalogue render over HTTPS through authorized Vercel access. The default Vercel domain is currently SSO-protected; public staff/client access must wait until a commercially permitted hosting plan/provider is selected. The dedicated remote Supabase project records 10 migrations; 18 repository migrations (versions 10–27) remain unapplied. Do not accept real customer data or assume role-based workflows are live until the operator completes the documented release gates.

Use only synthetic data for development and demonstration. Do not create real staff accounts or accept real property submissions in an unverified environment.

## 2. Roles and responsibilities

| Role | Intended responsibility | Important boundary |
| --- | --- | --- |
| Seller | Create and manage own property drafts; submit drafts for review; submit ordinary listing photographs where enabled | Cannot approve or publish own listing; cannot upload confidential documents |
| Listing reviewer | Review submitted listing information and make a reasoned moderation decision | Review is not legal title verification; reviewer must not review their own media |
| Listing publisher | Publish an already-approved listing; separately control publication of approved images where enabled | Publication is a visibility decision, not proof of ownership or title |
| Intake coordinator | View incoming service requests, triage, assign eligible staff and record permitted status changes | Must record a reason; does not provide legal advice by virtue of this role |
| Case manager | Work on requests assigned to their own account and record permitted progress/status changes | Cannot access another case manager's assigned cases or assign work |
| Content editor | Prepare Knowledge Hub article/video drafts and submit them for review | Cannot self-approve or publish content |
| Administrator | Perform authorized role administration and editorial approval/publication; may access staff workflows according to assigned role claims | Use MFA and least privilege; do not share administrator credentials |

A user's role is granted by an authorized administrator through the Supabase Edge Function process. Users must not be allowed to assign roles to themselves through profile fields or browser forms.

## 3. Sign-in and account workspace

1. The operator provisions/configures Supabase Auth and the approved website callback URLs.
2. Staff sign in using their individual email/password account.
3. Open `/dashboard` to see the links permitted by the account's trusted role claims.
4. If a workspace link is missing or redirects to the account page, the account may not have the required role, the session may need refreshing, or the relevant backend migrations may not be installed.
5. Never share accounts. Revoke access promptly when a staff member leaves or changes responsibilities.

The account dashboard is a role-aware navigation page; it is not a substitute for staff onboarding, internal policy, client communication procedures or a ticketing/notification system.

## 4. Seller workflow

1. Open **My property listings** (`/dashboard/listings`).
2. Select **Create property draft** and complete the property facts.
3. Check that location, price, area unit/basis and room counts are accurate and supported by the seller's information.
4. Save the draft and review it for errors.
5. Submit the draft for review.
6. Track its status in the seller workspace. A seller cannot directly publish a listing.
7. Where enabled, upload ordinary property images only to an editable draft or changes-requested listing. The upload control accepts one image per submission; the current processing path canonicalizes supported JPEG, PNG and WebP images to WebP and places them in private quarantine.

Do not treat a seller's statements or supplied images as independent proof of title, authority, physical condition or legal eligibility. Do not ask sellers to upload confidential evidence; secure document exchange is excluded.

## 5. Listing moderation and publication

The intended control sequence is separate seller submission, reviewer decision, and publisher decision. Do not bypass this separation.

- Reviewers should examine the listing information and record a clear reason for each decision. Any required evidence or legal verification must be handled under a separately approved professional process.
- Publishers should publish only listings that have passed the configured review workflow and the operator's documented business checks.
- Publication should use a reason/note that records what was checked.
- A listing may be unpublished/withdrawn through the approved controlled action when necessary; record the reason.
- Listing status is an administrative workflow state. It is not a legal certificate.

**Important source/live distinction:** the listing lifecycle documentation notes that a domain event builder alone does not authenticate an actor, prove role/assignment, load authoritative state, persist an event or prevent concurrent updates. Do not describe that utility as a live audit trail. Confirm the actual database-backed review workflow and its deployed route before promising the client that all reviewer actions are operational. Required remote migrations remain pending.

## 6. Listing image moderation and publication

The source includes distinct routes for:
- Reviewer queue: `/dashboard/media-review`
- Publisher queue: `/dashboard/media-publication`

Intended procedure:
1. A seller submits an ordinary property photograph for an editable listing.
2. A reviewer opens the pending-image queue, previews the private image and approves or rejects it with a reason.
3. Approval is not publication.
4. A publisher opens the approved-image queue and separately publishes or unpublishes the image with a reason.
5. Public delivery should re-check both media publication and parent-listing publication.

**Do not activate this workflow in production yet.** The necessary migrations are not applied to the remote database, and the deployed host's image-processing compatibility, resource limits and full failure/recovery behavior have not been accepted. No malware scanner is connected. Confidential documents are not image uploads.

## 7. Service request handling

Client requests are created at `/dashboard/service-requests`. Authorized staff use `/dashboard/service-requests/manage`.

### Intake coordinator
1. Open the staff queue and review new requests.
2. Check that the request is within the platform's service scope and does not contain confidential evidence.
3. Triage the request and record a reason for the status change.
4. Assign it to an eligible active intake coordinator, case manager or administrator as appropriate, with an assignment reason.
5. Use only the status transitions allowed by the application and database.

### Case manager
1. Open the staff queue and work only on requests assigned to your own user ID.
2. Review the request summary and permitted contact details.
3. Record a reason for each permitted status transition.
4. Do not attempt to access or update another case manager's assigned request.

### Administrator
1. Ensure role assignments are current and least-privilege.
2. Do not use administrator access to bypass the case lifecycle or grant yourself unrestricted operational authority.
3. Review audit/history records when investigating a status or assignment issue.

The database is intended to be the authoritative authorization boundary. A missing queue, failed request or permission error must be treated as unavailable—not bypassed by editing records directly.

No staff notifications, response-time SLA, secure attachments, document scanning or signed document downloads are included. Service-request submission is not a signed engagement or legal advice.

## 8. Knowledge Hub editorial process

The CMS workspace is `/dashboard/content`.

1. A content editor creates an article or video record.
2. For articles, provide a valid URL slug, title, summary, jurisdiction, contributor display name (if approved), internal source notes and Markdown body.
3. For videos, select the supported provider (YouTube or Vimeo) and enter the provider's video identifier—not an arbitrary embed URL.
4. Save the record as a private draft.
5. Verify jurisdiction, legal currentness, citations, copyright, privacy and marketing claims.
6. Submit for review.
7. An administrator other than the author reviews the submission and records a reason to approve or reject it.
8. Only approved content may be published. Record a publication note. Published content can be archived with a reason.

Do not invent author credentials, legal conclusions, testimonials or client outcomes. The public Markdown renderer supports a limited safe subset; raw HTML and unsupported constructs should not be relied upon.

The editorial database migrations are not yet applied to the remote project and no reviewed production content has been supplied. Do not promise an active CMS until its deployed availability is verified.

## 9. First administrator and role provisioning

First-administrator setup is an operator-only security procedure, not a self-service website feature. Follow the technical runbook in [Trusted Staff Role Management](STAFF_ROLE_MANAGEMENT.md). In summary:
- Create the intended Auth account and verify its identity out of band.
- Use its immutable Auth UUID for the one-time bootstrap secret in Supabase Edge Function secrets.
- Deploy the role-management Edge Function with JWT verification enabled.
- Bootstrap only that intended account, then remove the one-time bootstrap secret immediately.
- Grant each staff member only the role required for their duties.
- Require MFA for administrators and review role changes/audit records.

Never put service-role credentials or bootstrap secrets in the repository, client-side variables, chat, issue comments or screenshots.

## 10. Incident and customer-data rules

- Do not accept confidential identity, ownership, title or case documents in this MVP.
- Do not ask customers to place confidential material in inquiry or service-request text fields, email or another improvised channel.
- Do not make claims that a listing is legally verified, title-cleared, inspected or guaranteed unless a separate documented professional process supports the exact claim.
- If a user reports unauthorized access, data exposure, suspicious listing activity or an account compromise, follow the operator's incident response and credential-rotation process. Preserve relevant logs; do not silently delete evidence.
- Do not change production database schema, manually edit migration history or disable RLS to make a feature appear to work.

## 11. Operational release prerequisites

Before real users or staff operate the live system, the client/operator must complete the [Production release gates](PRODUCTION_RELEASE_GATES.md), including:
- Review remote schema drift, verify a recoverable backup (including Storage objects), authorize and safely apply the 18 pending migrations (versions 10–27).
- Configure production hosting, domain, HTTPS, environment variables and trusted proxy headers.
- Configure Supabase Auth redirects, real email delivery and CAPTCHA/bot protection.
- Bootstrap the administrator and provision staff roles.
- Supply approved business identity, contact details, verified listings and reviewed Knowledge Hub content.
- Complete deployed smoke tests, accessibility/device/browser/security checks, legal/privacy review, monitoring, backup/restore rehearsal and operator assignment.

A green CI run proves only the automated checks that ran in the test environment. It does not prove that production services, database migrations, staff accounts or live customer workflows are ready.
