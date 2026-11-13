# Knowledge content editorial workflow

## Scope

The editorial database foundation supports two content types: long-form articles and videos. The authenticated CMS workspace is implemented at `/dashboard/content`. A sanitized Markdown renderer, video player, and public content route are not implemented yet.

## Workflow

`draft → in_review → approved → published → archived`

- A user with the active `content_editor` role (or an administrator) can submit a draft for review.
- Only an administrator can approve or reject submitted content.
- Authors cannot review their own work.
- Only approved content can be published.
- Every transition requires a reason and writes an audit event.
- Rejected content remains non-public. A future editor workflow must explicitly return it to draft before resubmission; no automatic status reset is provided.
- Only the narrow `published_knowledge_content` view is readable by anonymous/authenticated browser roles. It intentionally excludes article bodies until a sanitized renderer exists, plus reviewer identity and internal notes.
- Browser roles cannot insert, update, or delete content rows. Trusted server code uses the server-only Supabase secret.

## Content integrity

- Article content is Markdown text and must be rendered with raw HTML disabled and a maintained sanitizer/allowlist before public display.
- Video records store a provider and opaque video ID, not an arbitrary embed URL. The future renderer must construct embeds only for the explicitly allowed provider domains and use a restrictive iframe sandbox/referrer policy.
- Legal/property guidance must carry jurisdiction, a visible author/reviewer attribution policy, publication and review dates, source notes, and clear informational-not-advice wording.
- Do not publish invented author credentials, legal conclusions, ownership guarantees, client outcomes, or property verification claims.
- Content must be reviewed for Bangladesh jurisdiction, currentness, privacy, copyright, and marketing claims before publication.

## Release boundary

The migration is code-only and has not been applied to the remote Supabase project. The public Knowledge Hub remains a placeholder until the migration is applied through an approved process, a secure server-side CMS interface and sanitized renderer are implemented, and reviewed content is supplied. No article bodies, video embeds or unreviewed article content are exposed by this milestone.
