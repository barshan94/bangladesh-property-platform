# User Roles and Permissions

## Roles and trusted source

Authorization is enforced by database RLS and PostgreSQL transition triggers using trusted Supabase JWT `app_metadata.roles` claims. User-editable `user_metadata` is never an authorization source.

- **Visitor:** view public pages and published listings.
- **Client:** manage own profile and, once implemented, own inquiries, service requests and case documents.
- **Seller:** create and manage own eligible drafts and submit them for review; cannot approve or publish.
- **Listing reviewer:** inspect submitted listings, move them into review, and request changes, approve or reject with a reason.
- **Listing publisher:** publish approved listings and perform permitted post-publication lifecycle actions.
- **Content editor:** manage approved public articles, FAQs, videos and service content when a CMS is implemented.
- **Intake coordinator:** triage new inquiries and service requests when those workflows are implemented.
- **Case manager:** access assigned service requests and permitted documents when assignment controls are implemented.
- **Administrator:** manage trusted role assignments and platform configuration through a secure management-only process; no self-service role assignment exists.
- **Security/audit reviewer:** read permitted security and audit records without unnecessary access to case content.

## Implemented boundaries

- Deny by default; enforce permissions in database RLS and server-side actions.
- Sellers can read their own listings; anonymous users can read only published listings.
- Reviewers can read the moderation queue and use the database lifecycle RPC for reviewer transitions.
- Publisher-only transitions control publication; reviewer approval alone does not publish.
- Status history and audit events are appended atomically by database triggers.
- No client insert/update policy exists for `user_roles`; a user cannot grant themselves staff permissions.
- Private exact location and evidence records are not exposed through public listing queries.

## Operational limitations

- Reviewer workspace exists but requires a trusted reviewer claim before use.
- No staff role provisioning/revocation interface or bootstrap administrator identity is configured.
- Publisher workspace, assignment-based access, MFA enforcement and live JWT/RLS integration tests remain outstanding.
- A listing moderation decision is not a legal title opinion, ownership certificate or physical inspection.
- Qualified legal professionals require separate qualification checks and engagement-scoped access before any legal service is offered.

## Security requirements

- Privileged actions require audit events.
- Revoke access promptly when roles or engagements end.
- Use MFA for staff and administrators where supported.
- Never accept a role from a form field, query parameter, browser storage or user-editable metadata.
