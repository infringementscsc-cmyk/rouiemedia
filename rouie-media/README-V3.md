# Rouie Media V3

Next.js App Router + Supabase Auth/Postgres RLS + Cloudflare Stream.

### Improvements over V2
- Verified Cloudflare Stream webhook HMAC signature (raw body, 5-minute replay window).
- Admin publishing controls in dashboard, Cloudflare `requireSignedURLs` toggled together with database visibility.
- Publication timestamp updated only for public videos, errors and private videos stay hidden.
- Basic security response headers, deployment checklist.

See `DEPLOYMENT.md` for setup, outstanding security tasks and release criteria. **Not production-validated without real credentials and end-to-end tests.**
