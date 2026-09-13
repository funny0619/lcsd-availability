# Implementation Decisions

## Decision 1: Start with a PWA, not a native iOS app

Status: accepted for MVP.

Reason:

- No App Store review or TestFlight distribution is required.
- No Apple Developer Program membership is required for Web Push.
- A Home Screen PWA provides a recognizable app icon and Lock Screen notifications.
- It is faster to update while the LCSD parser and notification rules are still changing.

Tradeoff:

- The user must complete the Add to Home Screen and notification permission flow.
- iOS version 16.4 or later is required.
- Web Push delivery is not a hard real-time or guaranteed channel.

A native SwiftUI or React Native app can be added later if the PWA experience proves insufficient. Native distribution requires Apple Developer membership, currently USD 99 per year, and more signing/distribution work.

## Decision 2: Make pool monitoring configuration-driven

Status: required.

The poller must not contain logic such as `if swpId === 4` or `if swpId === 5`.

The planned configuration shape is:

```ts
export const pools = [
  { swpId: 4, name: "Morrison Hill Swimming Pool", enabled: true },
  { swpId: 5, name: "Victoria Park Swimming Pool", enabled: true },
] as const;
```

The source URL is derived centrally:

```ts
const sourceUrl = `${LCSD_SWIMMING_URL}?swpId=${pool.swpId}`;
```

Adding `swpId=1` must only require a new configuration entry and a redeploy. The configuration should be the source of truth for the UI, poller, and notification routing.

## Decision 3: Use the LCSD detail pages as the availability source

Status: accepted with operational caution.

The DATA.GOV.HK dataset is useful for pool metadata and confirms the `swpId` links, but the temporary closure and event data is exposed on the LCSD detail page. The initial parser will fetch those pages directly.

Risks:

- HTML structure may change.
- Notices may be corrected after a previous poll.
- The LCSD page says information is subject to change.
- Some emergency information may appear only in LCSD press releases.

Mitigations:

- Store source URLs in every notice.
- Keep parser fixtures.
- Compare normalized notices, not raw HTML.
- Monitor fetch and parser failures.
- Show the official disclaimer and pool phone number.

## Decision 4: Preserve partial-facility semantics

Status: required.

A notice affecting a training pool or toddler pool must not automatically be displayed as a whole-pool closure. The notification must preserve affected facilities and allow the user to decide whether the remaining facilities meet her needs.

## Decision 5: Avoid notification spam

Status: required.

The system will seed its first snapshot silently, then notify only on new or materially changed notices. A stable fingerprint should include the pool, time range, facilities, reason, and remarks.

When recurring weekly cleansing is implemented later, it should be represented separately from an exceptional event so the daily summary can explain why a session is unavailable.

## Decision 6: Keep the first release single-user and low-data

Status: accepted for MVP.

The first release does not need public registration or a multi-tenant account system. It needs a secure notification setup flow, device subscription storage, preferences, and an owner-protected poll endpoint.

If the project later becomes public, add authentication and per-user pool preferences without changing the parser or pool configuration model.

## Decision 7: Keep the birthday scheduler simple

Status: accepted for MVP.

The birthday MVP only needs one daily summary, so it does not need a continuously running poller. Use the repository's Vercel Cron configuration to call the protected daily-summary endpoint once per day. A paid scheduler or Cloudflare Cron Trigger can be introduced if immediate alerts are added later.

The scheduled job must be idempotent because scheduled systems can retry or deliver duplicate invocations.

## Decision 8: Use a quiet daily-summary MVP

Status: accepted for the birthday release.

The first release sends at most one notification per Hong Kong calendar day. The scheduled job records the date in `daily_summary_log` so duplicate workflow runs do not create duplicate notifications. If there are no relevant notices, the default behavior is to send nothing.

The default summary window is today and tomorrow. The status page can show the full set of notices published by LCSD, but a notice several days away does not generate repeated daily notifications before it becomes near-term.

The application may poll or refresh the live status page independently of notification delivery. Poll frequency and notification frequency are separate concerns.

Immediate alerts for newly added or changed notices can be added later without changing the pool configuration or parser model.

## Open Questions

- What days and time windows does the swimmer usually plan to swim?
- Should partial facility closures generate alerts, or only closures affecting a selected facility?
- Should notifications be in English, Traditional Chinese, or both?
- What is the birthday deadline for the first deployed version?
- Is the expected notification channel specifically the PWA, or should Telegram/Pushover be retained as a fallback?
