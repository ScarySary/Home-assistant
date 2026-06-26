# Household Assistant

Household Assistant is a private, installable household management app for Android phones, Windows and modern browsers.

Current alpha features:

- Home dashboard
- Debt tracker
- Savings goals
- Household users and roles
- Backup, export and import
- Dark mode and accessibility settings
- Manual update checks
- Notification permission flow and local test reminders

This project is currently packaged as a Progressive Web App. It can be hosted on GitHub Pages and installed from Chrome on Android.

## Important Data Note

Household data is stored on each device in browser or installed app storage under `householdAssistant.userData.v1`. App updates replace the app files only. They do not intentionally erase household data.

Always export a backup before:

- Installing on another device
- Clearing browser data
- Changing the GitHub Pages address
- Testing a new alpha build

## Deployment

Follow [GITHUB_PAGES_DEPLOY.md](GITHUB_PAGES_DEPLOY.md) to publish this app to GitHub Pages and install it on Android.
