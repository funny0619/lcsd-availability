# Project Context

## Purpose

Prevent wasted trips to Hong Kong public swimming pools by checking LCSD availability information and warning the swimmer before they leave.

The first recipient is a single iPhone user. The initial product should feel like a small personal app, not a general public platform.

## Current Status

- Repository: newly initialized and currently contains documentation only.
- Date of this context: 2026-09-13.
- Delivery constraint: approximately three days until the birthday.
- Initial target pools:
  - Victoria Park Swimming Pool, `swpId=5`.
  - Morrison Hill Swimming Pool, `swpId=4`.
- The pool list must be configuration-driven.

## Source

The LCSD pool pages use this URL pattern:

`https://www.lcsd.gov.hk/clpss/en/webApp/Swimming.do?swpId={swpId}`

The LCSD DATA.GOV.HK swimming-pool dataset also contains the pool names and links to the `swpId` pages. It is useful as metadata, but the temporary closure notices come from the LCSD HTML pages.

The page currently exposes:

- Opening schedules.
- Annual maintenance periods.
- Weekly cleansing operations.
- Temporary closure notices for today and the following 29 days.
- Affected facilities, time range, reason, and remarks.
- Pool phone numbers and the official source page.

Annual maintenance and recurring weekly cleansing are deliberately deferred from the first implementation cut so the notification path can ship safely within the birthday deadline. They remain planned follow-up work.

The LCSD page states that schedules are for reference and can change. The application must show the source link and must not present its result as an official guarantee that a pool is open.

## Product Requirements

### Pool configuration

All monitored pools must be declared in one configuration module, planned at `src/config/pools.ts`.

The configuration should contain at least:

- Numeric `swpId`.
- Display name.
- Enabled/disabled status, if useful for temporarily pausing a pool.
- Optional preferred facilities or default swimming window.

The source URL should be derived from `swpId`; it should not be duplicated in multiple code paths.

Adding Pao Yue Kong, for example, should be equivalent to adding this entry and redeploying:

```ts
{ swpId: 1, name: "Pao Yue Kong Swimming Pool", enabled: true }
```

No parser, notification, database migration, or UI code should contain special cases for pool IDs 1, 4, or 5. The poller must loop over the configured list.

### Availability checks

- Fetch each enabled pool on the daily-summary server-side job.
- Keep the live status page independently refreshable.
- Normalize notices before rendering or summarizing them.
- Treat an `Until further notice` end time as open-ended.
- Preserve the exact affected-facility text from LCSD.
- Distinguish a partial facility closure from a whole-complex closure.
- Do not label a whole pool closed when only a training, teaching, toddler, or other partial facility is affected.

### Notifications

The birthday MVP should support:

- A daily summary of upcoming conflicts.
- The pool name, date, time, affected facilities, reason, and remarks.
- A link to the official LCSD page.
- A stale-data or parser-failure warning for the system owner rather than silently claiming that a pool is open.
- Unsubscribe or pause behavior.

For the birthday MVP, the delivery policy is intentionally quiet: the system sends at most one scheduled daily summary per Hong Kong calendar day. It does not send an immediate notification for every poll or every newly discovered notice. A clear summary is disabled by default, so a day with no relevant notices produces no notification.

The first release does not need real-time admission figures, accounts for many users, payments, or an App Store listing.

### iPhone experience

The preferred first release is an installable Progressive Web App (PWA) with Web Push notifications.

The user journey is:

1. Open the HTTPS site on the iPhone.
2. Add it to the Home Screen.
3. Open the Home Screen icon.
4. Tap an explicit `Enable notifications` action.
5. Approve the iOS notification permission prompt.

The notification permission must be requested from a user action. The app should explain this flow rather than attempting a hidden prompt.

## Notification Rules

The first version should be conservative and useful rather than noisy.

- Do not notify on every poll when the data is unchanged.
- Do not send a first-run flood of old notices; seed the baseline without notifying.
- Send at most one daily summary at a configurable Hong Kong time.
- Include only notices that are active or begin within the default two-day window.
- Include a clear distinction between `Pool closed`, `Facility affected`, and `Routine cleansing`.
- Link each alert to the official source so the user can verify before travelling.

## Quality and Safety

- Keep a fixture of representative LCSD HTML for every parser behavior.
- Test `Until further notice`, partial closures, multiple notices, session breaks, and date/time parsing.
- Use `Asia/Hong_Kong` explicitly for schedule calculations and displayed times.
- Rate-limit polling and cache responses where practical; do not hammer the LCSD site.
- Treat source changes and fetch failures as expected operational risks.
- Store only the minimum data needed for push subscriptions, preferences, and deduplication.
