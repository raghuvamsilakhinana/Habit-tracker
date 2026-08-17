-- Sprout: in-app admin notifications
-- Run once in the Supabase SQL Editor before testing the notification feature.
-- This is IN-APP ONLY. It does not configure email, SMS, or browser push.

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  sender_user_id uuid references auth.users(id) on delete set null,
  title text not null default 'A note from Sprout',
  message text not null,
  category text not null default 'motivation' check (category in ('motivation', 'progress', 'celebration')),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists notifications_recipient_created_idx
  on public.notifications(recipient_user_id, created_at desc);

create index if not exists notifications_unread_idx
  on public.notifications(recipient_user_id, read_at)
  where read_at is null;

alter table public.notifications enable row level security;

-- Users can only see their own notifications.
drop policy if exists "Users can view own notifications" on public.notifications;
create policy "Users can view own notifications"
  on public.notifications for select
  using (auth.uid() = recipient_user_id);

-- Users can mark their own notifications as read. They cannot change the message itself.
drop policy if exists "Users can mark own notifications read" on public.notifications;
create policy "Users can mark own notifications read"
  on public.notifications for update
  using (auth.uid() = recipient_user_id)
  with check (auth.uid() = recipient_user_id);

-- Guard the row so regular users can change only read_at, not the sender/content/recipient.
create or replace function public.prevent_notification_content_changes()
returns trigger
language plpgsql
as $$
begin
  if new.recipient_user_id is distinct from old.recipient_user_id
     or new.sender_user_id is distinct from old.sender_user_id
     or new.title is distinct from old.title
     or new.message is distinct from old.message
     or new.category is distinct from old.category
     or new.created_at is distinct from old.created_at then
    raise exception 'Notification content is immutable';
  end if;
  return new;
end;
$$;

drop trigger if exists notifications_immutable_content on public.notifications;
create trigger notifications_immutable_content
before update on public.notifications
for each row execute function public.prevent_notification_content_changes();

-- Only accounts marked as admins in profiles may create notifications for other users.
-- The admin check is enforced in the database, not just in the React UI.
drop policy if exists "Admins can send notifications" on public.notifications;
create policy "Admins can send notifications"
  on public.notifications for insert
  with check (
    exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.is_admin = true
    )
  );

-- Admins may review sent notifications from the Admin Console.
drop policy if exists "Admins can view sent notifications" on public.notifications;
create policy "Admins can view sent notifications"
  on public.notifications for select
  using (
    auth.uid() = recipient_user_id
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.is_admin = true
    )
  );

-- Keep regular users from deleting notifications.
-- Admins can also leave the history intact; the Admin Console does not expose delete.
