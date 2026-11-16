# Product Requirements — Bangladesh Property Platform

## Product summary
A responsive corporate website and service platform combining a Bangladesh property marketplace with property-assistance request workflows.

This document describes the submitted freelance MVP and clearly separates deferred capabilities. It is not evidence that the client has supplied live content, property data, staff, legal approvals or production infrastructure.

## Audiences and needs
- Buyers: find relevant listings, understand key facts, request information and schedule visits.
- Sellers: submit property details and listing images, understand moderation and receive inquiry updates.
- Owners abroad: request local inspections, document coordination and property support without sending confidential documents through this MVP.
- Heirs: understand and request assistance with succession, partition, mutation and related matters.
- Tenants/landlords: find information and request help with property-related disputes.
- Staff: review listings, triage leads, manage service requests and communicate with clients.
- Experts/counsel: review assigned matters within a defined professional and access-control framework.

## Core requirements

### Corporate website
- Homepage with clear positioning, company introduction, property discovery entry, service highlights, calls to action and only approved credibility evidence.
- Public information routes for about, services, contact, FAQs and consultation.
- Service catalogue and individual service explanations.
- Knowledge Hub with published articles and property guides.
- Video library and FAQs; testimonials or client media may be published only when supplied and approved with documented consent.
- Mobile-responsive contact and call/WhatsApp actions where configured.

### Marketplace
- Search and filters by location, property type, price, area, bedrooms/bathrooms and clearly defined evidence-backed listing review labels.
- Property detail page with available media, location, dimensions, amenities, ownership/tenure facts when supplied, and clear listing disclosures.
- Approximate map pins only when sellers provide coordinates; public coordinates are rounded and must not be treated as exact meeting points.
- Public inquiry and property-specific site-visit requests.
- Seller listing submission with human moderation and a separate publication decision before public visibility.
- Listing moderation and legal title verification must remain separate concepts.
- Favorites and client tracking may be considered as a separately scoped future enhancement.

### Services and case intake — included MVP boundary
- Visitors can request assistance through the public inquiry form.
- Authenticated users can create text-based service requests, view only their own request history and receive a non-sensitive reference.
- Staff access to the queue is role- and assignment-gated; status changes are controlled and auditable.
- No automated legal advice, ownership guarantee or outcome guarantee is provided.

**Confidential attachments are excluded from this MVP.** The platform does not accept, scan, OCR-process, store or provide downloads for identity, title, ownership or case evidence. The upload, scanner-callback and recovery API routes are disabled and return HTTP 410. Do not direct customers to send confidential files through inquiry text, service-request fields, email or another improvised channel.

A future confidential document-exchange phase requires separate scope, implementation, security review and operational approval. It would need a properly isolated scanning/processing worker, malware controls, resource limits, authorization, audited access, retention/deletion and tested hosting; dormant schema or design documents do not mean that feature is delivered.

## Quality attributes
- Mobile-first, accessible and responsive.
- Fast pages, optimized media, semantic HTML and search-friendly URLs.
- Strong authentication, authorization, privacy, auditability and resilience.
- Clear validation, loading, success and failure states.
- Maintainable code and automated tests.

## Acceptance principles
- Every included feature has testable acceptance criteria and linked implementation/test evidence.
- Sensitive data is never exposed to unauthorized roles.
- Public claims match actual operational capability and supplied evidence.
- Legal workflows and public service claims require qualified local counsel review.
- Source-code acceptance is distinct from production launch approval.
