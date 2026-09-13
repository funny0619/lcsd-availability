# Three-Day Delivery Plan

## Delivery Constraint

The first usable version is needed in approximately three days. The priority order is:

1. A notification reaches an iPhone reliably.
2. The application detects real LCSD changes correctly.
3. The recipient sees a simple, polished pool status page.
4. Additional configuration and visual polish.

Do not wait until the final day to test the push path. The first deployed version should be able to send a manually triggered test notification before the LCSD parser is complete.

## Scope Freeze

The birthday MVP contains:

- Victoria Park, `swpId=5`.
- Morrison Hill, `swpId=4`.
- Configuration-driven support for adding further `swpId` values.
- Temporary closure notices.
- One daily summary.
- One recipient and a small number of devices.
- English UI and notifications initially.
- Official source links and pool phone numbers.

Defer these items:

- App Store distribution.
- Native SwiftUI or React Native code.
- User accounts and public registration.
- Real-time admission figures.
- Automatic alternative-pool recommendations.
- Complex calendar integration.
- Full notification preference management.
- Annual maintenance and weekly cleansing calculations.

## Discreet Testing Strategy

The recipient's phone should not be needed during normal development. The final Web Push subscription is device-specific, so test the complete flow on a developer-controlled device first.

### Test the parser without waiting for a real event

- Save representative LCSD responses as local HTML fixtures.
- Include fixtures for a competition, a partial facility closure, `Until further notice`, no notices, and multiple notices.
- Run the deterministic parser against those fixtures.
- Change a fixture to simulate a newly added or edited event.
- Assert that the normalized fingerprint changes only when the meaningful notice changes.

### Test the notification pipeline without changing LCSD data

Add a protected development/admin action that sends a known test payload such as:

```text
Test alert: Victoria Park Swimming Pool
Main Pool closed tomorrow from 18:00 to 22:00 for a simulated competition.
```

The action should use the same notification sender as real alerts. Protect it with a secret and remove or disable it before public use. This tests subscription storage, VAPID credentials, the push provider, the service worker, the Lock Screen notification, and notification click handling.

### Test the iPhone behavior

- Use the developer's own iPhone if available.
- Otherwise use another consenting iPhone or a spare device.
- Deploy to an HTTPS staging or production URL early.
- Add that site to the device Home Screen.
- Enable notifications from inside the installed PWA.
- Trigger the protected test alert.
- Lock the screen, verify delivery, and tap the alert.
- Revoke permission and resubscribe once to test the recovery path.

Desktop Chrome and Android are useful for testing the general Web Push implementation, but they do not replace a real iPhone test because iOS has the Home Screen installation requirement.

The recipient's phone should only be used after this passes. Her device will need its own Home Screen installation and its own push subscription; a subscription from the developer's phone cannot be transferred.

The iOS permission prompt and Home Screen icon are visible by design. Do not attempt to bypass or hide the operating system permission flow. With the agreed open-phone setup, the final installation should take only a few minutes.

## Suggested Sequence

### Day 1: Prove deployment and push

- Scaffold the application and deploy HTTPS immediately.
- Add the PWA manifest and service worker.
- Implement subscription registration and storage.
- Generate VAPID keys and configure server secrets.
- Send a protected manual test notification to the developer's device.
- Confirm the Lock Screen notification and click-through behavior.

If Web Push has not worked on a real iPhone by the end of Day 1, stop adding UI and resolve that issue before continuing.

### Day 2: Add LCSD availability logic

- Add the central pool configuration.
- Add HTML fixtures and parser tests.
- Parse the two initial `swpId` pages.
- Normalize notices and build the today/tomorrow summary.
- Add the Vercel daily-summary schedule and daily-send log.
- Run a live check against LCSD and verify the current output manually.
- Connect the daily summary to the already-tested notification sender.

### Day 3: Integrate and prepare the gift

- Add the daily summary.
- Add source links, phone numbers, stale-data state, and unsubscribe/pause behavior.
- Test a simulated new notice end to end.
- Test a real current LCSD notice without sending duplicate alerts.
- Configure the final pool list and notification wording.
- Perform the final iPhone installation and permission step.
- Keep the manual test action protected or disabled.

## Fallback

If the PWA is not delivering reliably on a real iPhone by the middle of Day 2, use a notification adapter so the checker can send through Telegram or Pushover instead. The LCSD parser and deduplication logic should remain unchanged.

The fallback is a delivery channel change, not a second application project. It should only be used if the recipient already uses the selected service or is willing to install it.

## Release Checklist

- `swpId=4` and `swpId=5` are monitored from configuration.
- A new `swpId` can be added without changing parser code.
- Parser fixtures pass.
- A simulated notice creates exactly one notification.
- The same notice on the next poll creates no notification.
- A changed time, facility, reason, or remark creates an updated notification.
- Partial closures are not shown as whole-pool closures.
- The notification arrives while the PWA is closed.
- The notification opens the relevant pool/source page.
- LCSD fetch or parser failure is visible as stale data.
- Secrets are not committed.
- The final recipient device has completed the visible iOS permission flow.
