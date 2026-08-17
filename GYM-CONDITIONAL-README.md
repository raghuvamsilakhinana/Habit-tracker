# Sprout — Conditional Gym Module

The Gym workout module is now fully optional.

## How it works

- If the user has a habit named **Gym** (or **Gym Workout**), Sprout shows the Gym workout module.
- If the user does not have a Gym habit, the workout card, workout setup, planner, session modal, and workout history are hidden.
- When no Gym habit exists, the dashboard does not query the workout tables at all.
- Deleting the Gym habit hides the module but **does not delete workout history** from Supabase.
- Adding Gym again re-enables the module and restores any existing workout plan/history.
- If an existing workout plan was linked to an old Gym habit, it is automatically relinked to the newly added Gym habit.
- Workout plans are always linked to the active Gym habit; finishing a workout marks that habit complete for the workout date.

## Database

No new SQL migration is required for this conditional behavior. It uses the existing workout tables created by `workout-setup.sql`.

If the workout tables have not been created yet, users without a Gym habit will not see an error because those tables are not queried. Once a Gym habit is added, the app will show the normal setup message asking the owner to run `workout-setup.sql`.

## Files changed

- `src/lib/gym.js` — centralized Gym habit detection.
- `src/components/Dashboard.jsx` — conditional rendering and conditional workout data loading.
- `src/components/WorkoutSetupModal.jsx` — uses the centralized Gym habit detector.
- `src/components/WorkoutPlannerModal.jsx` — automatically links the routine to the Gym habit instead of letting it be linked to an unrelated habit.
