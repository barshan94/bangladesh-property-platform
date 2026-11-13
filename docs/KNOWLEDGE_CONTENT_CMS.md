# Knowledge Hub CMS implementation boundary

## Editor workspace

The authenticated editor workspace is available at `/dashboard/content` for users with the active `content_editor` role and administrators. Editors can create and save drafts, edit their own drafts or rejected submissions, and submit drafts for review. Administrators can view all editorial records, review submissions, approve/reject them, and publish approved content.

The browser has no direct write or read grant on the underlying content table. Server actions use the user's Supabase session and call narrowly scoped security-definer RPCs. The RPCs re-check active database role records and JWT role claims. No service-role key is exposed to the browser.

## Publishing boundary

This workspace does not make article bodies public. The anonymous view contains metadata only; raw Markdown remains private until a separately reviewed renderer and sanitizer are implemented. Video records store only an allowlisted provider and opaque video ID; arbitrary embed URLs are not accepted. Public video rendering remains disabled until the renderer uses fixed provider origins, restrictive iframe sandboxing and an appropriate Content Security Policy.

## Operational prerequisite

The editorial migration files are code-only and have not been applied to the live Supabase project. Until migrations are applied through the approved migration process, RPC calls fail and the editor UI displays a safe unavailable message. No remote database changes or production deployment are performed by this code change.
