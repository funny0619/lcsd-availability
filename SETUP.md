# MVP Setup

This is the shortest path from the current repository to a deployed daily-summary PWA.

## Local Checks

Install dependencies and run the automated checks:

```bash
npm install
npm test
npm run typecheck
npm run build
```

The live status page does not need database credentials. It fetches the configured LCSD pages from the server when `/api/status` is requested.

## Supabase

1. Create a Supabase project.
2. Open the SQL Editor.
3. Run `supabase/schema.sql`.
4. Copy the project URL and secret key into server-side environment variables.

The secret key must never be exposed as a `NEXT_PUBLIC_` variable or committed to the repository.

## Web Push Keys

Generate a VAPID key pair once:

```bash
npm run generate:vapid
```

Set the generated values as environment variables:

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is safe to expose to the browser.
- `VAPID_PRIVATE_KEY` stays server-side.
- `VAPID_SUBJECT` can be a `mailto:` address.

Also set:

- `SUPABASE_URL`.
- `SUPABASE_SECRET_KEY`.
- `CRON_SECRET`.
- `ADMIN_TEST_TOKEN`.
- `SEND_CLEAR_SUMMARY=false`.
- `DAILY_SUMMARY_LOOKAHEAD_DAYS=2`.

The default notification window is today and tomorrow. A daily summary is sent at most once per Hong Kong calendar day, and a day with no relevant notices produces no notification.

If the Vercel Supabase integration provides the legacy `SUPABASE_SERVICE_ROLE_KEY` instead, the backend accepts it as a server-only fallback. Prefer `SUPABASE_SECRET_KEY` for new projects.

## Vercel

1. Import the repository as a Vercel project.
2. Add the environment variables above for the Production environment.
3. Deploy.
4. Confirm the deployed site opens over HTTPS.

The repository includes `vercel.json`, which configures Vercel Cron to call the daily-summary endpoint at 23:00 UTC, approximately 07:00 Hong Kong time. Vercel Hobby may invoke it within the configured hour.

Add `CRON_SECRET` to the Vercel Production environment. Vercel automatically sends it as an `Authorization: Bearer ...` header when it invokes the cron route.

The endpoint is:

`POST /api/cron/daily-summary`

Vercel uses `GET`; `POST` is retained for manual testing. Both require the `CRON_SECRET` bearer token.

## Test With the Redmi

The Redmi can test the standard Web Push path before the final iPhone setup:

1. Open the deployed HTTPS URL in Chrome.
2. Tap `Enable notifications`.
3. Allow notifications.
4. Confirm the app reports that notifications are enabled.
5. Trigger the protected test endpoint from a computer.

PowerShell example:

```powershell
$headers = @{ Authorization = "Bearer YOUR_ADMIN_TEST_TOKEN" }
Invoke-RestMethod -Method Post -Uri "https://YOUR_APP_URL/api/push/test" -Headers $headers
```

This should produce a `Swim Check test alert` on the Redmi. It exercises the stored subscription, VAPID configuration, push sender, service worker, and notification click handling.

## Final iPhone Setup

After the Redmi test succeeds:

1. Open the HTTPS URL in Safari on the iPhone.
2. Use Share, then `Add to Home Screen`.
3. Open the new Home Screen icon.
4. Tap `Enable notifications`.
5. Approve the iOS permission prompt.
6. Trigger the same protected test endpoint once.

The iPhone creates its own subscription. The Redmi subscription does not affect the iPhone subscription.

## Adding a Pool

Edit `src/config/pools.ts`:

```ts
{
  swpId: 1,
  name: "Pao Yue Kong Swimming Pool",
  enabled: true,
}
```

Redeploy. The UI, status endpoint, and daily summary poller all consume the same list.

## Current MVP Limitation

The first implementation parses temporary closure notices. Annual maintenance and recurring weekly cleansing calculations are intentionally deferred to keep the birthday release small and testable. The official source link remains available from every pool card.
