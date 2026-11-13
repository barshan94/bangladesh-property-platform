# Live Supabase advisor baseline

**Observed:** 2026-11-13  
**Project:** `bangladesh-property-platform` (`xpbjdeknjudurulogjkr`)  
**Scope:** Read-only Supabase advisor checks. No schema or data was changed.

## Results

| Advisor | Result |
| --- | --- |
| Security | No findings returned |
| Health | No findings returned |
| Performance | 21 unused-index notices and 1 multiple-permissive-policy warning |

### Performance details

The unused-index notices include indexes on role lookups, listing search, private-document ownership and linkage, inquiry and service-request queues, audit events, consent records, and status-event history.

The project currently has limited production-like traffic. An unused-index notice is therefore not sufficient evidence that an index should be dropped. Keep these indexes until representative query volume and query plans justify a reviewed change.

The multiple-permissive-policy warning concerns `public.property_listings` UPDATE for `authenticated`, where the owner-unpublished and staff-update policies both apply. The policies encode distinct authorization paths. Do not merge or weaken them merely to silence the linter; first prove equivalent owner and staff access behavior with regression and live authorization tests.

## Limitations

- A clean advisor result is not a penetration test or proof that every endpoint is secure.
- The check does not verify Auth email delivery, production secrets, client-IP proxy trust, storage upload/download flows, or browser runtime behavior.
- Re-run advisors after schema or policy changes and after the platform has representative query traffic.
