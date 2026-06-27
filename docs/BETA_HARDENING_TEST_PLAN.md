# Beta Hardening Test Plan

Use this before adding new modules. The goal is to prove privacy, sync and backup are stable for Sara and Zac.

## 1. Supabase Privacy Check

Expected result: only Sara and Zac can access the household.

1. Open Supabase.
2. Go to **Authentication > Users**.
3. Confirm only expected test users exist.
4. Go to **Table Editor > household_members**.
5. Confirm only Sara and Zac are listed for the household.
6. Confirm Sara is `Administrator`.
7. Confirm Zac is `Adult`.
8. Go to **SQL Editor** and run:

```sql
select
  hm.household_id,
  hm.user_id,
  hm.role,
  u.email
from public.household_members hm
join auth.users u on u.id = hm.user_id
order by hm.created_at;
```

Pass: only Sara and Zac appear.

## 2. Wrong User Access Check

Expected result: an unapproved user cannot access the household.

1. Create a temporary Supabase Auth test user.
2. Do not add that user to `household_members`.
3. Sign in with that user in the app.
4. Press **Join existing household**.

Pass: the app says the account is not connected to the household.

Cleanup: delete the temporary test user in Supabase.

## 3. Manual Sync Check

Expected result: changes move both ways.

1. On Sara's phone, make a small debt or savings change.
2. Press **Sync now**.
3. On Zac's phone, press **Sync now**.
4. Confirm Zac sees the change.
5. On Zac's phone, make a different small change.
6. Press **Sync now**.
7. On Sara's phone, press **Sync now**.
8. Confirm Sara sees the change.

Pass: both phones match.

## 4. Conflict Check

Expected result: newest edit wins and warning is clear.

1. Turn off auto-sync temporarily.
2. On Sara's phone, edit the same item.
3. On Zac's phone, edit the same item differently.
4. Sync Sara.
5. Sync Zac.

Pass: the newest edit is kept and the app shows a conflict warning in plain English.

After checking both phones, press **Clear sync message**.

## 5. Automatic Local Backup Check

Expected result: restore points appear before sync changes.

1. Go to **Settings > Backup**.
2. Note the local restore point count.
3. Press **Sync now**.
4. Return to **Backup**.

Pass: a new local restore point appears.

## 6. Restore Check

Expected result: restore is understandable and reversible.

1. Export a normal backup first.
2. Make a small test change.
3. Go to **Settings > Backup**.
4. Press **Restore latest local backup**.
5. Confirm the warning text is understandable.
6. Restore.

Pass: the app returns to the earlier data and tells you to press **Sync now** if the restore should update the other phone.

## 7. Offline Check

Expected result: app stays usable offline.

1. Turn off internet on one phone.
2. Open the app.
3. Confirm the sync banner says **Offline**.
4. Make a small local change.
5. Turn internet back on.
6. Press **Sync now**.

Pass: the app does not lose the local change.

## 8. Mobile Accessibility Check

Expected result: app is comfortable on Android.

1. Check all main screens on Android Chrome.
2. Confirm important buttons are easy to tap.
3. Confirm text is readable in light and dark mode.
4. Confirm the `Small`, `Comfortable`, `Large` and `Extra-large` text settings work.
5. Confirm the app can be used one-handed without endless scrolling for common actions.
6. Confirm reduced scrolling screens still expose Add Debt, Add Goal and Sync Now quickly.

Pass: Sara and Zac can use the app without zooming, guessing or hunting.

## 9. Update Safety Check

Expected result: app updates do not delete household data.

1. Export a backup.
2. Upload the new GitHub Pages files.
3. On each phone, use **Check for updates**.
4. Reopen the app.
5. Confirm debts, savings, streaming services and settings are still present.
6. Press **Sync now** on both phones.

Pass: data remains safe after update.
