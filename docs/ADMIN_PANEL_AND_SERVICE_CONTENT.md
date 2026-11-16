# Website administrator panel and service content guide

## Sign in and open the control panel

1. Open the website and select **Sign in**.
2. Sign in with the administrator account created during the one-time initial setup.
3. Open **Website management** from the account workspace, or visit `/dashboard/admin`.
4. Use the management links on the administrator page. Routine website content and inquiry work is managed here, not by editing source code.

The panel is restricted to a signed-in user with the active administrator role. It does not grant administrator access to itself.

## Manage service pages and videos

1. From the administrator panel, open **Property services**.
2. Select the service you want to edit.
3. Update the full explanation in the service editor.
4. Optionally add a public HTTPS YouTube video link, a public HTTPS Facebook video link, or both.
5. Save the service and open its public detail page to check the result.

The editor covers all eight service codes in the catalogue. Six are displayed on the homepage. Each service has its own public detail page and its own optional video links. Use only videos the business has permission to publish. Videos must be public or configured to allow embedding; private, restricted, deleted or region-blocked videos may not play.

## Manage property records across sellers

1. Open **All property records** from the administrator panel.
2. Search by public reference, property title or district. You can also filter by listing status.
3. Open **Edit property content** on the property you need to correct.
4. Update the property description, type, location, price, area, rooms or occupancy details.
5. Save the changes. The website records before-and-after content in its audit history.

This editor does not let an administrator change the seller/owner, public reference, listing status or publication state. Listing review and publication decisions remain in their separate role-protected workspaces. The editor does not verify property ownership, title, physical condition or legal compliance.

## Handle customer inquiries

1. Open **Customer inquiries** from the administrator panel.
2. Read the customer's contact details, selected service and message.
3. Change the inquiry status when work progresses: new, triaged, assigned, in progress, resolved, closed or spam.
4. Select **Draft customer reply in business email** to open a prepared message in the device's email application.
5. Review and send the message using the client's approved business email account.
6. Return to the website and save an internal follow-up note recording what happened and what needs to happen next.

Internal notes are visible to authorized administrators only; they are not customer messages. Status changes and property corrections are recorded in the audit history.

**Important:** The website does not send customer email automatically and does not maintain customer-visible reply threads. Staff must send the prepared email themselves. Automatic email delivery requires a selected provider, verified business sender/domain, server configuration and delivery testing.

## Invite staff and manage access

1. From the administrator panel, open **Staff accounts and roles**.
2. Enter the staff member's email address and select only the role they need.
3. Choose **Send invitation and assign role**.
4. To change access for an existing account, use the relevant **Grant** or **Revoke** control.
5. Ask the staff member to accept the invitation and sign in again so the updated permissions are loaded.

Invitation delivery depends on the client's Supabase Auth email configuration. The first administrator still requires a one-time secure operator bootstrap. Later staff invitations and role changes are managed through the website.

## Other management workspaces

The administrator panel links to these existing work areas:

- **Service requests:** review incoming requests, assign staff and update their workflow status.
- **Property listing review:** review seller-submitted listings. The account also needs the listing reviewer role.
- **Property publication:** publish approved listings. The account also needs the listing publisher role.
- **Property image review/publication:** moderate and publish ordinary property photographs using the relevant reviewer/publisher roles.
- **Knowledge Hub:** create, review and publish articles and video content.
- **My account and listings:** return to the administrator's own account and personal listing records.

The administrator panel is a central navigation and overview page. Some actions require additional roles; an administrator role alone does not silently grant reviewer or publisher permissions.

## Initial setup and limitations

The service editor, administrator property tools and inquiry workflow depend on the corresponding database migrations being applied. The server-only `SUPABASE_SECRET_KEY` is required for protected cross-seller record and inquiry reads. It must never be exposed in browser code or a `NEXT_PUBLIC_` variable.

Do not apply pending migrations to the live database until the migration history and schema have been reconciled and a safe recovery plan has been approved. Do not enter real customer information until the production database, authentication, hosting, privacy and operational setup are complete.

Payments/escrow and confidential legal-document exchange are not part of this first version. Do not use the website to collect identity documents, title deeds, ownership evidence or confidential case attachments.
