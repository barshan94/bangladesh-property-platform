

## Listing status-event construction (implemented domain utility; no persistence)

`src/lib/listing-status-event.mjs` exports `createListingStatusEvent(input)`. It validates the proposed transition against the listing lifecycle policy and actor-role matrix, rejects unknown fields and unsafe/bounded identifier violations, validates a canonical millisecond-precision UTC timestamp, and returns a frozen event with listing/actor identifiers, role, old/new status, optional reason, occurrence time and request/correlation ID. Reviewer decisions that request changes, approve or reject require a reason. A TypeScript declaration and automated tests are present.

This is event construction, not an audit database or authorization boundary. A future endpoint must authenticate the actor, derive role and assignment from trusted server-side records, load the current listing status, validate against that authoritative state, and atomically persist both the new status and event. Concurrent transitions must be protected by a transaction or equivalent optimistic concurrency control. Never accept the actor role or current status as trusted client input.
