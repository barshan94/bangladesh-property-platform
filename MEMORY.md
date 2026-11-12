
## 2026-11-12 — Private document quarantine policy
- Added `src/lib/private-document-policy.mjs`, its TypeScript declaration and `tests/private-document-policy.test.mjs`.
- Policy permits only `listing_evidence` and `client_case`, PDF/JPEG/PNG, and files from 1 byte through 15 MiB.
- Clean scan state passes policy; pending/error states are quarantined; infected, unsupported and oversized inputs are rejected.
- GitHub Actions run 43232286730 passed dependency audit, domain policy tests, TypeScript, ESLint and production build at commit 726ac96981b3ebaa7f64b8180f03d4a2a9687bc1.
- Scope limitation: this utility does not inspect bytes, authenticate, scan malware, upload/store files, authorize downloads, issue signed URLs or persist audit records. Trusted server-side inspection and scanning are prerequisites.
