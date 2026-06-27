# Household Assistant

Household Assistant is a private, installable household management app for Android phones, Windows and modern browsers.

Current alpha features:

- Home dashboard
- Debt tracker
- Savings goals
- Streaming services without stored passwords
- Household users and roles
- Backup, export and import
- Dark mode and accessibility settings
- Manual update checks
- Notification permission flow and local test reminders
- Optional Supabase Auth private household sync foundation

This project is currently packaged as a Progressive Web App. It can be hosted on GitHub Pages and installed from Chrome on Android.

## Important Data Note

Household data is stored on each device in browser or installed app storage under `householdAssistant.userData.v1`. App updates replace the app files only. They do not intentionally erase household data.

The app files contain fake demo data only. Do not commit real household data, passwords, Supabase service_role keys or secret keys to GitHub. Client-side code should use only the Supabase publishable key or legacy anon public key.

Always export a backup before:

- Installing on another device
- Clearing browser data
- Changing the GitHub Pages address
- Testing a new alpha build

## Deployment

Follow [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md) to publish this app to GitHub Pages and install it on Android.

Follow [SUPABASE_SYNC_SETUP.md](SUPABASE_SYNC_SETUP.md) to set up shared household sync between phones.

Use [BETA_HARDENING_TEST_PLAN.md](BETA_HARDENING_TEST_PLAN.md) to test privacy, sync, backup and Android accessibility before adding new modules.

Use [PRIVATE_BETA_CHECKLIST.md](PRIVATE_BETA_CHECKLIST.md) before inviting testers, and [CAPACITOR_PLAN.md](CAPACITOR_PLAN.md) when preparing a future private Android beta wrapper.
