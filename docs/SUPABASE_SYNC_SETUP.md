# Supabase Private Sync Setup

This alpha uses Supabase Auth plus Row Level Security so each signed-in person can only read and update rows for their own household.

Use only:

- Supabase Project URL, for example `https://your-project.supabase.co`
- Supabase publishable key, or legacy anon public key

Never put a `service_role`, secret key, real passwords, private debt data or private household data into GitHub Pages code.

## Step 1: Create The Tables And Policies

Open Supabase, then go to **SQL Editor** and run this script.

```sql
create extension if not exists pgcrypto;

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.household_members (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('Administrator', 'Adult', 'Teen', 'Child')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);

create table if not exists public.household_snapshots (
  household_id uuid primary key references public.households(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.household_snapshots enable row level security;

create or replace function public.is_household_member(p_household_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.household_members
    where household_id = p_household_id
      and user_id = auth.uid()
  );
$$;

create or replace function public.create_household(p_name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_household_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sign in first.';
  end if;

  insert into public.households (name, created_by)
  values (coalesce(nullif(trim(p_name), ''), 'Our Household'), auth.uid())
  returning id into v_household_id;

  insert into public.household_members (household_id, user_id, role)
  values (v_household_id, auth.uid(), 'Administrator');

  insert into public.household_snapshots (household_id, payload, updated_by)
  values (v_household_id, '{}'::jsonb, auth.uid());

  return jsonb_build_object('household_id', v_household_id, 'role', 'Administrator');
end;
$$;

drop policy if exists "households select own" on public.households;
create policy "households select own"
on public.households for select
using (public.is_household_member(id));

drop policy if exists "households update admins" on public.households;
create policy "households update admins"
on public.households for update
using (
  exists (
    select 1 from public.household_members
    where household_id = households.id
      and user_id = auth.uid()
      and role in ('Administrator', 'Adult')
  )
);

drop policy if exists "members select own household" on public.household_members;
create policy "members select own household"
on public.household_members for select
using (public.is_household_member(household_id));

drop policy if exists "members manage admins" on public.household_members;
create policy "members manage admins"
on public.household_members for all
using (
  exists (
    select 1 from public.household_members owner
    where owner.household_id = household_members.household_id
      and owner.user_id = auth.uid()
      and owner.role = 'Administrator'
  )
)
with check (
  exists (
    select 1 from public.household_members owner
    where owner.household_id = household_members.household_id
      and owner.user_id = auth.uid()
      and owner.role = 'Administrator'
  )
);

drop policy if exists "snapshots select own household" on public.household_snapshots;
create policy "snapshots select own household"
on public.household_snapshots for select
using (public.is_household_member(household_id));

drop policy if exists "snapshots upsert own household" on public.household_snapshots;
create policy "snapshots upsert own household"
on public.household_snapshots for all
using (public.is_household_member(household_id))
with check (public.is_household_member(household_id));

grant execute on function public.create_household(text) to authenticated;
grant execute on function public.is_household_member(uuid) to authenticated;
```

## Step 2: App Setup

1. Open the app.
2. Go to **Settings**.
3. Open **Sync**.
4. Paste the Supabase Project URL.
5. Paste the publishable or anon key.
6. Tap **Save sync settings**.
7. Tap **Export backup first**.
8. Sign in or create a Supabase Auth account.
9. Tap **Create cloud household** on Sara's phone.
10. On Zac's phone, sign in with his own Supabase Auth account.
11. Add Zac to `household_members` in Supabase with the same `household_id`, or later use the app invite flow when it is built.
12. Zac taps **Join existing household**.
13. Tap **Sync now**.

## Adding Zac Manually During Alpha

Until the invite screen is built, add the second user in Supabase SQL Editor:

```sql
insert into public.household_members (household_id, user_id, role)
values ('PASTE_HOUSEHOLD_ID_HERE', 'PASTE_ZAC_AUTH_USER_ID_HERE', 'Adult')
on conflict (household_id, user_id) do update set role = excluded.role;
```

You can find Zac's Auth user ID in **Authentication > Users**.

## Sync Safety

- The app keeps local browser backup/import.
- First sync is manual.
- Auto-sync unlocks only after a backup, sign-in and one successful manual sync.
- If two devices edit the same item, the newest `updatedAt` timestamp wins and the app shows a conflict warning.
- Exported backup files remove cloud access tokens and old shared sync passwords.

## Private Android Beta Notes

This PWA is ready for private phone testing once GitHub Pages is updated and Supabase RLS is installed. A future APK/Google Play build should wrap the same app with Capacitor without changing the data model.
