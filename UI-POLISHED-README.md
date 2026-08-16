# Sprout UI Polished — v2

This is an overlay update for the existing Habit Tracker repository.

## Included
- Refined responsive dashboard layout
- Improved contrast, spacing, card hierarchy and mobile behavior
- Compact Today hero with progress ring
- Cleaner quick actions
- Refined streak/stat cards
- Habit cards with clearer streak presentation and milestone progress
- Interactive 12-week consistency heatmap with date details on hover/focus
- Polished login/signup screen
- Polished Add Habit modal
- Polished Backdated Entry modal
- Refined light/dark theme toggle
- Existing backdated-entry and all-time streak functionality preserved

## Installation
1. Back up your current project folder.
2. Extract this ZIP.
3. Copy the extracted `Habit-tracker/src` folder over your current project's `src` folder.
4. Do NOT replace `.env`, `package.json`, `index.html`, `tailwind.config.js`, `postcss.config.js`, `vite.config.js`, or your SQL files.
5. From the project root run:

   npm run build

6. If the build succeeds, run:

   npm run dev

7. Test the dashboard, habit completion, partial completion, backdated entries, streaks, heatmap, dark/light mode and mobile layout before pushing.

The ZIP intentionally does not contain your `.env` or Supabase credentials.
