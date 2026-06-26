# Supabase Sync Setup

This alpha uses Supabase as a small shared cloud storage place for one household.

GitHub Pages hosts the app. Supabase stores the shared household data.

## What You Need

- A Supabase account
- One Supabase project
- Your project URL
- Your publishable key, or the legacy anon public key
- One shared household key
- One shared sync password

The sync password is sent to Supabase over HTTPS and checked by a database function. The app does not upload the sync password inside the household backup payload.

## Step 1: Create A Supabase Project

1. Go to `https://supabase.com`
2. Create an account or sign in
3. Create a new project
4. Choose a strong database password
5. Wait for the project to finish setting up

## Step 2: Add The Sync Database

1. Open your Supabase project
2. Go to **SQL Editor**
3. Create a new query
4. Paste this SQL
5. Click **Run**

```sql
create extension if not exists pgcrypto;

create table if not exists public.household_sync (
  household_key text primary key,
  sync_secret_hash text not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.household_sync enable row level security;

revoke all on public.household_sync from anon;
revoke all on public.household_sync from authenticated;

create or replace function public.push_household(
  p_household_key text,
  p_sync_secret text,
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.household_sync;
  new_hash text;
begin
  if length(trim(p_household_key)) < 8 then
    raise exception 'Household key must be at least 8 characters.';
  end if;

  if length(p_sync_secret) < 10 then
    raise exception 'Sync password must be at least 10 characters.';
  end if;

  select * into existing
  from public.household_sync
  where household_key = p_household_key;

  if existing.household_key is null then
    new_hash := crypt(p_sync_secret, gen_salt('bf'));
    insert into public.household_sync (household_key, sync_secret_hash, payload, updated_at)
    values (p_household_key, new_hash, p_payload, now());
  else
    if crypt(p_sync_secret, existing.sync_secret_hash) <> existing.sync_secret_hash then
      raise exception 'Sync password did not match this household.';
    end if;

    update public.household_sync
    set payload = p_payload,
        updated_at = now()
    where household_key = p_household_key;
  end if;

  return jsonb_build_object(
    'message', 'Cloud household updated.',
    'updated_at', now()
  );
end;
$$;

create or replace function public.pull_household(
  p_household_key text,
  p_sync_secret text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.household_sync;
begin
  select * into existing
  from public.household_sync
  where household_key = p_household_key;

  if existing.household_key is null then
    raise exception 'No household found for that key.';
  end if;

  if crypt(p_sync_secret, existing.sync_secret_hash) <> existing.sync_secret_hash then
    raise exception 'Sync password did not match this household.';
  end if;

  return jsonb_build_object(
    'payload', existing.payload,
    'updated_at', existing.updated_at
  );
end;
$$;

grant execute on function public.push_household(text, text, jsonb) to anon;
grant execute on function public.pull_household(text, text) to anon;
```

## Step 3: Get Your Supabase Details

1. In Supabase, go to **Project Settings**
2. Go to **API**
3. Copy the **Project URL**
4. Copy the **publishable** key. It usually starts with `sb_publishable_`.

## Step 4: Connect The First Phone

1. Open Household Assistant
2. Go to **Settings**
3. Find **Sync between phones**
4. Paste the Supabase URL
5. Paste the publishable key
6. Enter a household key, for example `sara-household-2026`
7. Enter a shared sync password with at least 10 characters
8. Tap **Save sync settings**
9. Tap **Push this phone**

## Step 5: Connect Your Husband's Phone

1. Open the installed app on his phone
2. Go to **Settings**
3. Enter the same Supabase URL
4. Enter the same publishable key
5. Enter the same household key
6. Enter the same sync password
7. Tap **Save sync settings**
8. Tap **Pull cloud copy**

## How To Use Sync In This Alpha

This is manual sync:

- After changing data on your phone, tap **Push this phone**
- On the other phone, tap **Pull cloud copy**

Automatic live sync can be added later once this manual version is tested and stable.

## Safety Notes

- Export a backup before pulling a cloud copy onto a phone with important data.
- Use a strong sync password.
- Do not post your publishable key and household key publicly together with your sync password.
- GitHub Pages still only hosts app files. Household data sync happens through Supabase.
