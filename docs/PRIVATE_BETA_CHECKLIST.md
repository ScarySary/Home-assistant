# Private Android Beta Checklist

Use this before inviting real testers.

## Data Safety

- Export a local backup before first sync on every phone.
- Confirm no real household data is committed to GitHub.
- Confirm no passwords, service_role keys or secret keys are in app files.
- Confirm Supabase Row Level Security is enabled on every table.
- Confirm each tester has their own Supabase Auth user.
- Confirm each tester can only access their household rows.

## PWA Testing

- Install from Android Chrome.
- Confirm the app opens from the home screen.
- Confirm local data survives a GitHub Pages update.
- Confirm Settings shows the correct app version.
- Confirm manual **Sync now** works before enabling auto-sync.
- Confirm backup export/import still works after sync is configured.

## Google Play Private Beta Later

- Wrap the existing PWA with Capacitor.
- Keep the same localStorage data key until a tested migration exists.
- Keep Supabase Auth and RLS as the privacy boundary.
- Use a real app icon, privacy policy and tester-only Play track.
- Test update installs without clearing household data.
- Test Android notification permissions on physical phones.

## Remaining Before Google Play Beta

- Finish invite flow so Sara can add Zac from inside the app instead of Supabase Table Editor.
- Add a privacy policy covering Supabase Auth, household data, backups and notifications.
- Add a visible data deletion/export explanation for beta testers.
- Test install/update on at least two Android versions.
- Test offline edits followed by sync recovery.
- Test restore from local backup after a bad sync.
- Confirm no service_role key or private data is present in packaged app files.
- Confirm accessibility with large text, high contrast and reduced motion.
- Decide whether the beta remains PWA-only or moves to a Capacitor wrapper.
