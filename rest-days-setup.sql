-- ============================================================
-- Sprout — Rest days & partial completion
-- Run this AFTER supabase-setup.sql (and admin-setup.sql if you
-- installed the admin console). Safe to run more than once.
-- ============================================================

-- 1. Rest days: which weekdays (0=Sunday .. 6=Saturday) a habit is
--    intentionally NOT tracked on — e.g. no gym on Sundays.
--    Empty array = tracked every day (the old default behavior).
alter table public.habits
  add column if not exists rest_days integer[] not null default '{}';

-- 2. Status on each log: 'completed' (full credit) or 'partial'
--    (half credit). Absence of a row still means "not done".
alter table public.habit_logs
  add column if not exists status text not null default 'completed';

alter table public.habit_logs
  drop constraint if exists habit_logs_status_check;

alter table public.habit_logs
  add constraint habit_logs_status_check
  check (status in ('completed', 'partial'));

-- ============================================================
-- No RLS changes needed — the existing "own rows only" policies
-- from supabase-setup.sql already cover these new columns.
-- ============================================================
