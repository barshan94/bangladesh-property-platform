# Testing Strategy

## Test layers
- Unit: validation, state transitions, and permission rules.
- Integration: database constraints, storage authorization, and notifications.
- End-to-end: search, inquiry, seller submission, moderation, consultation, case intake, and client access.
- Security: authorization bypass, IDOR, upload abuse, rate limiting, session handling, and secret exposure.
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
