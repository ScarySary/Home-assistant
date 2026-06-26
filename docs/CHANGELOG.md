# Household Assistant Changelog

## 1.0.0-alpha.9 - 2026-06-26

- Added a top hamburger menu for quick access to app areas.
- Kept the bottom navigation for one-handed Android use.
- Made debt and savings summary sections collapsible to reduce scrolling.
- Improved banking-app style navigation patterns.

## 1.0.0-alpha.8 - 2026-06-26

- Refreshed the app with a cleaner banking-app inspired visual style.
- Replaced the teal theme with crisper white, charcoal, red and green finance accents.
- Updated cards, buttons, navigation, progress bars and finance list styling.
- Improved dark mode contrast for the new visual style.

## 1.0.0-alpha.7 - 2026-06-26

- Reduced scrolling in Debt Tracker and Savings Goals.
- Added sticky top action bars for adding debts and savings goals.
- Changed debt and savings cards to compact summaries with expandable edit sections.
- Kept delete actions visible on each compact card.

## 1.0.0-alpha.6 - 2026-06-26

- Fixed Android number keypad closing after each digit while editing debt and savings amounts.
- Edit fields now save when the field is finished instead of rerendering after every keypress.

## 1.0.0-alpha.5 - 2026-06-26

- Added confirmation prompts before deleting debts, repayments and savings goals.
- Added editable repayment history for dates and amounts.
- Repayment amount edits now adjust the debt balance.
- Added a quick **Add to goal** action for savings goals.
- Kept direct editing for debt names, balances, original amounts, goal names, targets and saved totals.

## 1.0.0-alpha.4 - 2026-06-26

- Made Supabase Project URL entry more forgiving.
- The app now accepts copied formats like `your-project.supabase.co`, `https://your-project.supabase.co/`, or `https://your-project.supabase.co/rest/v1`.
- Improved the sync setup error message for incorrect Supabase URLs.

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
