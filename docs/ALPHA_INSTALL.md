# Household Assistant Alpha Install Guide

Version: 1.0.0-alpha.1  
Build date: 2026-06-26  
Build type: Installable PWA alpha

## What This Build Is

This alpha is packaged as a Progressive Web App. That is the most practical install path for this project right now because it keeps the app simple, works on Android and Windows, supports offline caching, and keeps household data separate from app files.

Household data is stored in the browser or installed app storage under `householdAssistant.userData.v1`. Normal app updates replace only app files and should not delete debts, savings, users, settings or backups.

## Files To Deploy

Upload the contents of this folder to a static web host:

- `index.html`
- `styles.css`
- `manifest.json`
- `service-worker.js`
- `version.json`
- `CHANGELOG.md`
- `icons/`
- `js/`

Android installation requires a secure HTTPS address. Free static hosts such as Netlify, Cloudflare Pages or GitHub Pages are suitable for alpha testing.

For a beginner-friendly GitHub Pages walkthrough, use `GITHUB_PAGES_DEPLOY.md`.

## Install On Android

1. Export a backup from Settings before moving data between devices.
2. Open the HTTPS app address in Chrome on the Android phone.
3. Sign in or create the household.
4. Open Chrome menu.
5. Tap **Install app** or **Add to Home screen**.
6. Open Household Assistant from the phone home screen.
7. Go to Settings and use **Check for updates**.
8. Go to Settings and tap **Turn on reminders** if you want notification testing.

If the app is opened from a plain local network address such as `http://192.168.x.x`, Android may show a basic shortcut instead of a full installable app. Use HTTPS for the real alpha test.

## Install On Windows

1. Open the HTTPS app address in Microsoft Edge or Chrome.
2. Use the browser install icon in the address bar, or open the browser menu and choose **Install Household Assistant**.
3. The app will open in its own window and continue to use the same app storage for that web address.

For local Windows testing, open the app from the local preview server. Localhost is allowed for browser testing, but phones should use HTTPS for install testing.

## Updates

1. Replace the hosted app files with a newer build.
2. Open the installed app.
3. Go to Settings.
4. Tap **Check for updates**.
5. If an update is ready, tap **Apply safe update** or close and reopen the app.

The update process is designed to refresh app files only. Household data remains in device storage. Still, export a backup before testing a new alpha build.

## Notifications

This alpha supports:

- Android/browser notification permission flow.
- Local test notifications while service workers are available.
- Placeholder settings for bills, chores, calendar and shopping reminders.

Full scheduled reminders will be connected when those modules are implemented.

## Backups

Use Settings > **Export data backup** before:

- Installing on another device.
- Clearing browser data.
- Testing a new hosted URL.
- Applying a new alpha build.

Use **Import backup** to restore household data on another device or hosted URL.
