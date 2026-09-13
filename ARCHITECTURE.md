# Architecture

## What a PWA Is

A Progressive Web App is still a website, but it includes a web app manifest and a service worker so the browser can install it as a Home Screen icon and provide app-like behavior.

It is not an App Store binary. There is no Swift or native iOS application bundle in the first release. When the user taps the icon, iOS opens the site in a standalone app-like window.

The PWA can contain:

- A name, icon, splash behavior, and standalone display mode from `manifest.json`.
- A service worker that handles caching and incoming push events.
- Responsive pages for pool status, notification settings, and source links.
- Web Push permission and subscription logic.

## Web Push Mechanism

The notification path is:

1. The user opens the installed PWA and taps `Enable notifications`.
2. The service worker registers with the browser.
3. The browser asks iOS for notification permission.
4. If approved, the browser creates a `PushSubscription` containing a push endpoint and encryption keys.
5. The PWA sends that subscription to the application API.
6. The API stores the subscription against the user/device and configured preferences.
7. A scheduled poller downloads the LCSD pages for every enabled pool.
8. The parser converts each page into normalized availability notices.
9. The application compares the new notices with the previous snapshot.
10. For a relevant new or changed notice, the backend sends an encrypted Web Push request using VAPID credentials.
11. On iOS, Apple's push infrastructure delivers the notification even if the PWA is not open.
12. The service worker receives the event and displays the notification.
13. Tapping the notification opens the PWA at the relevant pool or source page.

Apple's implementation uses APNs behind the standards-based Web Push service, but the backend does not need a native APNs device token or an Apple Developer account for this PWA flow.

Web Push is not a critical-delivery guarantee. The system should tolerate expired subscriptions, revoked permissions, temporary provider failures, and delayed delivery.

## iPhone Requirements

- iOS/iPadOS 16.4 or later.
- An HTTPS production origin.
- A valid web app manifest.
- A service worker served from the correct origin and scope.
- Home Screen installation before requesting notification permission.
- A direct user gesture for the permission request.
- Notifications enabled in iOS settings.

The user's phone password does not replace these iOS requirements. It is not technically needed for the setup; a normal visible permission flow is required. With the user's consent, the setup can be performed directly on the phone.

## Proposed Runtime Components

### Web application

- TypeScript and React.
- PWA manifest, icons, and service worker.
- Pool status view and notification setup view.
- Pool configuration is rendered from the same configured pool list used by the poller.

### API

- Accept and remove Web Push subscriptions.
- Store notification preferences.
- Return normalized current and upcoming notices.
- Expose a protected poll/check endpoint for scheduled execution.

### Daily checker

- Runs once per day for the birthday MVP.
- Iterates over enabled pool configuration entries.
- Fetches the URL derived from each `swpId`.
- Parses the server-rendered LCSD HTML.
- Normalizes date/time values in `Asia/Hong_Kong`.
- Builds a today/tomorrow summary.
- Sends no more than one summary for the Hong Kong calendar date.

The status page can fetch the same source pages on demand. Polling frequency and notification frequency are separate concerns, so the notification schedule can remain quiet without making the status page stale.

### Storage

The minimum useful records are:

- `pools` or configuration-derived pool records.
- `push_subscriptions`.
- `notification_preferences`.
- `availability_notices` or normalized snapshots.
- `poll_runs` and parser/fetch errors.

For a single-user MVP, authentication can be avoided or replaced with a private setup token. Do not expose the cron endpoint without a secret.

## Proposed Deployment

The simplest single-repository deployment is:

- Next.js/TypeScript application on Vercel.
- Supabase Postgres for subscriptions, preferences, and snapshots.
- Vercel Cron calling the protected daily-summary endpoint once per day.
- Direct Web Push using VAPID keys and the Node `web-push` package, or OneSignal if a managed push provider is preferred.

The birthday MVP does not require sub-hourly polling. Vercel Hobby supports one daily cron execution, which is sufficient for this release. A paid Vercel cron plan or Cloudflare Cron Trigger is an alternative if near-real-time polling is added later.

Production deployment requires:

- A Vercel project connected to this repository.
- A Supabase project and database schema.
- An HTTPS production URL.
- A generated VAPID public/private key pair.
- Secrets stored in the hosting and GitHub Actions secret stores.
- A Vercel Cron schedule with a protected endpoint.

Suggested secrets:

- `DATABASE_URL` or Supabase connection details.
- `VAPID_PUBLIC_KEY`.
- `VAPID_PRIVATE_KEY`.
- `VAPID_SUBJECT`.
- `CRON_SECRET`.
- Any provider-specific credentials if OneSignal is chosen.

The VAPID private key must never be shipped to the browser or committed to the repository.

## Data Flow

```text
LCSD HTML pages
       |
       v
Scheduled poller --> deterministic parser --> normalized notices --> database
                                                               |
                                                               v
                                                        deduplication
                                                               |
                                                               v
                                                        Web Push provider
                                                               |
                                                               v
                                                    iPhone PWA service worker
```

## Parser Design

The parser should use semantic structure such as pool headings, section headings, and table headers rather than relying on a fixed page position.

Each normalized notice should include:

- `swpId`.
- Pool name.
- Start time.
- End time or `null` for open-ended notices.
- Raw affected facilities.
- Reason.
- Remarks.
- Source URL.
- Stable fingerprint for deduplication.
- `lastSeenAt`.

The source is HTML, not a guaranteed public API. Parser fixtures and an alert on structural changes are required before relying on it for travel decisions.
