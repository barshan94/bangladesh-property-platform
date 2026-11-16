# Website administrator panel and service content guide

## Where the client signs in

1. Open the website and select **Sign in**.
2. Sign in using the administrator account created by the project operator.
3. Open **Open website admin panel** from the account workspace, or visit `/dashboard/admin`.
4. Use the management links on that page. Normal service content, staff access and workflow review is handled in the website, not by editing source files.

The administrator panel is protected by the signed-in user's trusted administrator role. It does not grant roles to itself.

## Invite staff and manage access

1. From the administrator panel, open **Staff accounts and roles**.
2. Enter the staff member's email address and choose the minimum role they need.
3. Select **Send invitation and assign role**. The person receives an account invitation through the configured Supabase Auth email service.
4. To change an existing user's access, select a role and choose **Grant** or **Revoke** on that user's account card.
5. Ask the staff member to accept the invitation and sign in again so their updated permissions are loaded.

The first administrator still needs one-time secure bootstrap by the project operator. Later staff invitations and role changes can be handled in this website screen. Email invitation delivery depends on the client's configured Auth email provider.

## Edit the six homepage services

1. In the administrator panel, open **Property services**.
2. Find the service you want to change.
3. Edit its full explanation.
4. Optionally paste a public HTTPS YouTube video link, a public HTTPS Facebook video link, or both.
5. Select **Save** for that service.
6. Open the matching public service detail page and confirm the text and videos display correctly.

The editor includes all eight service codes currently used by the platform. Six are shown on the homepage; two additional services are present in the wider service catalogue. Existing service titles, short summaries and process bullets remain application-managed; the editable fields are the long explanation and the two video links.

Video availability depends on the video being public or embeddable under the provider's privacy settings. A private, restricted, deleted or region-blocked video may not play on the website. Use only videos the client has permission to publish.

## Handle public website inquiries

1. Open **Customer inquiries** from the administrator panel.
2. Read the customer's contact details, selected service and message.
3. Select **Reply using business email** to open the device's email application with the customer's address.
4. Send the actual reply from the approved business email account.
5. Return to the website and save a follow-up note recording what was done and what happens next.

**Important:** The website inbox does not send email itself in this release. It opens the email application; the staff member must send the reply there. Follow-up notes are private internal records and are not visible to the customer. Automatic email delivery, customer reply threads and notifications are not implemented.

## Property records\n\nThe administrator panel now includes **All property records**. It can search across all sellers’ records and filter by workflow status. This is currently a read-and-find workspace: it does not edit another seller’s listing or bypass the reviewer/publisher lifecycle. Use the dedicated reviewer and publisher queues for authorized decisions.\n\n## Other website management workspaces

- **Service requests:** review, assign and update authenticated service requests.
- **Property listing review:** review seller-submitted listings. The administrator account also needs the listing reviewer role.
- **Property publication:** publish approved listings. The account also needs the listing publisher role.
- **Property image review/publication:** moderate and publish ordinary property photographs using the relevant reviewer/publisher roles.
- **Knowledge Hub:** manage article and video drafts, review and publication.

## What still needs operator setup

- The two new database migrations in this feature must be reviewed and applied to the correct Supabase project before the service editor and inquiry follow-up history can work.
- The server-only `SUPABASE_SECRET_KEY` must be configured for the inquiry inbox. Never expose it in browser code or public environment variables.
- The first administrator still needs one-time secure operator bootstrap. After that, administrators can invite staff and grant or revoke roles in the website Staff accounts screen. Supabase Auth email delivery must be configured for invitations.
- A proper in-website email sender and customer reply history require a selected email provider, server credentials, sender-domain verification and delivery tests.
- The property records workspace requires the server-only `SUPABASE_SECRET_KEY`; property moderation and publishing links only work for staff accounts that have the corresponding role. The administrator must be granted reviewer and publisher roles separately when they need those duties.

Do not apply the migrations to the live database until the existing migration-history reconciliation and recovery gates have been completed and authorized.
## Administrator work overview

The admin home page displays live counts for submitted/under-review property listings, new/triaged website inquiries, and new/triaged service requests. These are operational queue counts, not total business metrics. The counts require the server-only `SUPABASE_SECRET_KEY` and the relevant database tables/migrations; if the secure connection is unavailable, the page displays a clear unavailable message rather than misleading zeroes.
