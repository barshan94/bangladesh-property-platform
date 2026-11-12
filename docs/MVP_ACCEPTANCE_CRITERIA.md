# MVP Acceptance Criteria

**Status:** Proposed release criteria — no feature is considered implemented until tested.

## 1. Corporate website

- [ ] All approved public routes exist and have working navigation.
- [ ] Homepage clearly explains the combined marketplace and property-assistance proposition.
- [ ] About, services, contact, FAQs, knowledge and video sections are reachable.
- [ ] No placeholder claims, fake reviews, fabricated team profiles or invented listings appear.
- [ ] Each page has a unique title, description, canonical URL and appropriate social metadata.
- [ ] Mobile navigation and sticky contact actions work without obscuring content.
- [ ] Forms expose clear validation, loading, success and failure states.

## 2. Property marketplace

- [ ] Visitors can browse published properties without an account if approved by the product owner.
- [ ] Search and filters return only published, non-suspended listings.
- [ ] Property detail pages show price, location, dimensions, property type, media and known limitations.
- [ ] Missing facts are labelled unknown/not supplied rather than inferred.
- [ ] Seller submissions are private and cannot publish themselves.
- [ ] Admin approval is required before publication.
- [ ] Listing moderation and legal title verification are separate statuses.
- [ ] Property inquiries reach the authorized operations inbox or lead queue.

## 3. Confidential service intake

- [ ] Visitors can submit a service evaluation request.
- [ ] Service category and property location are captured.
- [ ] Private attachments are stored outside the public web directory/bucket.
- [ ] A user cannot read another user's submission or files by changing an identifier.
- [ ] Staff access is role- and assignment-controlled.
- [ ] Sensitive reads and administrative changes are auditable.
- [ ] Upload validation checks file size, MIME type and extension; malware scanning is addressed in the deployment design.
- [ ] The user receives a non-sensitive confirmation reference, not confidential case details in an insecure email.

## 4. Client and staff workflows

- [ ] A client can see only their own requests and permitted documents.
- [ ] Staff can access only cases within their assigned permissions.
- [ ] Admin actions are protected server-side, not merely hidden in the interface.
- [ ] Case states have defined allowed transitions and timestamps.
- [ ] Rejected, withdrawn, closed and reopened cases have explicit handling rules.
- [ ] Exports exclude confidential attachments by default and are permission-checked.

## 5. Security and privacy release gates

- [ ] No credentials, API keys, personal data or client documents are committed to the public repository.
- [ ] Production secrets are stored only in the deployment provider's secret manager.
- [ ] Authorization tests cover cross-user and cross-role access.
- [ ] Private storage denies anonymous access.
- [ ] File links are short-lived and scoped after server authorization.
- [ ] Rate limits and abuse protection exist for public forms and authentication.
- [ ] Privacy notice, retention schedule, deletion process and contact owner are approved.
- [ ] Error pages and logs do not disclose secrets or sensitive submitted content.

## 6. Legal and trust release gates

- [ ] Qualified Bangladesh counsel reviews service descriptions, disclaimers, intake wording and public claims.
- [ ] Foreign-client and property-acquisition eligibility is screened case by case.
- [ ] No generic promise says foreign nationals can buy/own all types of property.
- [ ] Any title-review statement specifies source records, scope, reviewer, date and limitations.
- [ ] Listing approval is never presented as title certification.
- [ ] Testimonials and client media have documented consent.
- [ ] Service availability, professional roles, fees and response expectations are truthful and documented.

## 7. Quality gates

- [ ] Production build succeeds from a clean checkout.
- [ ] Automated unit/integration tests pass.
- [ ] Critical user flows pass end-to-end tests.
- [ ] Keyboard navigation and screen-reader labels are reviewed.
- [ ] Responsive checks cover narrow mobile, tablet and desktop.
- [ ] Performance and image loading are measured on representative pages.
- [ ] Backup restoration is tested, not merely configured.
- [ ] Monitoring, incident ownership and rollback procedure are documented.

## MVP definition

The first public MVP should prioritize a polished corporate website, trustworthy service catalogue, contact/consultation intake, and a moderated property catalogue. Full client case management, payments, escrow, rent collection, and advanced property management remain out of scope until their operational and legal requirements are proven.

A checklist item may be marked complete only with a linked implementation commit/PR and test or review evidence.
