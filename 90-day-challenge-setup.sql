-- Sprout: 90-day challenge support
-- Run once in Supabase SQL Editor.

create table if not exists public.challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  selected_habit_ids uuid[] not null default '{}',
  target_percent smallint not null default 80 check (target_percent between 1 and 100),
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  constraint challenges_date_order check (end_date >= start_date)
);

create unique index if not exists challenges_one_active_per_user
  on public.challenges(user_id)
  where status = 'active';

create index if not exists challenges_user_created_idx
  on public.challenges(user_id, created_at desc);

alter table public.challenges enable row level security;

drop policy if exists "Users can view own challenges" on public.challenges;
create policy "Users can view own challenges"
  on public.challenges for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own challenges" on public.challenges;
create policy "Users can create own challenges"
  on public.challenges for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own challenges" on public.challenges;
create policy "Users can update own challenges"
  on public.challenges for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own challenges" on public.challenges;
create policy "Users can delete own challenges"
  on public.challenges for delete
  using (auth.uid() = user_id);
