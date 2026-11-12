

## 2026-11-12 — Listing status audit-event builder
- Added `src/lib/listing-status-event.mjs`, its TypeScript declaration and `tests/listing-status-event.test.mjs`.
- The builder validates lifecycle transition and actor-role policy, strict fields and safe identifiers, canonical UTC timestamps, and reviewer-decision reasons; it returns a frozen event record.
- GitHub Actions run 43231201404 passed dependency audit, domain tests, TypeScript, ESLint and production build at commit c3fb9101a874b9f62fee05da67d87855566623c2.
- Scope limitation: this is not authentication, authoritative role/assignment verification, database persistence, concurrency control or a durable audit log. A future server action must atomically persist state and event after trusted authorization.
