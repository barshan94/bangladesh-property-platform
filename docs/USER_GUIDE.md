# Website user guide — Bangladesh Property Platform

This guide explains the current application interface for visitors, buyers, sellers and clients. It describes the features implemented in the source code and clearly identifies features that are not yet activated on the remote/live environment.

## Important: check availability before using

The website is deployed at [bangladesh-property-platform.vercel.app](https://bangladesh-property-platform.vercel.app). The homepage and public property catalogue have been verified to render over HTTPS. This does **not** mean every workflow is live. The dedicated Supabase project records 10 migrations; 18 repository migrations (versions 10–27) remain unapplied. Seller moderation, image publication, map projection and Knowledge Hub content depend on those pending migrations. The catalogue currently works but contains zero published listings.

The public property catalogue currently has no published inventory. An empty catalogue is intentional; the platform does not invent sample properties, reviews or testimonials.

## 1. Browse the public website

1. Open the website address supplied by the platform operator.
2. Use the homepage navigation to explore **Properties**, **Services**, **How it works**, **Insights**, **About** and **Contact**.
3. Open **Properties** to browse listings that have completed the platform publication process.
4. Select a property card to open its detail page. Review the displayed location, property type, sale/rent/lease purpose, price and other supplied facts.
5. Use the available search and filters to narrow results by keyword/location, district, property type, purpose, price range, area, bedrooms and bathrooms.
6. Read the listing disclosures. A published listing or moderation decision is not proof of ownership, title clearance, legal eligibility, inspection or property condition.

If no properties are shown, it means there are currently no published listings available. It does not mean the search is broken.

## 2. Send a general inquiry (no account required)

1. Go to the **Contact** section on the homepage.
2. Complete the fields shown in the inquiry form and provide only the information needed for the team to understand your request.
3. Read and accept the consent statement.
4. Submit the form and keep any reference or confirmation displayed.
5. If submission fails, check the validation message and try again later. Repeated submissions may be rate-limited.

**Do not enter** NID/passport numbers, passwords, bank/payment information, deed contents, ownership evidence or confidential case details. This is an initial inquiry channel, not a secure document exchange or a confirmed service engagement.

## 3. Create an account and sign in

1. Choose **Sign in** in the site header.
2. Use the sign-up option to register with your email address and a password that meets the displayed password requirements (the current implementation requires at least 12 characters).
3. Complete the email confirmation step if it is requested.
4. Return to **Sign in** and log in with your registered email and password.
5. Use the password-reset option if you cannot sign in. Follow the email link to set a new password.
6. After signing in, open your account workspace at `/dashboard`. Use **Sign out** when finished on a shared device.

Email confirmation, password reset and sign-in depend on the operator configuring Supabase Auth email delivery and the correct website callback URLs. If email does not arrive or a callback fails, contact the platform operator; do not create repeated accounts.

## 4. Submit a property listing as a seller

This workflow is intended for a seller account. It is not available to anonymous visitors.

1. Sign in and open **My property listings** from your account workspace (`/dashboard/listings`).
2. Select **Create property draft**.
3. Enter a clear title and description. Select the listing purpose (sale, rent or lease) and property type.
4. Enter the division and district; add the upazila/thana and locality when known.
5. Add a public location label. Approximate map latitude and longitude are optional, but must either both be supplied or both be left blank.
6. Add the price in BDT if known.
7. Enter area value, unit and basis together. For example, choose the correct unit (square feet, square metres, katha, decimal or acre) and whether it describes land, floor, built-up, carpet or gross area.
8. Add bedroom and bathroom counts where relevant.
9. Select **Save private draft**. The draft belongs to your account and is not publicly visible.
10. Return to **My property listings**. For a draft, you can add an image using the image control if that workflow is enabled, then select **Submit for review**.
11. Check the status shown on your listing card. If changes are requested, follow the review feedback provided through the platform's agreed communication process and update/resubmit as instructed.

A seller cannot publish their own listing. Review and publication are separate decisions. A submitted or approved listing is not automatically public. The live image and listing workflow must not be treated as available until the operator has applied the required migrations and verified it on the deployed host.

**Do not upload private ownership, identity, title or case documents.** The MVP does not support confidential document exchange. Listing-image upload, where enabled, is only for ordinary property photographs.

## 5. Create and track a service request

Authenticated clients can use the service-request workspace.

1. Sign in and open **My service requests** (`/dashboard/service-requests`).
2. Complete your name, contact information, country of residence, service category, property district (if relevant) and a short description.
3. Tick the consent checkbox and submit.
4. Keep the request reference shown after successful submission.
5. Return to this page to view your own request history and the latest administrative status.

The current form supports general requests such as title/record review, buying/selling support, transfer/mutation, inheritance/succession, partition/co-ownership, property disputes, remote property support, and property tax/finance. Submitting a request does not mean the service has been accepted, a professional has been engaged, or legal advice has been provided.

The intake is rate-limited to five requests per user in a 15-minute period. No attachments are accepted. Do not include NID/passport numbers, deed contents, bank details, passwords or confidential evidence in the description.

## 6. Read the Knowledge Hub

1. Open **Insights** on the homepage or visit `/knowledge`.
2. Select a published article or video.
3. Check its jurisdiction, author/contributor and review/publication information.
4. Treat content as general information, not case-specific legal advice.

Only published content is intended to be public. Editorial CMS activation depends on the pending remote migrations and approved content being supplied and reviewed.

## 7. Understand property map pins

Where a listing has seller-supplied coordinates, the public map shows an approximate location. Public coordinates are rounded to two decimal places to reduce exact-address exposure. This is not a precise meeting point, navigation service or guarantee of the property's exact location. Some listings will have no map pin.

## 8. What this release does not provide

- Confidential document upload, malware scanning, OCR, secure document downloads or document exchange. Related upload, scanner-callback and recovery endpoints are disabled and return HTTP 410.
- Online payments, escrow, rent collection or transaction execution.
- Automated legal advice, legal representation or guaranteed service availability.
- Proof of title, ownership, title clearance, property inspection or guaranteed listing accuracy.
- Guaranteed listing inventory, reviews, testimonials, staff response times or service outcomes.
- Automatic geocoding, exact-address public pins, route planning or travel-time estimates.

If the service team needs confidential documents, ask them to provide a separately approved secure channel for your specific matter. Do not improvise by sending them through inquiry text, service-request descriptions or ordinary email.

## 9. Getting help

For account, confirmation-email, unavailable-feature or submission problems, contact the platform operator using the business contact details published on the live website. Include the page, approximate time and any non-sensitive reference/error message. Never send passwords, API keys or confidential documents when reporting a problem.
