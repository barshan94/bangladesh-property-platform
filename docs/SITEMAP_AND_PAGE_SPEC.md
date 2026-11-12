# Sitemap and Page Specifications

**Status:** Product specification — not yet implemented.

## Product experience

The website is both a corporate trust and lead-generation site and a property marketplace. Legal/advisory services, educational content, property discovery, and remote-client assistance must feel like one coherent Bangladesh-focused service.

## Primary navigation

1. Home
2. Buy Property
3. Sell Property
4. Property Services
5. Knowledge Hub
6. About Us
7. Contact

Persistent header actions: **Call an Expert** and **Request a Consultation**. On mobile, use a compact sticky action bar without covering page content or accessibility controls.

## Public routes

| Route | Purpose | Primary action |
|---|---|---|
| / | Explain the company and route visitors to properties or services | Explore properties / Talk to an expert |
| /properties | Search and browse approved public listings | View property |
| /properties/[slug] | Property details, media, location, status and inquiry | Inquire / Request visit |
| /buy-property | Explain buying support and eligibility considerations | Submit buyer inquiry |
| /sell-property | Explain seller process and listing requirements | Submit property |
| /services | Overview of property-specific services | Request confidential evaluation |
| /services/[slug] | Scope, process, required documents, limitations and FAQs | Request consultation |
| /about | Company, operating model, team and accountability | Contact the team |
| /why-choose-us | Evidence-based trust proposition and process transparency | Speak to an expert |
| /knowledge | Searchable articles and guides | Read article |
| /knowledge/[slug] | Educational article with author/reviewer and update date | Related service / contact |
| /videos | Educational and expert video library | Ask a question |
| /faqs | Categorized answers with clear escalation to a human | Contact an expert |
| /testimonials | Approved written/video client feedback | Request consultation |
| /contact | Contact details, hours, map if appropriate, and inquiry form | Send inquiry |
| /consultation | Consultation request and preferred contact/time | Submit request |
| /privacy | Privacy notice and data handling summary | Contact privacy owner |
| /terms | Website and service terms | Contact the company |

## Service catalogue

Initial proposed service groups; public availability and exact legal scope require local professional approval.

### Ownership and verification
- Title search and record review
- Ownership/document verification
- Land survey and boundary coordination

### Buying, selling and transfer
- Property purchase/sale assistance
- Deed and registration coordination
- Transfer and mutation assistance

### Inheritance and ownership rights
- Succession and inheritance assistance
- Partition of jointly owned property
- Adverse possession matters

### Disputes
- Developer-related property claims
- Property litigation and dispute referrals/representation, where qualified counsel is engaged
- Landlord and tenant disputes

### Finance and compliance
- Property-related banking and mortgage coordination
- Property tax and transaction-tax guidance through qualified professionals
- Building approval and regulatory compliance assistance

Do not publish a service as available until the operating team, professional qualification, geographic coverage, fee model, and service limitations are confirmed. Do not use India-specific RERA claims as if they were Bangladesh law.

## Homepage section order

1. Header with clear navigation and expert contact.
2. Hero: concise Bangladesh property assistance proposition for local and overseas clients.
3. Property search entry: location, property type, budget and buy/sell intent.
4. Trust proof: real operating facts only — team credentials, office, process, verified partner details.
5. Service categories with links to dedicated detail pages.
6. How it works: submit request → scope and eligibility review → agreed engagement → progress updates.
7. Featured approved properties.
8. Remote-owner support: inspection, document coordination and case communication, only where operationally offered.
9. Expert call/consultation CTA.
10. Latest educational articles.
11. Educational videos.
12. Client testimonials with documented consent.
13. FAQs.
14. Confidential evaluation CTA.
15. Contact details and footer.

## Forms and lead routing

### General contact
Fields: name, email or phone, country/time zone (optional), preferred contact method, topic, message, consent acknowledgement.

### Property inquiry
Fields: property reference, inquiry type, name, contact channel, message, preferred visit/consultation time (optional).

### Seller submission
Collect property location, property type, size, asking price (optional), ownership/authority declaration, contact details and supporting files. New submissions remain private and pending review.

### Confidential legal/property evaluation
Collect service category, short issue description, location, urgency, preferred contact method, and private PDF/JPG evidence uploads. Explain that submitting a form does not create a lawyer-client relationship or guarantee acceptance unless the operating model and counsel approve that wording.

Forms must show validation errors, success/failure states, privacy notice links, and a safe alternative contact method. Never expose uploaded files through public URLs.

## Content and trust requirements

- Every service page states scope, process, indicative document checklist, exclusions, and how to request help.
- Every legal article identifies author/reviewer, publication date, last-reviewed date, jurisdiction, and educational disclaimer.
- Testimonials require explicit publication consent and must not imply guaranteed outcomes.
- Video embeds must not autoplay with sound.
- Do not fabricate staff, offices, client reviews, credentials, property listings, verification badges, or success rates.

## Listing status vocabulary

Use distinct states:
- Draft
- Submitted
- Under review
- Published
- Rejected
- Suspended
- Archived

A listing being published or moderated does **not** mean its title has been legally verified. A title-review badge must describe the precise checks performed, reviewer, date, scope, and limitations.

## Localization and accessibility

- Plan for Bangla and English content; confirm launch language before translation work.
- Use semantic headings, keyboard-operable controls, visible focus, labels, error summaries, alt text, and sufficient contrast.
- Support mobile layouts and slow connections; optimize images and avoid unnecessary motion.
- Display phone numbers in international format and provide time-zone-aware consultation scheduling if that feature is offered.
