// All dates are handled as local-time YYYY-MM-DD strings so that "today"
// matches what the user sees on their own clock, not UTC.
export function toDateKey(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function todayKey() {
  return toDateKey(new Date())
}

// Returns an array of the last `count` date keys, oldest first, ending today.
export function lastNDateKeys(count) {
  const keys = []
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    keys.push(toDateKey(d))
  }
  return keys
}

// Is this date one of the habit's intentional rest days (e.g. no gym on Sundays)?
// habit.rest_days is an array of weekday numbers, 0 = Sunday .. 6 = Saturday,
// matching both JS Date.getDay() and Postgres extract(dow).
export function isRestDay(habit, dateKey) {
  const restDays = habit?.rest_days ?? []
  if (restDays.length === 0) return false
  return restDays.includes(new Date(dateKey).getDay())
}

// The state of a single day for a single habit: 'rest' | 'completed' | 'partial' | 'missed'.
// statusMap is a Map of dateKey -> 'completed' | 'partial' for that habit.
export function getDayState(habit, statusMap, dateKey) {
  if (isRestDay(habit, dateKey)) return 'rest'
  const status = statusMap?.get(dateKey)
  if (status === 'completed' || status === 'partial') return status
  return 'missed'
}

// Current consecutive-day streak ending today. Rest days are skipped over
// (they don't break the streak, but don't extend it either). 'partial' and
// 'missed' days break it. If today isn't done yet, we look from yesterday
// so the streak doesn't reset to zero the instant the clock passes midnight.
// The state of a day across ALL habits at once: 'rest' (every habit was
// resting), 'perfect' (every non-rest habit was Completed), or 'broken'
// (at least one non-rest habit was Partial or Missed). Used for the
// overall "perfect day" streak, distinct from each habit's own streak.
export function getOverallDayState(habits, logsByHabit, dateKey) {
  let hasTrackedHabit = false

  for (const habit of habits) {
    const statusMap = logsByHabit[habit.id] ?? new Map()
    const state = getDayState(habit, statusMap, dateKey)

    if (state === 'rest') continue

    hasTrackedHabit = true

    // Partial counts as a miss for the "perfect day" streak specifically —
    // it's meant to be strict: everything done, fully, or the streak breaks.
    if (state !== 'completed') return 'broken'
  }

  return hasTrackedHabit ? 'perfect' : 'rest'
}

// A generous but finite bound so a pathological setup (e.g. every habit
// resting every day of the week) can't ever loop forever.
const MAX_STREAK_LOOKBACK_DAYS = 3650 // ~10 years

// Current consecutive run of perfect days, ending today. Same rules as a
// single habit's streak: rest days pass through, today isn't required
// yet (checked from yesterday if today isn't done), anything else breaks it.
export function overallCurrentStreak(habits, logsByHabit) {
  if (habits.length === 0) return 0

  let streak = 0
  const cursor = new Date()
  const today = todayKey()
  const todayState = getOverallDayState(habits, logsByHabit, today)

  if (todayState !== 'perfect' && todayState !== 'rest') {
    cursor.setDate(cursor.getDate() - 1)
  }

  for (let i = 0; i < MAX_STREAK_LOOKBACK_DAYS; i++) {
    const key = toDateKey(cursor)
    const state = getOverallDayState(habits, logsByHabit, key)

    if (state === 'rest') {
      cursor.setDate(cursor.getDate() - 1)
      continue
    }

    if (state === 'perfect') {
      streak++
      cursor.setDate(cursor.getDate() - 1)
      continue
    }

    break
  }

  return streak
}

// Longest run of perfect days within the last `days` days (default 30).
export function overallLongestStreak(habits, logsByHabit, days = 30) {
  if (habits.length === 0) return 0

  const keys = lastNDateKeys(days)
  let longest = 0
  let current = 0

  for (const key of keys) {
    const state = getOverallDayState(habits, logsByHabit, key)

    if (state === 'rest') continue

    if (state === 'perfect') {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }

  return longest
}

export function currentStreak(habit, statusMap) {
  let streak = 0
  const cursor = new Date()

  const today = todayKey()
  const todayState = getDayState(habit, statusMap, today)

  if (todayState !== 'completed' && todayState !== 'rest') {
    cursor.setDate(cursor.getDate() - 1)
  }

  // Bounded naturally: once we reach a day before the habit had any logs,
  // that day's state is 'missed' (no rest day, no log), which breaks the loop.
  while (true) {
    const key = toDateKey(cursor)
    const state = getDayState(habit, statusMap, key)

    if (state === 'rest') {
      cursor.setDate(cursor.getDate() - 1)
      continue
    }

    if (state === 'completed') {
      streak++
      cursor.setDate(cursor.getDate() - 1)
      continue
    }

    break
  }

  return streak
}

// Longest streak within the last `days` days (default 30). Rest days pass
// through without breaking the run; only 'completed' days extend it.
export function longestStreak(habit, statusMap, days = 30) {
  const keys = lastNDateKeys(days)
  let longest = 0
  let current = 0

  for (const key of keys) {
    const state = getDayState(habit, statusMap, key)

    if (state === 'rest') continue

    if (state === 'completed') {
      current++
      longest = Math.max(longest, current)
    } else {
      current = 0
    }
  }

  return longest
}

// % completion over the last `days` days, counting only tracked (non-rest)
// days in the denominator, with partial days worth half credit.
export function completionRate(habit, statusMap, days) {
  const keys = lastNDateKeys(days)
  let trackedDays = 0
  let score = 0

  for (const key of keys) {
    const state = getDayState(habit, statusMap, key)

    if (state === 'rest') continue

    trackedDays++
    if (state === 'completed') score += 1
    else if (state === 'partial') score += 0.5
  }

  // A window that's entirely rest days isn't a failure — treat it as on track.
  if (trackedDays === 0) return 100

  return Math.round((score / trackedDays) * 100)
}