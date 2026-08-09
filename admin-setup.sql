-- ============================================================
-- Sprout — Admin console setup
-- Run this AFTER supabase-setup.sql, in the same SQL Editor.
-- Safe to run more than once.
-- ============================================================

-- 1. Add an admin flag to profiles. Defaults to false for everyone.
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- 2. Helper function: checks if the CURRENT logged-in user is an admin.
--    Marked SECURITY DEFINER so it can read the profiles table without
--    triggering RLS recursion (a policy calling a function that queries
--    the very table the policy protects would otherwise deadlock).
create or replace function public.is_admin()
returns boolean as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  );
$$ language sql security definer stable;
-- this is a test
-- 3. Admin policies: on top of the existing "own data only" policies,
--    these let anyone with is_admin = true read (and manage) every
--    row in every table, regardless of who owns it.

drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

drop policy if exists "Admins can update all profiles" on public.profiles;
create policy "Admins can update all profiles"
  on public.profiles for update
  using (public.is_admin());

drop policy if exists "Admins can view all habits" on public.habits;
create policy "Admins can view all habits"
  on public.habits for select
  using (public.is_admin());

drop policy if exists "Admins can delete any habit" on public.habits;
create policy "Admins can delete any habit"
  on public.habits for delete
  using (public.is_admin());

drop policy if exists "Admins can view all habit logs" on public.habit_logs;
create policy "Admins can view all habit logs"
  on public.habit_logs for select
  using (public.is_admin());

drop policy if exists "Admins can delete any habit log" on public.habit_logs;
create policy "Admins can delete any habit log"
  on public.habit_logs for delete
  using (public.is_admin());

-- ============================================================
-- IMPORTANT — how to actually make yourself an admin:
--
-- Do NOT build a button in the app for this. Instead:
--   1. In Supabase, go to Table Editor -> profiles
--   2. Find the row with your email
--   3. Click the is_admin cell and change it to true
--   4. Save
--
-- That's it. Log out and back into the app, and you'll see an
-- "Admin console" link in the dashboard header. Only ever grant this
-- by hand, per person, directly in the database.
-- ============================================================
