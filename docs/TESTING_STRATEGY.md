# Testing Strategy

## Test layers
- Unit: validation, state transitions, and permission rules.
- Integration: database constraints, storage authorization, and notifications. The database CI workflow now creates real local Supabase Auth users, signs in to obtain JWTs, and exercises anonymous, seller, reviewer, publisher and administrator RLS boundaries. The integration script is committed; its first run exposed a missing npm dependency-install step in this workflow, now corrected, with verification pending.
- End-to-end: search, inquiry, seller submission, moderation, consultation, case intake, and client access.
- Security: authorization bypass, IDOR, upload abuse, rate limiting, session handling, and secret exposure. The Node test suite includes a regression check that Supabase auth refresh preserves middleware response headers and previously attached cookies, plus private-document upload rate-limit and request-body cap assertions. The isolated SQL probe verifies the server-only upload rate RPC blocks the 11th per-owner attempt in a one-hour window. A separate Auth integration script uses real access tokens to test published-only anonymous reads, seller-owned draft visibility, cross-seller denial, staff role visibility and user_roles isolation. These are local integration tests; deployed browser E2E remains outstanding.
- Accessibility: automated checks plus keyboard, screen-reader, zoom, and contrast review.
- Performance: mobile Core Web Vitals, image delivery, search latency, and upload behavior.
- Recovery: backup restoration and incident exercises.

## Critical test cases
- Client A cannot read Client B's case or files.
- Public visitors cannot access private evidence.
- Seller cannot publish directly or change review outcomes.
- Listing moderation does not set a legal title-verification status.
- Unauthorized staff cannot access unassigned cases.
- Revoked users lose access.
- Malformed, oversized, mismatched, or unsafe uploads are rejected.
- Repeated requests do not duplicate critical state transitions.
- Forms work on mobile and keyboard-only navigation.

## Release gates
No production release with unresolved critical/high security issues, unreviewed legal claims, untested restore process, missing incident owner, or broken core user journeys. Record test commands, environment, results, and known limitations.
