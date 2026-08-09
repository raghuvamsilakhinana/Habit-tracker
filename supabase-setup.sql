-- ============================================================
-- Sprout Habit Tracker — Supabase setup
-- Run this whole file once in Supabase → SQL Editor → New query
-- ============================================================

-- 1. PROFILES TABLE
-- Supabase Auth already stores every user in the built-in `auth.users`
-- table (you never create that one yourself). This `profiles` table is a
-- public-facing companion row per user — the "users" table you can see
-- and query in the app.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Automatically create a profile row whenever someone signs up.
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- 2. HABITS TABLE
create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  color text not null default '#4a5f43',
  icon text not null default '🌿',
  created_at timestamptz not null default now()
);

alter table public.habits enable row level security;

create policy "Users can view their own habits"
  on public.habits for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habits"
  on public.habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on public.habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on public.habits for delete
  using (auth.uid() = user_id);


-- 3. HABIT_LOGS TABLE
-- One row per habit per day it was completed. This is what powers the
-- streaks and the 7-day dot history in the UI.
create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null references public.habits (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  completed_date date not null,
  created_at timestamptz not null default now(),
  unique (habit_id, completed_date)
);

alter table public.habit_logs enable row level security;

create policy "Users can view their own habit logs"
  on public.habit_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert their own habit logs"
  on public.habit_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own habit logs"
  on public.habit_logs for delete
  using (auth.uid() = user_id);


-- 4. HELPFUL INDEXES
create index if not exists habits_user_id_idx on public.habits (user_id);
create index if not exists habit_logs_habit_id_idx on public.habit_logs (habit_id);
create index if not exists habit_logs_user_id_idx on public.habit_logs (user_id);
create index if not exists habit_logs_completed_date_idx on public.habit_logs (completed_date);

-- ============================================================
-- Done. Every table above has Row Level Security enabled, and every
-- policy checks auth.uid() = user_id — so even though all users share
-- the same tables, Postgres itself blocks anyone from reading or writing
-- another user's rows. This is what gives you the "strict data isolation"
-- you asked for, enforced at the database level (not just hidden in the
-- app's UI).
-- ============================================================
