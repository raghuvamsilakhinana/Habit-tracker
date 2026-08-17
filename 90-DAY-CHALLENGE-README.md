# Sprout — 90 Day Challenge

This patch adds a persistent 90-day challenge system to the existing Sprout habit tracker.

## What it adds

- One active 90-day challenge per user.
- Challenge name and start date (future starts are not allowed).
- Select which existing habits participate.
- Choose a daily success threshold: 70%, 80%, or 100%.
- Automatic 90-day end date.
- Dashboard challenge card with day progress, remaining days, current/best challenge streak, successful days, and success rate.
- Challenge detail modal with milestones at days 7, 14, 30, 45, 60, 75, and 90.
- Challenge calendar showing successful, partial, missed, rest, and future days.
- Existing backdated-entry workflow can correct challenge days automatically because challenge progress is derived from `habit_logs`.
- No duplicate habit log data is created.

## One-time Supabase setup

Run `90-day-challenge-setup.sql` once in the Supabase SQL Editor for your project.

The SQL creates the `public.challenges` table, indexes, and user-owned RLS policies. It does not alter your existing `habits` or `habit_logs` tables.

## Install the code

Replace your existing project's `src` folder with the `src` folder in this patch. Do not replace `.env`, `package.json`, `package-lock.json`, or your existing root configuration files.

Then run:

```bash
npm run build
npm run dev
```

## Behavior

The challenge is calculated from the existing habit logs. A selected habit contributes 100% when completed, 50% when partial, and 0% when missed. Intentional rest days are excluded from that day's denominator. A successful day is one where the calculated challenge score reaches the chosen target percentage.

Missed days do not permanently end the 90-day challenge. They simply count as missed days and reduce the success rate/current streak. Backdated corrections automatically change challenge results because the app recalculates from the database logs.
