# What Is Not Included Yet — Client Guide

**Project:** Bangladesh Property Platform  
**Purpose:** This document explains, in plain language, what is not included in the current handover, why it is not included, and what would be needed before the website is opened to real customers.

## 1. What you are receiving

The handover is a source-code implementation of the property website and its main workflows, together with setup and user documentation. It is suitable for the client to review, run in a development/staging environment, and continue developing.

**Important:** “Ready to deliver” means the development work and handover materials can be delivered for review. It does **not** mean the website is already configured, approved, and ready to operate as a public real-estate business.

## 2. Items not completed or not included

| Item | What this means in everyday language | Why it is not included / what is needed |
|---|---|---|
| Final live database update | The online database has not been updated with all database changes still waiting to be applied. | Applying database changes to the live service can affect existing data. The database differences must first be checked, a safe recovery plan prepared, and the client must approve the update. |
| Final public website address and commercial hosting | The website is not yet launched on a client-owned public domain with hosting suitable for the business. | The current hosting account is a limited free plan and has access protection enabled. The client must choose and provide the domain and suitable hosting/account access. No paid service has been purchased as part of this work. |
| Real customer email setup | Password/login emails and other customer emails are not confirmed as working from the final business website address. | The client must choose and configure an email-sending service, sender address, and website address/redirect settings, then test real email delivery. |
| CAPTCHA / anti-spam setup | The final public forms have not been confirmed with the client's chosen anti-spam service. | The client must choose and configure the service and provide its settings securely. |
| Business content and property listings | The site does not come with the client's final properties, photos, company details, or approved marketing text. | These must be supplied and approved by the client. Property information and images should be checked before publication. |
| First administrator bootstrap | The website now includes a staff screen where an active administrator can invite staff and grant or revoke their roles. The very first administrator still needs one-time setup by the project operator. | This initial bootstrap is deliberately protected so nobody can create their own administrator access. Invitation emails also require working Auth email configuration. |
| Complete backup and full recovery | A database-only backup restore was tested in an isolated test environment. This is not a complete copy of everything needed to rebuild the live website. | Full recovery also needs a plan for user accounts, uploaded image files, website settings, email/anti-spam settings, and other service configuration. The client must choose where backups are stored and who is responsible for them. |
| Manual accessibility review | Automated accessibility checks are included, but a person has not completed every manual accessibility check. | Before public launch, test using keyboard-only navigation, screen readers, enlarged text/zoom, and actual phones and computers. |
| Legal and privacy approval | The website's final legal wording and business policies have not been approved on behalf of the client. | The client should provide and approve its privacy notice, terms, property-listing rules, consent wording, and any Bangladesh-specific legal requirements with an appropriate adviser. |
| Automatic inquiry email replies | The website now has an administrator inquiry inbox, internal follow-up notes and a link to reply in the business email app. It does not send email from inside the website or keep customer reply threads. | A business email provider, verified sender domain, server credentials and delivery testing are required before automatic website email replies can be added. |
| Day-to-day operating responsibility | No named person has been appointed to handle customer complaints, listing moderation, staff access, incidents, and backup checks. | The client must assign an owner and agree how these tasks will be handled. |

## 3. Features intentionally left out of this version

These are not accidental omissions. They are outside the agreed first-version scope or were excluded to avoid handling sensitive information without the necessary safeguards.

### Online payments, deposits, and escrow

The current version does not collect booking fees, deposits, rent, purchase money, or hold money between buyers and sellers.

**Why:** Handling money requires a payment provider, business verification, security controls, refund/dispute processes, and legal/compliance decisions. These should be designed and approved as a separate project phase.

### Confidential document exchange

The current version is not intended to collect or store identity cards, passports, title deeds, ownership proof, or other confidential legal documents. Related confidential-document upload routes are disabled.

**Why:** These files are highly sensitive. A proper document-handling process needs stronger privacy, access, scanning, retention, and incident-response arrangements. Do not ask customers to upload these documents to this version.

## 4. What was tested — and what that does not prove

- The project has automated checks for code quality, type checking, and production builds.
- Database migration replay and database permission/security checks have been run in an isolated test environment.
- An encrypted database-only backup was restored and checked in an isolated test environment. This does not prove full recovery of user accounts, uploaded files, or all service settings.
- Automated browser and accessibility checks exist for key pages and user flows. A successful run must be confirmed for the exact delivered revision before describing those checks as passed.
- Automated checks do not replace real-world testing with the client's final domain, email settings, staff accounts, content, phones, and browsers.

## 5. Recommended steps before opening the website to customers

1. Agree the final domain and hosting account.
2. Review the live database differences and approve a safe database update plan.
3. Configure and test customer email, login redirects, and anti-spam protection.
4. Add the client's approved company information, property listings, and images.
5. Create and test the real admin and staff accounts.
6. Complete the full backup/recovery plan and assign someone to maintain it.
7. Complete manual accessibility, privacy, legal, and real-device checks.
8. Run an end-to-end acceptance test on the final public website before announcing it.

## 6. Handover boundary

The developer's handover includes the source code and the project documentation available in the repository. It does not include purchasing hosting or domain services, operating the client's business, supplying real property data, legal approval, or ongoing monitoring/support unless these are separately agreed in writing.

**Please do not use the current development/staging setup as the public business website or enter real customer information until the launch steps above have been completed.**
