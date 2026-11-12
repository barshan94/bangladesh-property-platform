# Bangladesh Property Platform

A Bangladesh-focused real estate marketplace and property assistance platform designed for local clients and people living overseas who need trustworthy, locally coordinated help with property matters.

> **Project status:** Documentation and product definition. No production services, legal services, listings, or verification outcomes are live unless explicitly documented as implemented and independently checked.

## What we are building

The platform combines:

1. **Real estate marketplace** — discover properties, review listing details, submit a property for review, and contact the platform about buying or selling.
2. **Property legal and verification assistance** — request help with title searches, ownership records, transfer and mutation, inheritance, partition, developer disputes, tenancy matters, and related property issues.
3. **Remote property assistance** — request local inspections, document coordination, power-of-attorney process assistance, and property-management support where the service is actually available.
4. **Trust and education** — company information, expert profiles, service explanations, articles, videos, FAQs, testimonials, consultation booking, and contact channels.

## Intended audience

- Bangladesh-based buyers, sellers, owners, heirs, and landlords.
- Non-resident Bangladeshis and overseas clients with property interests in Bangladesh.
- Other foreign nationals or investors only where their eligibility and proposed transaction are confirmed by qualified Bangladesh legal counsel.

**Important:** Foreign nationality does not automatically create a right to acquire or hold every type of property in Bangladesh. The platform must screen the client's status and transaction and must not advertise an ownership right without current legal review.

## Documentation

- [Project definition](PROJECT.md)
- [Product requirements](docs/PRODUCT_REQUIREMENTS.md)
- [Sitemap and page specifications](docs/SITEMAP_AND_PAGE_SPEC.md)
- [MVP acceptance criteria](docs/MVP_ACCEPTANCE_CRITERIA.md)
- [Decision log](docs/DECISION_LOG.md)
- [Features and scope](docs/FEATURES.md)
- [Roadmap](ROADMAP.md)
- [Architecture](ARCHITECTURE.md)
- [Roles and permissions](docs/USER_ROLES_AND_PERMISSIONS.md)
- [User flows](docs/USER_FLOWS.md)
- [Legal services catalogue](docs/LEGAL_SERVICES.md)
- [Property verification policy](docs/PROPERTY_VERIFICATION.md)
- [Property listing lifecycle and moderation policy](docs/PROPERTY_LISTING_LIFECYCLE.md)
- [Property listing data model](src/types/property.ts)
- [Bangladesh legal and regulatory review](docs/BANGLADESH_LEGAL_COMPLIANCE.md)
- [Security and privacy](docs/SECURITY_AND_PRIVACY.md)
- [Database design](docs/DATABASE_SCHEMA.md)
- [API design](docs/API_DESIGN.md)
- [Content and SEO strategy](docs/CONTENT_AND_SEO_STRATEGY.md)
- [UI/UX guidelines](docs/UI_UX_GUIDELINES.md)
- [Testing strategy](docs/TESTING_STRATEGY.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Backup and recovery](docs/BACKUP_AND_RECOVERY.md)
- [Open questions](docs/OPEN_QUESTIONS.md)
- [Decision and project memory](MEMORY.md)
- [Changelog](CHANGELOG.md)
- [Contributing](CONTRIBUTING.md)
- [Security reporting](SECURITY.md)

## Current truth

A Next.js website scaffold, static public pages, typed public-property model, searchable catalogue UI and property detail route are implemented. The public inventory is intentionally empty; inquiry/contact forms are non-functional prototypes. No backend, database, authentication, private uploads, CMS, live listing workflow, legal team, or production deployment is evidenced as operational. Documentation describes intended behavior, not deployed functionality. Roadmap items must only be marked complete after evidence is recorded.

## Safety and trust principles

- Never expose private client documents or credentials in source control.
- Keep uploaded legal and identity documents in private storage with least-privilege access.
- Distinguish listing moderation from legal title verification.
- Record what was checked, by whom, when, against which records, and with what limitations.
- Do not present automated outputs as legal advice or a guarantee of ownership.
- Validate all jurisdiction-specific legal workflows with qualified Bangladesh counsel before launch.
- Publish only listings for which the platform has an appropriate permission and moderation basis.

## Getting started

The initial milestone is product validation and architecture definition. Implementation instructions, environment variables, deployment steps, and operational owners will be added only after the relevant technology and service decisions are approved.

## License

No open-source license has been selected. Unless a license is added, all rights are reserved by the repository owner.
