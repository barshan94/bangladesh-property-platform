# Knowledge content editorial workflow

## Scope

The editorial workflow supports long-form articles and videos. The authenticated CMS workspace is implemented at /dashboard/content; public listing and detail routes are implemented at /knowledge and /knowledge/[slug]. Article Markdown is rendered through a small React-based allowlisted subset renderer: raw HTML is never parsed, only HTTPS links are clickable, and unsupported Markdown constructs remain plain text. Video embeds are constructed from the allowlisted provider plus a validated opaque ID and use a restrictive iframe sandbox.

## Workflow

`draft → in_review → approved → published → archived`

- A user with the active `content_editor` role (or an administrator) can submit a draft for review.
- Only an administrator can approve or reject submitted content.
- Authors cannot review their own work.
- Only approved content can be published.
- Every transition requires a reason and writes an audit event.
- Rejected content remains non-public. A future editor workflow must explicitly return it to draft before resubmission; no automatic status reset is provided.
- Anonymous/authenticated readers can access only the published-content projection. A follow-up migration gives the view security_invoker=true, adds a published-only RLS SELECT policy, and grants column-level access only to public content fields. The projection includes the body of published articles and the editorial reviewed_at date, but excludes source notes, review notes, reviewer identity and author ownership.
- Browser roles cannot insert, update, or delete content rows. CMS server actions use the signed-in user's cookie-backed Supabase session to call narrowly scoped RPCs; the database re-checks the actor's active roles. No service-role key is needed for editorial writes.

## Content integrity

- Article content is Markdown text. The current renderer intentionally supports a safe subset without dangerouslySetInnerHTML: headings, paragraphs, lists, blockquotes, fenced code, emphasis, inline code and HTTPS links. Raw HTML, embedded images and arbitrary link protocols are not interpreted. Add a maintained Markdown parser/sanitizer only with a reproducible lockfile and an explicit allowlist.
- Video records store a provider and opaque video ID, not an arbitrary embed URL. The renderer constructs only youtube-nocookie.com or player.vimeo.com embed URLs, validates the ID again, and sets sandbox, referrerPolicy and an explicit feature allowlist.
- Legal/property guidance must carry jurisdiction, a visible author/reviewer attribution policy, publication and review dates, source notes, and clear informational-not-advice wording.
- Do not publish invented author credentials, legal conclusions, ownership guarantees, client outcomes, or property verification claims.
- Content must be reviewed for Bangladesh jurisdiction, currentness, privacy, copyright, and marketing claims before publication.

## Release boundary

The editorial and public-read-boundary migrations are code-only and have not been applied to the remote Supabase project. The routes therefore fail safely until the approved migration process is completed. No reviewed production content has been supplied. The custom renderer is a deliberately limited safe Markdown subset, not a complete CommonMark implementation; content requiring unsupported constructs should not be published until support is added and tested.
