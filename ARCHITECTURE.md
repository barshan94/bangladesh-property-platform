# Architecture (Proposed — Not Yet Implemented)

## Status
This is a logical architecture proposal. No technology stack or provider has been selected yet. Do not treat the diagrams or boundaries below as deployed infrastructure.

## Logical components
- **Public web experience:** corporate pages, service pages, knowledge hub, FAQs, videos, contact and consultation entry points.
- **Marketplace:** property search, filters, maps, detail pages, seller submissions, listing moderation, inquiries, and saved listings.
- **Client workspace:** profile, submitted requests, case status, secure document access, and communication history.
- **Operations/admin workspace:** listing review, lead triage, case assignment, content management, permissions, and audit review.
- **Application/API layer:** authentication, authorization, validation, business rules, rate limiting, and integrations.
- **Data layer:** relational business records, audit events, and content metadata.
- **Private file storage:** confidential client documents and listing evidence, separated from public media.
- **External services:** email/SMS/WhatsApp, maps/geocoding, analytics, and optional payment provider, each subject to selection and privacy review.

## Trust boundaries
1. Public visitor to public web/API.
2. Authenticated client to own records only.
3. Staff to assigned cases and permitted operational data.
4. Privileged administrator to controlled administrative functions.
5. Application service to private object storage.
6. Platform to external vendors.

## Architectural requirements
- Enforce authorization on the server for every protected record and file.
- Use least-privilege roles and deny-by-default access.
- Keep private files in non-public storage; issue short-lived, scoped access URLs only after authorization.
- Separate public listing media from confidential legal/identity documents.
- Log sensitive administrative actions and document access.
- Validate uploads by size, MIME type, extension, and malware-scanning capability.
- Use idempotency and explicit state transitions for critical workflows.
- Avoid storing secrets in source control or client-side bundles.
- Provide deletion, retention, export, and correction procedures where legally appropriate.

## Suggested domain boundaries
Identity & Access; Properties & Listings; Seller Submissions; Inquiries & Leads; Legal Service Requests; Cases & Documents; Inspections; Content & CMS; Notifications; Audit & Compliance.

## Deployment topology
To be decided after requirements, budget, regional latency, data residency, and operational capability are assessed. Prefer a simple modular monolith for the first release unless measured needs justify distributed services.

## Decisions still open
See [Open Questions](docs/OPEN_QUESTIONS.md). Record every selected provider and material architecture change in [Memory](MEMORY.md) and [Changelog](CHANGELOG.md).
