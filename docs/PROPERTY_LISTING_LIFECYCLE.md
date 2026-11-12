

## Implemented status-event builder (domain utility only)

`src/lib/listing-status-event.mjs` exports `createListingStatusEvent(input)`. It validates the requested transition against the listing lifecycle policy, checks the actor role permitted for that transition, enforces a strict field allowlist and bounded safe identifiers, requires a canonical UTC timestamp, and returns a frozen event record. Reviewer decisions from `under_review` to `changes_requested`, `approved` or `rejected` require a reason. TypeScript declarations and automated tests are included.

This builder does not authenticate the actor, prove their role or assignment, load the authoritative current listing state, persist an event, or prevent concurrent updates. A production API must perform those checks server-side and commit the listing state change and append-only event in one database transaction. Do not describe this utility as a live audit trail.
