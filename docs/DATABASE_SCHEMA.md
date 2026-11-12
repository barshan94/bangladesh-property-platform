# Database Schema (Conceptual)

No schema or migrations have been implemented. This is a domain inventory for design review.

## Proposed entities
- users, user_profiles, roles, user_roles, staff_assignments
- properties, property_media, property_locations, property_features
- listing_submissions, listing_evidence, listing_reviews, listing_status_history
- inquiries, leads, lead_assignments, site_visit_requests
- service_categories, service_requests, cases, case_assignments, case_status_history
- documents, document_access_events, document_retention_events
- inspections, inspection_reports
- articles, faqs, videos, testimonials, content_categories
- consultations, notifications, consent_records
- audit_events

## Design constraints
- Use stable IDs and timestamps; store time in UTC and display in user-local time where appropriate.
- Define explicit state enums and allowed transitions.
- Keep private file bytes in object storage; store metadata and opaque storage keys in the database.
- Avoid storing unnecessary identity numbers or sensitive personal details.
- Enforce tenant/client ownership and staff assignment rules at the data-access layer.
- Use soft deletion only where justified; define eventual secure purge.
- Add indexes based on actual query patterns.
- Define foreign keys, uniqueness, and check constraints.
- Keep audit events append-only to the extent supported by the chosen stack.

## Open design choices
Database provider, tenancy model, localization strategy, retention periods, search/geospatial implementation, and row-level security approach.
