-- Sprout: gym workout planning and tracking
-- Run once in Supabase SQL Editor after the existing habit/rest-day/challenge setup scripts.

create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null default 'My Gym Routine',
  linked_habit_id uuid references public.habits(id) on delete set null,
  days_per_week smallint check (days_per_week between 2 and 6),
  intensity text check (intensity in ('low', 'medium', 'high')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Safe migration for installations that already have workout_plans.
alter table public.workout_plans add column if not exists days_per_week smallint check (days_per_week between 2 and 6);
alter table public.workout_plans add column if not exists intensity text check (intensity in ('low', 'medium', 'high'));

create unique index if not exists workout_plans_one_active_per_user
  on public.workout_plans(user_id) where is_active = true;

create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  name text not null,
  focus text,
  is_rest boolean not null default false,
  unique(plan_id, day_of_week)
);

create table if not exists public.workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  exercise_name text not null,
  exercise_order smallint not null default 0,
  target_sets smallint not null default 3 check (target_sets between 1 and 20),
  target_rep_min smallint not null default 8 check (target_rep_min between 1 and 100),
  target_rep_max smallint not null default 12 check (target_rep_max between 1 and 100),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint workout_rep_range check (target_rep_max >= target_rep_min)
);

create table if not exists public.workout_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_day_id uuid not null references public.workout_days(id) on delete restrict,
  workout_date date not null,
  completed_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, workout_date)
);

create table if not exists public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.workout_exercises(id) on delete restrict,
  set_number smallint not null check (set_number > 0),
  weight_kg numeric(8,2),
  reps smallint,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  unique(session_id, exercise_id, set_number)
);

create index if not exists workout_days_plan_idx on public.workout_days(plan_id, day_of_week);
create index if not exists workout_exercises_day_idx on public.workout_exercises(workout_day_id, exercise_order);
create index if not exists workout_sessions_user_date_idx on public.workout_sessions(user_id, workout_date desc);
create index if not exists workout_sets_session_idx on public.workout_sets(session_id);

alter table public.workout_plans enable row level security;
alter table public.workout_days enable row level security;
alter table public.workout_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_sets enable row level security;

drop policy if exists "Users can view own workout plans" on public.workout_plans;
create policy "Users can view own workout plans" on public.workout_plans for select using (auth.uid() = user_id);
drop policy if exists "Users can create own workout plans" on public.workout_plans;
create policy "Users can create own workout plans" on public.workout_plans for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own workout plans" on public.workout_plans;
create policy "Users can update own workout plans" on public.workout_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own workout plans" on public.workout_plans;
create policy "Users can delete own workout plans" on public.workout_plans for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own workout days" on public.workout_days;
create policy "Users can view own workout days" on public.workout_days for select using (exists (select 1 from public.workout_plans p where p.id = workout_days.plan_id and p.user_id = auth.uid()));
drop policy if exists "Users can create own workout days" on public.workout_days;
create policy "Users can create own workout days" on public.workout_days for insert with check (exists (select 1 from public.workout_plans p where p.id = workout_days.plan_id and p.user_id = auth.uid()));
drop policy if exists "Users can update own workout days" on public.workout_days;
create policy "Users can update own workout days" on public.workout_days for update using (exists (select 1 from public.workout_plans p where p.id = workout_days.plan_id and p.user_id = auth.uid())) with check (exists (select 1 from public.workout_plans p where p.id = workout_days.plan_id and p.user_id = auth.uid()));
drop policy if exists "Users can delete own workout days" on public.workout_days;
create policy "Users can delete own workout days" on public.workout_days for delete using (exists (select 1 from public.workout_plans p where p.id = workout_days.plan_id and p.user_id = auth.uid()));

drop policy if exists "Users can view own workout exercises" on public.workout_exercises;
create policy "Users can view own workout exercises" on public.workout_exercises for select using (exists (select 1 from public.workout_days d join public.workout_plans p on p.id = d.plan_id where d.id = workout_exercises.workout_day_id and p.user_id = auth.uid()));
drop policy if exists "Users can create own workout exercises" on public.workout_exercises;
create policy "Users can create own workout exercises" on public.workout_exercises for insert with check (exists (select 1 from public.workout_days d join public.workout_plans p on p.id = d.plan_id where d.id = workout_exercises.workout_day_id and p.user_id = auth.uid()));
drop policy if exists "Users can update own workout exercises" on public.workout_exercises;
create policy "Users can update own workout exercises" on public.workout_exercises for update using (exists (select 1 from public.workout_days d join public.workout_plans p on p.id = d.plan_id where d.id = workout_exercises.workout_day_id and p.user_id = auth.uid())) with check (exists (select 1 from public.workout_days d join public.workout_plans p on p.id = d.plan_id where d.id = workout_exercises.workout_day_id and p.user_id = auth.uid()));
drop policy if exists "Users can delete own workout exercises" on public.workout_exercises;
create policy "Users can delete own workout exercises" on public.workout_exercises for delete using (exists (select 1 from public.workout_days d join public.workout_plans p on p.id = d.plan_id where d.id = workout_exercises.workout_day_id and p.user_id = auth.uid()));

drop policy if exists "Users can view own workout sessions" on public.workout_sessions;
create policy "Users can view own workout sessions" on public.workout_sessions for select using (auth.uid() = user_id);
drop policy if exists "Users can create own workout sessions" on public.workout_sessions;
create policy "Users can create own workout sessions" on public.workout_sessions for insert with check (auth.uid() = user_id);
drop policy if exists "Users can update own workout sessions" on public.workout_sessions;
create policy "Users can update own workout sessions" on public.workout_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "Users can delete own workout sessions" on public.workout_sessions;
create policy "Users can delete own workout sessions" on public.workout_sessions for delete using (auth.uid() = user_id);

drop policy if exists "Users can view own workout sets" on public.workout_sets;
create policy "Users can view own workout sets" on public.workout_sets for select using (exists (select 1 from public.workout_sessions s where s.id = workout_sets.session_id and s.user_id = auth.uid()));
drop policy if exists "Users can create own workout sets" on public.workout_sets;
create policy "Users can create own workout sets" on public.workout_sets for insert with check (exists (select 1 from public.workout_sessions s where s.id = workout_sets.session_id and s.user_id = auth.uid()));
drop policy if exists "Users can update own workout sets" on public.workout_sets;
create policy "Users can update own workout sets" on public.workout_sets for update using (exists (select 1 from public.workout_sessions s where s.id = workout_sets.session_id and s.user_id = auth.uid())) with check (exists (select 1 from public.workout_sessions s where s.id = workout_sets.session_id and s.user_id = auth.uid()));
drop policy if exists "Users can delete own workout sets" on public.workout_sets;
create policy "Users can delete own workout sets" on public.workout_sets for delete using (exists (select 1 from public.workout_sessions s where s.id = workout_sets.session_id and s.user_id = auth.uid()));
