# Automated accessibility audit

**Date:** 2026-11-16  
**Scope:** Homepage, public property catalogue, login page and authenticated dashboard  
**Automation:** axe-core Playwright scanner, pinned to `@axe-core/playwright@4.14.0` in CI only

## Automated checks

The browser E2E workflow runs axe scans using these rule tags:

- WCAG 2.0 Level A and AA
- WCAG 2.1 Level A and AA
- WCAG 2.2 Level AA

The scans passed for all four scoped pages in [GitHub Actions run 43869197773](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43869197773), on PR #16 head `bc8f3200f7e1ca74ca0983f78361edb50f819bdb`. The same revision passed standard CI [run 43869197863](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43869197863) and isolated database policy tests [run 43869197883](https://github.com/barshan94/bangladesh-property-platform/actions/runs/43869197883).

## Defects found and corrected

- Darkened muted body text from `#64747a` to `#52636a` so it meets contrast requirements on the light paper and disclaimer surfaces.
- Darkened the standard gold text accent from `#b58f42` to `#725012` for readable text on white and light backgrounds.
- Kept the footer brand accent on the lighter gold token when it appears on the dark footer background.
- Applied the light eyebrow treatment to page-intro sections that use a dark navy background.
- Removed brand-link accessible-name overrides that did not include the visible brand wording.
- Updated service-link accessible names so they include their visible label.

The axe package is installed temporarily by the browser CI workflow. It is not part of the deployed application runtime.

## Remaining manual accessibility work

A passing axe scan is not proof of complete WCAG conformance. The following still require human/device verification:

- Screen-reader review with at least one desktop and one mobile screen reader.
- Full keyboard-only review of navigation, forms, dialogs, filters and dashboard workflows.
- Zoom/reflow and text-spacing checks at high magnification.
- Touch target and layout review on actual Android and iOS devices.
- Cross-browser checks and manual contrast review for interactive, hover, focus, disabled, validation and dynamic states.
- Review of real client content and any future listing images for meaningful alternatives.

Do not mark the platform fully accessibility-certified on the basis of this automated scan alone.
