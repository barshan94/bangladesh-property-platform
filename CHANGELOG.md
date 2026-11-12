# Changelog

All notable project changes should be recorded here. Use dates and link commits or pull requests where possible.

## 2026-11-12 — Supabase backend foundation
- Created a separate Supabase Free project in the MRA account; existing MRA and Primary projects were left untouched.
- Added 11 PostgreSQL application tables, constraints, indexes and RLS policies.
- Added seller-owned listing access, published-only anonymous listing reads and trusted staff-role read claims.
- Separated private property details from public listing fields.
- Kept inquiries, service requests, private document metadata, consent and audit tables server-only.
- Created a private evidence bucket with a 15 MiB PDF/JPEG/PNG policy and no client Storage policies.
- Generated and committed database TypeScript types and the initial SQL migration source.
- Verification confirmed all 11 tables have RLS enabled and private client access is denied. Advisor follow-up and repository CI are pending.
- This is a backend foundation only; authentication UI, server routes, scanning, document handling, moderation transactions and deployment are not complete.

## 2026-11-12 — Documentation foundation
- Added project charter, product requirements, feature scope, roles, user flows, service catalogue, verification policy, compliance review checklist, architecture proposal, security guidance, data/API design principles, UX/content strategy, testing, deployment, backup, and open questions.
- No production deployment, legal-service capability, verified property inventory or live contact channel is claimed.
