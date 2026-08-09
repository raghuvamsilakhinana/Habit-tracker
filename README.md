# Sprout — Habit Tracker

A multi-user habit tracker built with React, Tailwind CSS, and Supabase.
Every step below assumes you've never done this before — follow them in order.

---

## What you're getting

- Email/password sign up, login, logout (Supabase Auth)
- Each user only ever sees their own habits — enforced by the database itself, not just hidden in the UI
- Add, check off, and delete daily habits
- 7-day streak history per habit, dark/light mode, smooth animations

---

## Part 1 — Create your Supabase project

1. Go to **[supabase.com](https://supabase.com)** and sign up (free tier is fine).
2. Click **New Project**. Pick any name, set a database password (save it somewhere), pick a region close to you, and click **Create new project**. Wait ~2 minutes for it to finish setting up.
3. In the left sidebar, click the **SQL Editor** icon.
4. Click **New query**.
5. Open the file **`supabase-setup.sql`** (included in this project), copy its entire contents, and paste it into the SQL Editor.
6. Click **Run** (bottom right). You should see "Success. No rows returned." This created three tables — `profiles`, `habits`, `habit_logs` — and locked each one down with Row Level Security so users can only ever touch their own rows.
7. In the left sidebar, go to **Project Settings → API**. You'll need two values from this page in a minute:
   - **Project URL**
   - **anon public** key (NOT the `service_role` key — never put that one in frontend code)

### Turn off email confirmation while you're testing (optional but recommended)

By default Supabase requires users to click a confirmation email before they can log in. While you're testing locally this just slows you down.

Go to **Authentication → Providers → Email** and toggle **Confirm email** off. You can turn it back on before you launch for real.

---

## Part 2 — Run the app on your computer

### One-time setup

1. Install **Node.js** (version 18 or later) from [nodejs.org](https://nodejs.org) if you don't already have it. The installer handles everything — just click through it.
2. Unzip this project folder somewhere, e.g. your Desktop.
3. Open a terminal (Mac: **Terminal** app; Windows: **PowerShell**) and navigate into the folder:
   ```bash
   cd path/to/habit-tracker
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Create your environment file:
   ```bash
   cp .env.example .env
   ```
   (On Windows, if `cp` doesn't work, just duplicate `.env.example` and rename the copy to `.env`.)
6. Open `.env` in any text editor and paste in the **Project URL** and **anon public** key from Part 1, step 7:
   ```
   VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Run it

```bash
npm run dev
```

Open the URL it prints (usually `http://localhost:5173`) in your browser. Sign up with any email/password, and you should land on the dashboard.

---

## Part 3 — Deploy it live (Vercel, free)

1. Push this folder to a GitHub repository. If you don't have one yet: create a new repo on [github.com](https://github.com), then in your project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/your-repo.git
   git push -u origin main
   ```
2. Go to **[vercel.com](https://vercel.com)**, sign up with GitHub, and click **Add New → Project**.
3. Import your repo. Vercel auto-detects it as a Vite project — leave the build settings as-is.
4. Before deploying, open **Environment Variables** and add the same two values from your `.env` file:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Click **Deploy**. In about a minute you'll get a live URL like `your-app.vercel.app`.

(Netlify works the same way if you'd rather use that — same env vars, build command `npm run build`, publish directory `dist`.)

---

## Part 4 — Admin console (see all users' data)

By default every user only ever sees their own habits — that's enforced by the database. If you (the app owner) also want a screen that shows *every* user and *every* habit, follow these steps. This is not a separate login — it's a flag on your existing account.

1. In Supabase's **SQL Editor**, open a new query, paste in the contents of **`admin-setup.sql`**, and click **Run**.
2. Go to **Table Editor → profiles** in the Supabase sidebar.
3. Find the row matching your own email, click the `is_admin` cell, and set it to `true`. Save.
4. In the app, log out and log back in. You'll now see an **Admin console** link next to the theme toggle, showing every user, their habits, streaks, and check-in counts — with the ability to delete any habit for moderation.

Do **not** build a way to grant `is_admin` from inside the app itself — only ever set it by hand, directly in Supabase's Table Editor, one trusted person at a time. And never expose your Supabase **service_role** key anywhere in the frontend code or `.env` file that gets deployed — the app never needs it; the `anon` key plus these RLS policies is what gives your admin account its extra visibility.

---

## Part 5 — Rest days & partial completion

By default every habit is tracked every day, and a check-off is all-or-nothing. This adds two things:

- **Rest days** — mark specific weekdays as intentionally skipped for a habit (e.g. no gym on Sunday). Rest days don't break streaks and aren't counted against your weekly/monthly %.
- **Partial credit** — tapping a habit now cycles ✓ Completed → ◐ Partial → cleared, instead of just on/off. Partial days count as half credit toward weekly/monthly progress.

**Setup:**

1. In Supabase's SQL Editor, run **`rest-days-setup.sql`**.
2. That's it — no manual data changes needed. Existing habits default to zero rest days (tracked every day, same as before), and existing check-offs default to `'completed'` status.

**Using it in the app:**

- On any habit card, click **🌙 Rest days** to pick which weekdays that habit skips.
- Tap a habit's circle once for Completed, again for Partial, again to clear it.
- The dashboard's stats bar (This Week / This Month / Best Habit / Needs Focus) automatically factors in rest days and partial credit.

---

## How the data isolation works

You don't need to trust the app's code to keep users' habits separate — the database enforces it. Every table has **Row Level Security (RLS)** enabled, and every policy is built around one rule:

```sql
using (auth.uid() = user_id)
```

`auth.uid()` is the ID of whoever is currently logged in, taken from their auth token. Postgres checks this on every single query — so even if there were a bug in the React code, a logged-in user physically cannot read or write another user's rows. This is the same approach Supabase recommends for any multi-tenant app.

---

## Project structure

```
habit-tracker/
├── supabase-setup.sql       ← run this in Supabase's SQL Editor
├── .env.example             ← copy to .env and fill in your keys
├── index.html
├── package.json
├── tailwind.config.js
├── src/
│   ├── main.jsx
│   ├── App.jsx               ← routes between login screen and dashboard
│   ├── index.css
│   ├── lib/
│   │   ├── supabaseClient.js
│   │   └── dates.js          ← streak calculation logic
│   ├── hooks/
│   │   └── useAuth.js        ← tracks the logged-in user
│   └── components/
│       ├── AuthForm.jsx
│       ├── Dashboard.jsx     ← fetches habits/logs, add/delete/check-off
│       ├── HabitCard.jsx     ← the 7-day dot streak visual
│       ├── AddHabitModal.jsx
│       └── ThemeToggle.jsx
```

## Common issues

- **Blank page / console error about "Missing Supabase environment variables"** — your `.env` file is missing or the dev server was started before you saved it. Stop the server (Ctrl+C) and run `npm run dev` again.
- **Sign up succeeds but login fails with "Email not confirmed"** — see the "turn off email confirmation" step above, or check the inbox you signed up with for the confirmation link.
- **Habits don't show up for a user** — double check you ran the full `supabase-setup.sql` script in the SQL Editor without errors.
