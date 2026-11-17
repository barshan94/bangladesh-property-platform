> **Authoritative live-status update — 2026-11-17 (supersedes earlier status snapshots below):** PR [#21](https://github.com/barshan94/bangladesh-property-platform/pull/21) is merged into `main` at `16b36d299b3120e906e8f72c134fb5c586b71e0b`. Latest PR-head CI, isolated database-policy and browser-authentication workflows passed before merge (runs [43910469780](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43910469780), [43910469596](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43910469596), [43910469717](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43910469717)). Vercel Production deployment `dpl_GH37BudsHVzHWKq3SCLkux1bgxm3` is `READY` from that merge commit; the default domain remains SSO-protected.

> **Follow-up update — 2026-11-17:** PR [#22](https://github.com/barshan94/bangladesh-property-platform/pull/22) was merged to `main` at `c31bf11a97431f93b325051b4d8a4d73fa260e9b` after all three PR-head checks passed: CI/build [43998349453](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43998349453), isolated database-policy probes [43998349477](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43998349477), and browser authentication E2E [43998349472](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43998349472). Its forward-only index/RLS-policy migration is merged in source but **has not been applied to production**. The project owner has confirmed the existing email-confirmed Auth account as the intended first administrator. The live database still has zero active administrators until the one-time bootstrap is completed; `manage-staff-role` requires the Edge Function secret `STAFF_BOOTSTRAP_ADMIN_USER_ID` to be set to that account's Auth UUID before the account can self-bootstrap. Do not expose the site or claim admin access is active until bootstrap is completed and verified. No Supabase schema or user-role data was changed by this follow-up.>
> **Supabase access restored and live database inspected read-only on 2026-11-17.** Existing project `xpbjdeknjudurulogjkr` (`bangladesh-property-platform`, `ap-south-1`) is `ACTIVE_HEALTHY`. The remote migration ledger contains **33 migrations**, through `20261116150000_admin_property_edit_and_inquiry_status`; the expected PR #20/#21 tables and functions are present. No live migration or data change was made during this inspection. All public tables have RLS enabled. The two private Storage buckets are `listing-media-quarantine` and `private-evidence`.
>
> **Important live blockers/findings:** there are currently **zero active user-role rows and zero active administrators**, so first-admin bootstrap and authenticated admin workflows remain untested/unavailable. The Supabase organization is on the Free plan; leaked-password protection is disabled and Supabase documents this feature as Pro-plan-and-above only (so this cannot be enabled on the current plan); two public-schema tables have RLS but no policies (direct table access is revoked and their intended access is through guarded server/RPC paths); two public projection RPCs are executable by anon/authenticated as SECURITY DEFINER; their live definitions were reviewed and return only published listings, with listing media further restricted to approved and published media (map coordinates are rounded to two decimals). Direct SELECT on the underlying private tables is denied to anon/authenticated. Staff-only SECURITY DEFINER RPCs are executable by authenticated users but their function bodies check the active staff role. Performance Advisor reports six unindexed foreign keys and a multiple-permissive-policy warning on property listing UPDATE, plus unused-index information. These findings need a documented review and targeted remediation; do not indiscriminately revoke RPC grants or add broad RLS policies.
>
> **Release remains NO-GO for public customer operation.** Auth email delivery and leaked-password protection are not configured/verified; no administrator is bootstrapped; live transactional smoke tests, client-owned domain, commercially permitted hosting, approved business/legal content, manual accessibility/security review and named operational/recovery ownership remain open. Keep Vercel SSO protection enabled. Vercel Hobby is not suitable for this paid commercial client deployment; arrange compliant hosting before public release.
>
> **Handoff limits:** merged source and documentation are suitable for technical review/staging handoff only with limitations disclosed. Do not represent the site as a fully operational public marketplace or accept live customer/property transactions yet. Inquiry replies open a prepared email draft and are not sent by the website; payments/escrow and confidential document exchange are excluded. Confidential document upload/scanner/recovery routes return HTTP 410. Historical migration counts and prior database-access statements below are superseded by this update.
>
# Production release gates

## Gate 4 — Hosting, operations and recovery

- [ ] Confirm Vercel Hobby plan limits, function/request-body constraints, region, data terms, trusted proxy behavior and rollback support; select and connect a client-owned custom domain if required.
- [ ] Verify each server-side production secret through non-disclosing deployed smoke tests; never place privileged keys in browser variables or source control.
- [x] Vercel default domain has HTTPS and is attached to the project.
- [x] SSO protection is enabled for all non-custom domains while commercial hosting compliance is unresolved.
- [ ] Select a commercially permitted plan/provider. Vercel Hobby is personal/non-commercial only; use Vercel Pro or migrate to a commercially permitted free host before public client access.
- [ ] Connect the client's custom domain and configure DNS/email-domain authentication, monitoring, alerting and log redaction.
- [ ] Establish retention and deletion schedules, incident response, credential rotation and support ownership.
- [x] Perform and record an isolated restore rehearsal for the encrypted database-only export (GitHub Actions run [43870684275](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43870684275)); the drill verifies core application tables, RLS/policies and required RPCs in an empty local Supabase database.
- [ ] Export encrypted backups including Storage object bytes and define/test separate Auth users/settings and project-configuration recovery; the completed database-only drill does not cover these.
- [ ] Define and test recovery time and recovery point objectives (RTO/RPO).

**Current hosting state:** Vercel Production deployment exists at `https://bangladesh-property-platform.vercel.app`; its default domain is SSO-protected. No client-owned custom domain is configured. The connected Hobby plan is not permitted for this paid freelance deployment; choose Pro or a commercially permitted host before public release. The site remains `noindex` while real business identity/content/legal approval are outstanding. Monitoring and a named operator are not configured. The database-only restore rehearsal passed, but full Auth/Storage/configuration recovery and off-site backup retention are not configured.

**Evidence required:** deployed health checks, smoke tests, alert test, backup manifest, restore report and named operational owner.

## Gate 5 — Legal, content and business verification

- [ ] Obtain Bangladesh legal/privacy review for the actual services, notices, consent, retention, cross-border processing and property-assistance claims.
- [ ] Verify business identity, contact channels, staff credentials and service scope.
- [ ] Verify every real property listing and obtain evidence/authorization before publication. Never fabricate inventory, testimonials, legal credentials or verification badges.
- [ ] Add reviewed Knowledge Hub content; editorial migrations must be safely applied before the CMS is enabled in production.
- [x] Add automated axe-core WCAG 2.0 A/AA, WCAG 2.1 A/AA and WCAG 2.2 AA scans for the public homepage, property catalogue, login and authenticated dashboard; all four passed in PR #16 run [43869197773](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43869197773).
- [ ] Complete manual keyboard-only and screen-reader testing, zoom/reflow and text-spacing checks, actual mobile-device and cross-browser review, interactive-state contrast checks, and security/penetration testing. See [Automated Accessibility Audit](ACCESSIBILITY_AUDIT.md).
- [ ] Assign a named person responsible for customer support, moderation, incidents and legal escalation.

**Evidence required:** signed review, approved notices, verified business records, content approvals, test reports and named owner.

## Latest source verification — 2026-11-15 (PR head `eb845f254a331cc7eb4ea198911fb28f5811ac31`)

- Commit `361149a59781fdcc7e2066e5f7da00cc14a90f71` added the 4 MiB document-inspection ceiling and 8,192-marker JPEG budget, with boundary tests. CI `43678342722`, database policy tests `43678342730`, and browser-auth E2E `43678342783` all passed on that exact commit.
- The exact PR head `eb845f254a331cc7eb4ea198911fb28f5811ac31` passed all required workflows: CI [#876 / 43734292406](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43734292406), database policy tests [#267 / 43734292386](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43734292386), and browser authentication E2E [#264 / 43734292501](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43734292501). The database workflow replays committed migrations in an isolated local Supabase stack; this does not approve applying migrations 10–27 to the remote project.

## Release decision

Launch is permitted only when all applicable gates have evidence, unresolved high-severity findings are closed, and the accountable operator records a go-live decision. Until then:

- Do not advertise the platform as production-ready.
- Do not accept confidential ownership, identity or case documents; document exchange is excluded from this MVP.
- Do not imply that a listing or moderation decision proves title, ownership, legal clearance or property condition.
- Do not enable public listing images or live customer workflows that depend on unapplied migrations.
- Keep development and test data synthetic.

A green CI run is necessary, but it is not a production approval.


## Read-only live Supabase baseline — 2026-11-13

The connected dedicated project was inspected without changing its schema or data:

- Historical read-only baseline returned nine recorded versions. Since then, a single targeted grant migration (`20261116050502_grant_anon_select_user_roles_for_public_listing_policy`) was applied after production logs identified the public listing query failure. The current remote ledger records ten migrations; the 18 pending migrations remain unapplied.
- All 13 tables returned by the public-schema table inventory reported RLS enabled. The inventory showed zero rows in each table at inspection time; this is only a point-in-time row estimate and not a security proof.
- Security advisor: no lint findings returned.
- Health advisor: no lint findings returned.
- Performance advisor: one warning for multiple permissive UPDATE policies on `public.property_listings` (`listings_update_own_unpublished` and `listings_update_staff`), plus 21 INFO findings for unused indexes.

The duplicate UPDATE policies appear to represent distinct seller and staff paths, and PostgreSQL combines permissive policies with OR semantics. Do not delete either policy or change authorization behavior just to silence the warning. A future optimization may consolidate them into one policy only after a forward migration and seller/reviewer/publisher JWT/RLS probes prove the exact same USING and WITH CHECK boundaries. The unused-index findings are not a removal recommendation: the tables currently have no recorded rows and production query workload has not been established.

Advisor references:
- [Multiple permissive policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)
- [Unused index](https://supabase.com/docs/guides/database/database-linter?lint=0005_unused_index)

This is an advisor snapshot, not a complete remote schema-drift comparison, penetration test, or production approval.


## Latest document-workflow verification — 2026-11-15

The current draft PR head `54e211a29423d3eb9d86e1bf7e99c05e2b6cfba8` passed all three required GitHub Actions workflows: CI #824, database policy #215 and browser authentication E2E #212. This verifies the source and isolated test environment only.

**Provider decision remains open:** no real malware scanner or document-processing/OCR model is selected or configured. The existing scanner callback is an authenticated, digest-bound completion boundary; it does not scan or process files. The current PDF/PNG/JPEG checks are bounded structural screening, not full parser validation. Do not enable confidential document intake for customers or implement downloads until provider privacy terms, retention, residency, subprocessors, operator ownership and deployed failure behavior have been approved and tested.


## Free scanner and OCR architecture decision — 2026-11-15

The project has selected a free, self-hosted open-source processing stack instead of a commercial scanner or external AI/OCR API:

- ClamAV for malware scanning.
- qpdf for PDF structural validation.
- Poppler pdftotext for text extraction.
- Tesseract 5 for local OCR.

This decision removes per-document vendor/API charges and avoids transferring private property evidence to an external scanning or AI processor. It does not make compute, storage, backups, monitoring or operator time free. A continuously available client/operator-controlled worker host is still required.

Remaining release gates: implement the isolated non-root/no-network worker; enforce CPU, memory, file, page, pixel, output and timeout limits; refresh and verify ClamAV signatures; add atomic job leases and retry/idempotency; verify the exact original SHA-256 before and after processing; use the existing HMAC callback only for authenticated digest-bound results; implement authorized downloads and audit-before-response; test failure and recovery behavior on the actual worker host. Until all gates pass, confidential evidence intake and downloads remain disabled.

Do not claim that a selected open-source component is installed, running or production-accepted merely because it is named in this architecture decision.


## Latest source snapshot — 2026-11-16

- Reviewed main commit: `56070389de38e266b08131efc55ea531e60e89a2`.
- Full CI run [43808959813](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43808959813) completed successfully on that exact commit.
- Vercel production-target deployment [dpl_CsqM35MVwcrZGwsxgrE2Uykm3QSu](https://vercel.com/barshan-s-team/bangladesh-property-platform/CsqM35MVwcrZGwsxgrE2Uykm3QSu) is READY; its default domain remains SSO-protected.
- Current remote migration ledger records 10 migrations; 18 repository migrations remain unapplied. The security advisor returned no lint findings. The performance advisor reports one multiple-permissive-UPDATE-policy warning on `public.property_listings` and informational unused-index findings.
- See [Final Delivery Status](FINAL_DELIVERY_STATUS.md) for the concise handoff assessment and evidence. The release decision remains **NO-GO** until applicable gates are closed.


## Latest source and audit update — 2026-11-16

- Current `main`: `35c3ea8bbed448057eccf402a3b9218037fd70f9`.
- CI [run 43861427242](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43861427242) passed on that exact commit (dependency audit, domain tests, TypeScript, ESLint and production build).
- Database policy replay and authorization probes [run 43859804770](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43859804770) passed on commit `07bba6fd1f06013f9826ff2d71fc41b42cea0bba`, which includes the publisher-role separation migration.
- Browser authentication E2E [run 43860719104](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43860719104) passed on application commit `7145faafde5b243099c2d5863ccbd606408f530c`; the subsequent PR #13 was documentation-only.
- The scan metadata CHECK defect is corrected in source by `20261116121042_private_document_scan_metadata_invariant.sql`; the CLI-generated migration and regression probe passed isolated replay in [run 43864519071](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43864519071). It remains pending on the remote database.
- The remote count of 10 is the last recorded read-only snapshot, not a newly refreshed live query in this update.


## Latest source verification — 2026-11-16

- PR code revision: `686564b7ca2bc4f763240f0c8dda49e44221d703`; new scan-metadata correction is the 30th migration file.
- CI passed: [43864519102](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43864519102).
- Full isolated migration replay and database authorization/boundary probes passed: [43864519071](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43864519071) and [43864508989](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43864508989).
- Browser authentication E2E passed: [43864519076](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43864519076).
- The remote migration count is still the last recorded read-only snapshot, not a fresh recheck. No live database, hosting or SSO changes were made.


## Accessibility verification update — 2026-11-16

PR #16 adds axe-core browser scans and fixes the contrast and accessible-name defects found by the first run. All four scoped pages passed on PR head `bc8f3200f7e1ca74ca0983f78361edb50f819bdb` in [run 43869197773](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43869197773). Standard CI [43869197863](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43869197863) and database policy tests [43869197883](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43869197883) also passed. Manual screen-reader, real-device, cross-browser and dynamic-state checks remain open; this is not a full accessibility certification.


## Database-only restore drill evidence — 2026-11-16

The encrypted export from run `43852061867` was restored into an empty isolated local Supabase database by run [43870684275](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43870684275). The script verifies the artifact checksum, decrypts it with the protected Actions secret, enforces the local-only database URL, restores roles/schema/data, and checks core tables, RLS, policies and inquiry/service-request RPCs. This closes the database-only restore-rehearsal item only. Auth users/settings, Storage object bytes, Edge Function secrets, SMTP/CAPTCHA/Auth configuration, DNS, cloud-provider recovery, off-site retention, RPO/RTO and operational ownership remain open. Do not mark Gate 4 complete.


## Latest source verification — 2026-11-16 (PR #21 head `be874189c9e04d7847307f9d9fbcbb66602a5fb1`)

- [x] CI run [#1052 / 43900675673](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43900675673) passed on the exact head: dependency security audit, domain tests, TypeScript validation, ESLint and production build.
- [x] Database policy run [#402 / 43900675513](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43900675513) passed on the exact head: every committed migration replayed into isolated local Supabase; listing staff authorization, administrator property/inquiry workflow, service request, private-document boundary, listing-media, public projection, map, knowledge-content and Auth JWT/RLS probes passed.
- [x] Browser authentication E2E [#388 / 43900675640](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43900675640) passed on the exact head using isolated Supabase and Chromium.
- [ ] Merge PR #21 through the repository's normal review/merge process before treating these changes as part of the main delivery branch.
- [ ] Refresh the live Supabase migration ledger and schema/advisor results. The connected Supabase integration denied the final read-only migration/advisor request, so no current remote migration count is asserted here.
- [ ] Keep all production release gates below open until the client/operator completes them in the target environment.

These three successful workflows close the source-code CI, isolated database replay/security-probe and browser-authentication checks for the exact PR revision. They do not close the separate live database, hosting/commercial-use, email, legal, accessibility, full backup/recovery or operational-owner gates.

---

## Authoritative status reconciliation — 2026-11-17

This section supersedes older release snapshots in this file where they conflict with the current state below.

### Current implementation / deployment state

- `main` is at `4984f1278c44c7cc04a9a8fbc117d4c88e9c9d86` (PR #24 merged).
- Vercel Production deployment for this exact SHA: `dpl_2u89xeiHpCv3cUTzB1aZe8vwjj5u`, state `READY`.
- PR #24 isolated seller → reviewer → publisher → public-catalogue browser E2E passed, along with CI and database-policy tests: [CI 44010893281](https://github.com/barshan94/bangladesh-property-platform/actions/runs/44010893281), [DB policy 44010893434](https://github.com/barshan94/bangladesh-property-platform/actions/runs/44010893434), [browser E2E 44010893365](https://github.com/barshan94/bangladesh-property-platform/actions/runs/44010893365).
- PR #22's migration `20261117110000_index_live_foreign_keys_and_consolidate_listing_update_policy` is present in the live migration ledger (34 recorded migrations); the consolidated property listing UPDATE policy was verified in `pg_policies`.
- First administrator bootstrap is complete. Live `public.user_roles` inspection confirmed one active administrator role. The project owner confirms access to the Admin Panel.
- Staff Management supports invitation by email with role assignment, and granting/revoking roles for existing accounts. Actual invitation delivery still depends on Supabase Auth email configuration and has not been confirmed with the client's mailbox.

### Delivery decision

**GO for client demonstration and source-code handoff with written limitations. NO-GO for unrestricted public commercial launch until the remaining gates below are completed.** Do not describe the system as error-free, legally approved, or fully production-operational based only on CI and the current deployment state.

### Current live demo data

The project owner explicitly requested that the six synthetic TEST DATA records remain available for the client demonstration. They comprise two submitted property listings, two inquiries and two service requests. They are not real inventory or customer leads; the property listings are not public. Do not run the cleanup SQL in `TEST_DATA_CLEANUP.md` unless the project owner later asks for removal.

### Outstanding gates

- [ ] Remove the one-time Supabase Edge Function secret `STAFF_BOOTSTRAP_ADMIN_USER_ID` after first-admin activation. Activation is verified; secret removal is not.
- [ ] Send a real staff invitation to the client's email and verify receipt, acceptance and administrator sign-in.
- [ ] Confirm client-owned domain, DNS, TLS and the final redirect/allowlist configuration.
- [ ] Replace Vercel Hobby with Vercel Pro or another hosting plan that permits this paid commercial use. Keep deployment protection enabled until a safe public-access transition is approved.
- [ ] Confirm the client owns or controls the domain, hosting, Supabase project, billing, recovery credentials and operational contacts.
- [ ] Complete approved company/property content and qualified Bangladesh legal/privacy review.
- [ ] Complete manual screen-reader, keyboard, contrast, real-device and cross-browser acceptance.
- [ ] Complete deployed smoke tests for signup/login/password reset, invitation, listing submission/review/publication, image moderation, inquiries, service requests and staff-role revocation.
- [ ] Assign an operational owner and verify monitoring, incident response, backup retention and a restore/recovery procedure.

### Scope and risk boundaries

- Inquiry reply is a prefilled `mailto` draft, not website-sent mail or a stored customer conversation.
- Payments/escrow are not implemented.
- Confidential document exchange is excluded; upload, scanner callback and recovery routes return HTTP 410. Do not accept identity documents, title deeds or ownership evidence through this application.
- Supabase Free does not provide the documented leaked-password protection feature; upgrade or document an accepted compensating control before public operation.
- A READY Vercel deployment confirms build/deployment status only; it does not establish public accessibility, email delivery, legal compliance, security certification or business readiness.
