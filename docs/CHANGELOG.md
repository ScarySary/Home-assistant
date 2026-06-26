# Household Assistant Changelog

## 1.0.0-alpha.1 - 2026-06-26

- Prepared the app as an installable PWA alpha for Android and Windows/browser testing.
- Added app version, build channel and update status in Settings.
- Added manual "Check for updates" and safe update controls.
- Added notification permission flow, local test notification support and reminder placeholders.
- Added PWA manifest icons, app metadata and offline shell caching.
- Kept household data in separate browser storage so normal app updates do not erase users, debts, savings or settings.

## Testing Notes

- Export a backup before installing on a new device.
- Install from a secure HTTPS address for Android PWA testing.
- If the app is refreshed or updated, household data should remain available unless browser/site data is manually cleared.
