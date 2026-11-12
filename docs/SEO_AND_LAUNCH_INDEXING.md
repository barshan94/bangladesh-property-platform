# Search Engine Indexing and Launch SEO

## Current policy

The production domain has not yet been supplied. Search indexing therefore stays disabled by default. The application must not publish canonical URLs, sitemap entries, or indexable metadata using a placeholder domain.

## Required environment configuration

Set these server/build environment variables only after the real public domain is confirmed:

- `NEXT_PUBLIC_SITE_URL`: the canonical HTTPS origin, for example `https://www.your-confirmed-domain.com`. Do not copy the example literally.
- `SITE_INDEXING_ENABLED`: set to `true` only when the public website is approved for indexing. Keep unset or set to `false` before launch.

The URL parser rejects malformed values and non-HTTPS public origins. Localhost is accepted for development, but indexing still requires the explicit flag.

## Runtime behavior

- Without a valid site URL and explicit indexing approval, page metadata has no metadata base, robots disallow crawling, and the sitemap is empty.
- With both values configured, page metadata uses the confirmed site URL, robots permits crawling and points to the sitemap, and the sitemap lists the approved public routes.
- The sitemap intentionally excludes knowledge/video areas until real, reviewed content exists.
- Property detail URLs are not emitted while the published listing catalogue is empty. Add dynamic listing URLs only when the server-backed published catalogue is implemented.

## Before enabling indexing

1. Confirm domain ownership and HTTPS.
2. Confirm the operating entity, public contact details and legal pages.
3. Review every indexed page for accurate service availability and legal claims.
4. Ensure no private client, seller, draft, or review route is indexable.
5. Add Google Search Console and Bing Webmaster Tools verification using approved domain-level methods.
6. Inspect the generated `/robots.txt` and `/sitemap.xml` on the production deployment.
7. Enable indexing only after the launch owner approves the public site.

This configuration is an SEO foundation, not a substitute for content quality, structured data validation, accessibility checks, or search-console monitoring.
