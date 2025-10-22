-- schema.sql — Custom SQL users for competition
do $$ begin
  create type public.user_role as enum ('helper','manager','admin');
exception when duplicate_object then null; end $$;

create table if not exists public.app_users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null check (position('@' in email) > 1),
  full_name text not null,
  hashed_password text not null,
  role public.user_role not null default 'helper',
  created_at timestamptz not null default now()
);

alter table public.app_users enable row level security;

/* Policies — pick what fits your demo model.
   If you are not using Supabase Auth sessions, you may keep only INSERT public and avoid SELECT policies.
*/

-- Allow anyone to create an account
create policy if not exists "public sign up app_user"
on public.app_users
for insert
to anon, authenticated
with check (true);

-- If you later add Supabase Auth sessions and want users to read/update themselves only:
-- create policy if not exists "read own app_user"
-- on public.app_users for select to authenticated using (auth.uid()::uuid = id);
-- create policy if not exists "update own app_user"
-- on public.app_users for update to authenticated using (auth.uid()::uuid = id) with check (auth.uid()::uuid = id);
