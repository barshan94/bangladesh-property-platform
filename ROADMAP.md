
## Private document quarantine policy — 2026-11-12
- [x] Add a strict pure policy utility for private evidence purpose, supported MIME types, 15 MiB maximum size and scan-state handling.
- [x] Reject infected, unsupported, invalid and oversized document metadata; keep pending or errored scans quarantined.
- [x] Add TypeScript declarations and automated policy tests.
- [ ] Implement trusted server-side byte inspection and malware scanning; never trust browser-supplied MIME or scan status.
- [ ] Implement authenticated intake, private object storage, scoped authorization, short-lived downloads, consent/provenance records and append-only access audit events.
- Verification: GitHub Actions run 43232286730 passed dependency security audit, domain policy tests, TypeScript validation, ESLint and production build at commit 726ac96981b3ebaa7f64b8180f03d4a2a9687bc1. This verifies the policy utility and repository build only—not file inspection, malware scanning, upload, storage, authorization or deployment.
