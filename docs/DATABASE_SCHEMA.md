# Database Schema (Conceptual)

**Status:** Domain design only. No database, migrations, or API persistence are implemented yet. Fields below are proposed and must be adapted to the selected provider and reviewed for Bangladesh legal/privacy requirements.

## Design principles
- Use UUID/opaque IDs; never expose sequential internal IDs as authorization.
- Store timestamps in UTC; preserve timezone only where a legal/business event requires it.
- Use explicit state enums and server-enforced transition rules.
- Keep private file bytes in private object storage; store opaque storage keys and metadata only.
- Separate public listing media from confidential seller evidence and client/legal documents.
- Enforce ownership and staff assignment in database policies and server-side authorization.
- Minimize identity data. Avoid collecting national ID/passport numbers without a documented lawful need and retention rule.
- Audit privileged actions and sensitive document access.
- Use transactions for submission, review decisions, publication and critical transitions.

## Identity and access
### users
id, auth_subject, email_normalized, phone_e164 (nullable), account_status, created_at, updated_at.
Unique auth_subject; normalized email uniqueness only if required by the chosen identity model.

### user_profiles
user_id, display_name, preferred_language, country_of_residence (optional), timezone (optional), created_at, updated_at.
Do not put identity document numbers in this general profile.

### roles / user_roles
roles: id, code, description.
user_roles: user_id, role_id, granted_by, granted_at, revoked_at.
Role changes are audited. UI visibility is not an authorization boundary.

### staff_assignments
id, staff_user_id, resource_type, resource_id, assigned_by, assigned_at, revoked_at.
Assignment scope must be checked for every staff read/write.

## Properties and marketplace
### properties
id, public_reference, property_type, country_code, division, district, upazila, locality, address_private (nullable), public_location_label, latitude_private (nullable), longitude_private (nullable), created_at, updated_at.
Public location precision is a deliberate disclosure decision; private address/coordinates must not leak through public APIs.

### property_listings
id, property_id, seller_user_id (nullable for staff-created listings), listing_kind, headline, description, price_amount (nullable), currency_code, area_value (nullable), area_unit (nullable), area_basis (nullable), bedrooms (nullable), bathrooms (nullable), occupancy_status, public_status, submitted_at, published_at, expires_at, created_at, updated_at.
public_status is a controlled lifecycle state, not seller-editable. Price must be non-negative; currency and area units must be allowlisted. Do not mix land area, floor area and built-up area in one unlabeled field.

### listing_revisions
id, listing_id, revision_number, submitted_payload (or normalized revision fields), created_by, created_at.
Unique (listing_id, revision_number). Material changes create a new reviewable revision.

### property_media
id, property_id, listing_id, storage_key, media_type, caption, sort_order, publication_status, uploaded_by, created_at.
Only approved media is public. No private evidence keys in public responses.

### listing_evidence
id, listing_id, revision_id, evidence_type, private_storage_key, original_filename, detected_mime_type, size_bytes, scan_status, review_status, uploaded_by, created_at, deleted_at.
Private by default; access only through an authorized service. Do not store file bytes in database rows.

### listing_reviews
id, listing_id, revision_id, reviewer_user_id, decision, reason_code, reviewer_notes_private, decided_at.
Reviewer notes are private. Decision requires an authorized reviewer and a reason.

### listing_status_events
id, listing_id, actor_user_id, from_status, to_status, reason, request_id, created_at.
Append-only event history. Enforce valid transitions in a transaction.

## Inquiries and visits
### inquiries
id, listing_id, requester_user_id (nullable for guest inquiry), name, email, phone (nullable), message, consent_version, status, created_at.
Apply rate limits, spam controls and retention rules. Guest inquiries must not expose other inquiry records.

### site_visit_requests
id, listing_id, requester_user_id, preferred_window, contact_method, status, created_at, updated_at.
A request is not a confirmed appointment until staff explicitly confirms it.

## Services and confidential cases
### service_requests
id, requester_user_id, service_code, property_id (nullable), summary, jurisdiction, eligibility_status, consent_version, status, created_at, updated_at.
Keep initial intake minimal; sensitive evidence should be collected only through a secure channel.

### cases / case_assignments / case_status_events
cases: id, service_request_id, case_reference, scope_summary, engagement_status, status, created_at, updated_at.
case_assignments: id, case_id, staff_user_id, assigned_by, assigned_at, revoked_at.
case_status_events: id, case_id, actor_user_id, from_status, to_status, reason, created_at.
Do not imply a lawyer-client relationship before engagement is expressly accepted under reviewed terms.

### documents / document_access_events
documents: id, owner_user_id, case_id (nullable), listing_id (nullable), private_storage_key, document_category, original_filename, mime_type, size_bytes, checksum, scan_status, retention_until, created_at, deleted_at.
document_access_events: id, document_id, actor_user_id, action, purpose, created_at, request_id.
Never return raw storage keys or unrestricted URLs to clients.

## Content and operations
### content_items
id, content_type, slug, title, body, language, status, author_user_id, reviewer_user_id, published_at, updated_at.
Content types can include article, FAQ, video, service page and testimonial. Testimonials require documented consent and withdrawal handling.

### audit_events
id, actor_user_id, action, resource_type, resource_id, before_summary, after_summary, request_id, created_at.
Avoid copying sensitive document contents or secrets into audit payloads.

### consent_records
id, user_id (nullable), consent_type, notice_version, granted_at, withdrawn_at, source.
Store the exact notice version and purpose.

## Indexes and constraints
- Unique public_reference and case_reference.
- Unique (listing_id, revision_number).
- Index public listing queries by public_status, district/upazila, property_type, price_amount and updated_at as supported by actual query patterns.
- Index seller_user_id, listing_id, case_id, assignment resource, status and created_at for scoped operations.
- Check non-negative price/area/size values; enforce allowed currency, units and status values.
- Foreign keys should use restrictive deletion for audit and legal records; define a separate approved retention/purge process.
- Add database-level row access policies where supported; test with anonymous, client, seller, reviewer, coordinator and administrator identities.

## Search and public API boundary
Public search returns only published listing revisions and explicitly approved fields/media. Never return seller identity evidence, private addresses/coordinates, reviewer notes, private storage keys, inquiry messages, or unreviewed fields.

## Open decisions
Database/provider; authentication; row-level security; tenancy; bilingual search; geospatial indexing; retention periods; document encryption/key management; audit immutability; backup and restore requirements.
