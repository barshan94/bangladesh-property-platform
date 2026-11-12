# Authentication implementation

**Status:** Initial email/password authentication and cookie-based Supabase SSR integration are implemented in the Next.js 15 application. Production enablement still requires environment setup and Supabase Auth URL/email configuration.

## Provider and dependencies
- Dedicated Supabase project: `xpbjdeknjudurulogjkr` in the separately connected MRA account; existing MRA project untouched.
- `@supabase/ssr@0.12.7` and `@supabase/supabase-js@2.119.0` are pinned.
- Browser and server clients use the publishable key only. No service-role or secret key is read by the application.

## Implemented flows
- Email/password sign-up with a 12-character minimum.
- Email confirmation callback using PKCE code exchange.
- Email/password sign-in.
- Password reset request with a generic success response to reduce account enumeration.
- Password update after a valid recovery callback.
- Sign-out.
- Protected dashboard validates JWT claims with `auth.getClaims()`, then reads only the current user's profile under RLS.
- New profile rows are created by the existing database trigger. User-editable metadata is never used for authorization.
- Next.js 15 `middleware.ts` refreshes cookie sessions and propagates refreshed cookies.

## Required environment variables
Set these in local `.env.local` and the eventual hosting provider:
- `NEXT_PUBLIC_SUPABASE_URL=https://xpbjdeknjudurulogjkr.supabase.co`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<project publishable key>`
- `NEXT_PUBLIC_SITE_URL=<exact HTTPS application origin>`

The publishable key is designed for public clients. Never use a Supabase secret or service-role key in `NEXT_PUBLIC_*`, browser code or this repository.

## Supabase Dashboard configuration still required
1. Authentication → URL Configuration: set Site URL to the confirmed application origin.
2. Add exact redirect URLs for `<origin>/auth/callback` and `http://localhost:3000/auth/callback` for local development.
3. Confirm email confirmations are enabled and configure deliverable email. Supabase's default email service is rate-limited and is not a production email service.
4. Customize and test confirmation and password-reset email templates, including PKCE callback URLs.
5. Confirm password policy and Auth rate limits; enable CAPTCHA/bot protection before public launch.

## Important limitations
- Production domain and hosting environment are not selected/configured. Live redirect allowlists and production email delivery cannot yet be verified.
- Source flows have not been end-to-end tested against a real mailbox or deployed HTTPS domain.
- Dashboard is a minimal authenticated account shell, not a seller/staff portal.
- Staff roles remain trusted-admin provisioned only; no self-service role assignment exists.
- No service-role key or privileged admin API route has been created.
- A committed npm lockfile and `npm ci` workflow remain outstanding; versions are pinned but installation is not fully reproducible.
