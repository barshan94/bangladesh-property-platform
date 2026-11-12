# User Roles and Permissions

## Proposed roles
- **Visitor:** view public pages and published listings; submit public inquiries.
- **Client:** manage own profile, inquiries, consultation requests, saved listings, and own case documents/status where enabled.
- **Seller:** submit and manage own draft listing submissions; cannot publish directly.
- **Content editor:** manage approved public articles, FAQs, videos, and service content.
- **Listing reviewer:** review listing evidence and moderate publication.
- **Case coordinator:** access assigned service requests and permitted documents.
- **Qualified legal professional:** access assigned legal matters within the engagement and professional scope.
- **Administrator:** manage users, roles, listings, leads, content, and configuration.
- **Security/audit reviewer:** read relevant security and audit records without unnecessary access to case content.

## Permission principles
- Deny by default; grant least privilege.
- Enforce permissions server-side, not only in the UI.
- Clients can access only their own records.
- Staff access is limited by assignment and job function.
- Privileged actions require audit events.
- Do not let a listing reviewer issue a legal title opinion unless separately qualified and authorized.
- Separate content publishing, listing approval, and legal verification permissions.
- Use MFA for staff and administrators where supported.
- Revoke access promptly when roles or engagements end.

## Unresolved
Define role names, separation-of-duty requirements, identity checks, delegated access, and emergency access before implementation.
