# Sprout Gym / Workout Upgrade

This upgrade adds a configurable weekly gym routine, today's workout, set-by-set logging, workout history, personal bests, past-date workout editing, and automatic completion of a linked Gym habit when a workout is finished.

## 1. Database setup
Run `workout-setup.sql` once in the Supabase SQL Editor. It creates five tables with Row Level Security:
- `workout_plans`
- `workout_days`
- `workout_exercises`
- `workout_sessions`
- `workout_sets`

## 2. Frontend
Replace the existing project's `src` folder with the `src` folder in this patch. Keep your existing `.env`, package files, Tailwind/Vite config, and other SQL files.

## 3. What the feature does
- Weekly routine for Mon-Sun with rest days.
- Starter Push / Pull / Legs / Upper split you can edit.
- Link the plan to an existing habit such as `gym`.
- Today's workout appears on the dashboard.
- Log weight + reps for every set.
- Previous numbers are prefilled as a reference when available.
- Save progress without finishing, or finish the workout.
- Finishing a workout marks the linked habit as completed for that date.
- Workout history shows session volume and personal bests.
- You can edit past workouts and log a past workout from History.

## 4. Recommended test
1. Run `npm run build`.
2. Run `npm run dev`.
3. Open the dashboard.
4. Set up a routine and link it to `gym`.
5. Start today's workout, enter a few sets, save and finish.
6. Confirm the Gym habit turns completed.
7. Open Workout History and edit a past session.
8. Check that the habit/streak history stays in sync.
