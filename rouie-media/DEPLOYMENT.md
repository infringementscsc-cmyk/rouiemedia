# Rouie Media V3 — deployment checklist

## Status
This is a **deployment candidate**, NOT a certified production release. No live Supabase, Cloudflare or Vercel credentials are included; end-to-end verification is mandatory before public launch.

1. Create Supabase project; run `supabase/schema.sql` once (not idempotent). Disable public sign-ups in Supabase Auth if the site should be admin-only. Create your admin user in Supabase Auth; promote with `supabase/make-admin.sql` after replacing its email placeholder.
2. Create Cloudflare Stream API token with minimum required Stream permissions; enable Stream billing.
3. Register webhook with `PUT https://api.cloudflare.com/client/v4/accounts/ACCOUNT_ID/stream/webhook`, JSON `{"notificationUrl":"https://rouiemedia.com/api/webhooks/cloudflare-stream"}`. Set `CLOUDFLARE_STREAM_WEBHOOK_SECRET` to the returned **secret**. Updating webhook registration may rotate it. Cloudflare signs `Webhook-Signature: time=...,sig1=...`; V3 verifies HMAC SHA-256 and 5-minute time tolerance.
4. Add environment variables from `.env.example` to Vercel Production (server secrets must NOT use NEXT_PUBLIC_ prefix). Set `NEXT_PUBLIC_SITE_URL=https://rouiemedia.com`.
5. Connect GitHub repo to Vercel, add `rouiemedia.com` and `www.rouiemedia.com`, use the exact DNS values Vercel displays, redirect www to apex, verify HTTPS.
6. In Supabase Auth URL Configuration set Site URL `https://rouiemedia.com`; configure any auth redirects if used.
7. Test sign-in, forbidden admin access, direct upload, signed webhook verification, processing failure, publishing, unpublishing, and Cloudflare playback. Verify that private Stream assets cannot be played by UID, including after toggling public -> private.
8. Monitor Cloudflare and Vercel logs, budget/usage, configure backups, abuse prevention, security headers, incident response, and legal/privacy/copyright pages before launch.

## Important limitations
- No private playback feature. Private videos are restricted at Stream and cannot be viewed by visitors. Private preview requires a separate server-authorized short-lived signed token implementation.
- Making an already public video private may not revoke previously cached playback or downloaded copies. The endpoint returns an explicit error if Cloudflare privacy update fails.
- V3 does not include a public account registration flow; Supabase Auth accounts must be provisioned by admins.
- Video processing webhooks are authenticated but must be tested live; webhook retries are idempotent for `ready` and `failed` updates.
- No production E2E test was run here. Perform staging checks before accepting real users.
