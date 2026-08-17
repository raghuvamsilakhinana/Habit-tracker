# Sprout — In-App Admin Notifications

This update adds an in-app coaching/notification layer.

## What is included

- Admin performance view with today, 7-day consistency, streak and note count.
- Admin can send a motivational message to one user.
- Admin can send a motivational message to all non-admin users.
- Quick-start motivational message templates.
- Message categories: Motivation, Progress, Celebration.
- User notification bell with unread count.
- Notification center with read/unread state and Mark all as read.
- Notifications stay entirely inside Sprout. No email, SMS, browser push, or external notification is configured.

## Required Supabase step

Run `notifications-setup.sql` once in the Supabase SQL Editor.

You do NOT need to run the workout or challenge SQL files again for this feature.

## Local test

```bash
npm install
npm run dev
```

## Production build

```bash
npm run build
```

## Security

The Admin Console UI checks `profiles.is_admin`, but the database also enforces the same rule on notification inserts using an RLS policy. Normal users can only read/update their own notifications.
