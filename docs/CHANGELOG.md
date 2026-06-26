# Household Assistant Changelog

## 1.0.0-alpha.3 - 2026-06-26

- Updated Supabase sync wording to match the newer **publishable key** dashboard label.
- Added support for `sb_publishable_...` keys in manual sync requests.

## 1.0.0-alpha.2 - 2026-06-26

- Added optional Supabase manual sync foundation for sharing one household across phones.
- Added Settings controls for Supabase URL, anon key, household key and shared sync password.
- Added manual **Push this phone** and **Pull cloud copy** sync actions.
- Added `SUPABASE_SYNC_SETUP.md` with the database setup SQL and phone setup instructions.
- Kept sync optional so the app still works offline without Supabase.

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
