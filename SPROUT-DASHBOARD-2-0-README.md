# Sprout Dashboard 2.0 test build

This build keeps the existing Sprout functionality and adds the agreed dashboard/UX changes.

## Dashboard changes
- Today's Workout is collapsed by default and expands on demand.
- Daily Practice / Your habits is collapsed by default and expands when the user wants to record today's entries.
- Gym remains conditional: the workout module is shown only when the user has a Gym habit.
- Workout progress remains visible in the collapsed summary.
- Daily habit completion percentage and remaining entries remain visible in the collapsed summary.

## Visual changes
- Reduced the dominant green treatment.
- Added a restrained premium palette using charcoal, coral, teal, blue, violet and amber accents.
- Added atmospheric background colour blooms.
- Added smoother expand/collapse motion and micro-interactions.
- Added richer progress gradients and more differentiated habit accents.
- Preserved the existing Supabase/data model and workout/challenge/history functionality.

## Testing
Run:

npm install
npm run dev

Then test:
1. Dashboard loads with Workout collapsed when Gym is enabled.
2. Tapping Workout expands/collapses the details.
3. Start/Resume Workout still opens the workout session.
4. Daily Practice is collapsed on initial dashboard load.
5. Tapping Daily Practice expands the habit cards.
6. Habit completion still cycles through complete → partial → clear.
7. A user without a Gym habit does not see the workout module.
