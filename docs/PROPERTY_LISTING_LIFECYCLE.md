# Property Listing Lifecycle and Moderation Policy

**Status:** Product/engineering specification. This is not a live workflow and does not mean listings are currently accepted or verified.

## 1. Core rule
A listing is a marketing record, not proof of ownership. Publication approval only means the submitted listing passed the platform's defined publication checks. It does not establish legal title, seller authority beyond the evidence explicitly checked, absence of encumbrances, planning approval, or physical condition.

Keep these concepts separate:
- **Submission review:** completeness, policy compliance, spam/duplicate checks.
- **Authority review:** whether the submitter supplied the specific evidence required to advertise.
- **Document review:** which documents were received and inspected.
- **Record search:** a dated search against a named source or office.
- **Physical inspection:** observations made at a stated date/time with stated access limitations.
- **Legal title opinion:** a scoped professional opinion by an appropriately qualified and engaged Bangladesh legal professional.

Never collapse these into a generic "verified" flag.

## 2. Listing lifecycle
| State | Meaning | Public? |
|---|---|---:|
| draft | Seller is preparing details; not submitted | No |
| submitted | Seller sent the submission for review | No |
| under_review | Authorized reviewer checks completeness and policy | No |
| changes_requested | Reviewer needs clarification or corrections | No |
| approved | Reviewer approved the listing for publication | Not until published |
| published | Listing is visible in the public catalogue | Yes |
| rejected | Submission was rejected with a recorded reason | No |
| withdrawn | Seller or authorized staff withdrew the submission | No |
| expired | Listing passed its configured end date and needs renewal | No |
| archived | Listing retained for audit/history but no longer active | No |

### Allowed transitions
- draft -> submitted
- submitted -> under_review
- under_review -> changes_requested | approved | rejected
- changes_requested -> submitted | withdrawn
- approved -> published | withdrawn | expired
- published -> withdrawn | expired | archived
- rejected -> draft only through explicit resubmission/new-version action
- withdrawn -> draft only through explicit reactivation and renewed review
- expired -> submitted only after seller reconfirms accuracy and a new review
- archived -> no direct publication; create a new version/submission

Reject all other transitions server-side. A client must never set its own status to approved or published.

## 3. Review checklist
Before approval, record:
- Submitter identity/contact verification level (do not expose identity evidence publicly).
- Seller's stated relationship to the property and authority-to-list evidence reviewed.
- Property location and description completeness.
- Asking price, currency, area unit, area basis (land area vs built-up area), and whether price is negotiable.
- Property type, tenure/ownership claims, occupancy, known disputes/encumbrances disclosed by submitter, and material limitations.
- Media ownership/permission and whether images accurately represent the property.
- Duplicate/spam and prohibited-content checks.
- Required disclaimers and listing expiry/reconfirmation date.
- Reviewer, timestamp, decision, reason, evidence references and follow-up requests.

This checklist is an operational moderation aid, not a legal due-diligence substitute.

## 4. Public listing disclosures
A published listing should show, where applicable:
- Listing reference and last-updated date.
- Exact location precision approved for publication; never expose a seller's private address/contact details without consent.
- Price and currency; area value and unit; area type.
- Seller/agent representation as disclosed and checked.
- Occupancy and property condition as reported, with attribution.
- What documents were received/reviewed and what was not checked, if such review is offered.
- A plain-language explanation of each trust/status label.
- A route to report inaccurate, misleading or unauthorized content.

Do not display private identity documents, title deeds, phone numbers, personal email addresses, signatures, or exact coordinates by default.

## 5. Trust labels
Allowed labels must be narrow and evidence-backed:
- "Listing reviewed" — moderation checklist completed.
- "Seller identity checked" — only if the stated identity-check procedure was completed.
- "Authority-to-list evidence reviewed" — specific evidence was inspected; this is not a legal finding of title.
- "Documents received" — receipt only, not validation.
- "Record search completed" — supporting record must include source and date.
- "Inspection report available" — report exists; scope and limitations must be disclosed.

Do not use "verified property", "clear title", "dispute-free", "government approved", or equivalent broad claims without a documented basis and prior approval from qualified Bangladesh counsel.

## 6. Versioning and audit
- Every seller edit after submission creates a new revision or auditable version.
- Material edits to price, location, area, ownership/authority claims, occupancy, or media return the listing to review.
- Record every transition with actor, role, timestamp, old state, new state, reason and request/correlation ID.
- Keep review decisions append-only; corrections are new events, not silent overwrites.
- Store current state for efficient reads, but retain immutable transition events.
- Prevent duplicate submissions and concurrent conflicting transitions with database constraints/transactions.

## 7. Security and privacy
- Public listing images and confidential evidence must use separate storage containers and access policies.
- Private evidence must never use a public URL or be committed to this public GitHub repository.
- Use short-lived, purpose-scoped download links after server-side authorization.
- Restrict evidence access to assigned reviewers and authorized staff; log access and downloads.
- Define file type/size limits, malware scanning, retention, deletion, consent and incident handling before accepting real uploads.
- Do not request national ID, passport, deed or other sensitive documents through an ordinary contact form or email.

## 8. Acceptance criteria for implementation
- [ ] Public visitors can only retrieve published listings and approved public fields.
- [ ] Sellers can create/edit their own drafts and submit them, but cannot approve or publish.
- [ ] Every transition is validated server-side against the transition matrix.
- [ ] Reviewer decisions require a reason and are auditable.
- [ ] Material edits trigger re-review.
- [ ] Public trust labels map to explicit evidence and definitions.
- [ ] Private evidence is inaccessible to anonymous users and unrelated clients.
- [ ] Tests cover allowed/forbidden transitions, role boundaries and concurrent updates.
- [ ] Counsel approves public trust language and the final moderation checklist before launch.
