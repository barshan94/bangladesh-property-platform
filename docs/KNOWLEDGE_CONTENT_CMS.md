# Knowledge Hub CMS implementation boundary

## Editor workspace

The authenticated editor workspace is available at `/dashboard/content` for users with the active `content_editor` role and administrators. Editors can create and save drafts, edit their own drafts or rejected submissions, and submit drafts for review. Administrators can view all editorial records, review submissions, approve/reject them, and publish approved content.

The browser has no direct write grant on the underlying content table. CMS server actions use the user's cookie-backed Supabase session and call narrowly scoped security-definer RPCs. The RPCs re-check active database role records and JWT role claims. The service-role key is not used for editorial actions and no privileged key is exposed to the browser.

## Publishing boundary

The public-read-boundary migration exposes only approved columns for rows whose status is published. It includes published article Markdown and the review timestamp, but not source notes, review notes, reviewer identity or author ownership. The view uses invoker permissions and a published-only RLS policy. Video records store only an allowlisted provider and opaque video ID; arbitrary embed URLs are not accepted. Public video rendering remains disabled until the renderer uses fixed provider origins, restrictive iframe sandboxing and an appropriate Content Security Policy.

## Operational prerequisite

The editorial and public-read-boundary migration files are code-only and have not been applied to the live Supabase project. Until migrations are applied through the approved migration process, RPC calls fail and the editor UI displays a safe unavailable message. No remote database changes or production deployment are performed by this code change.
