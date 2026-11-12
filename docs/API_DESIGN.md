# API Design (Conceptual)

No API routes are implemented. Final contracts depend on the selected stack.

## Domain groups
- Public content: pages, services, FAQs, articles, videos, testimonials.
- Marketplace: search, listing details, seller submission, listing inquiries, visit requests.
- Identity: sign-in, sign-out, profile, role and session management.
- Client requests: consultation, legal evaluation, case status, document upload/download.
- Admin: listing moderation, lead triage, case assignment, content management, audit access.

## API requirements
- Authenticate and authorize on every protected operation.
- Validate payloads with explicit schemas and server-side business rules.
- Use pagination, filtering allowlists, and bounded result sizes.
- Apply rate limits and anti-abuse controls to public forms and uploads.
- Use idempotency keys for operations that may be retried.
- Return stable error codes without leaking internal details.
- Avoid exposing storage keys or unrestricted file URLs.
- Record audit events for sensitive actions.
- Version public contracts when breaking changes are required.

## Upload lifecycle
1. Authorize the requester and validate intended document purpose.
2. Create a pending upload record and constrained upload authorization.
3. Store file privately and validate type, size, and malware status.
4. Mark upload accepted only after server-side checks.
5. Allow access only to authorized case/listing participants.
6. Apply retention and deletion rules.

## State changes
Critical transitions (listing review, case assignment, document approval, verification status) must be explicit, permission-checked, auditable, and protected against duplicate requests.
