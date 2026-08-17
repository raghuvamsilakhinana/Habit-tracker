# Sprout Guided Workout Plans

This upgrade changes gym setup from manual routine-building to a guided plan generator.

## User flow

1. Choose training frequency: 2–6 days/week.
2. Choose intensity: Low, Medium, or High.
3. Sprout generates a predefined routine for the week.
4. The routine appears automatically in Today's Workout.
5. Existing workout set tracking, history, progression, backdated workout logging, and Gym-habit integration continue to work.
6. Use Customize to manually edit the generated routine afterward.

## Database

Run `workout-setup.sql` in Supabase SQL Editor.

This file is safe to rerun. It also adds two columns to existing `workout_plans` tables:
- `days_per_week`
- `intensity`

No new tables are required for the guided generator.

## Built-in schedules

- 2 days: Full Body A / Full Body B
- 3 days: Full Body A / Full Body B / Full Body C
- 4 days: Upper / Lower × 2
- 5 days: Push / Pull / Legs / Upper / Lower
- 6 days: Push / Pull / Legs × 2

Intensity changes set volume and is saved with the plan.
