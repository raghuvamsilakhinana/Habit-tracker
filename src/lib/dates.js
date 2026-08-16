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

// Returns every local date key from start through end, oldest first.
export function dateRangeKeys(startKey, endKey) {
  const keys = []
  const cursor = new Date(`${startKey}T12:00:00`)
  const end = new Date(`${endKey}T12:00:00`)

  while (cursor <= end) {
    keys.push(toDateKey(cursor))
    cursor.setDate(cursor.getDate() + 1)
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

// The state of a day across ALL habits at once: 'rest' (every habit was resting),
// 'perfect' (every non-rest habit was Completed), or 'broken'.
export function getOverallDayState(habits, logsByHabit, dateKey) {
  let hasTrackedHabit = false
  for (const habit of habits) {
    const statusMap = logsByHabit[habit.id] ?? new Map()
    const state = getDayState(habit, statusMap, dateKey)

    if (state === 'rest') continue

    hasTrackedHabit = true

    // Partial counts as a miss for the "perfect day" streak specifically.
    if (state !== 'completed') return 'broken'
  }

  return hasTrackedHabit ? 'perfect' : 'rest'
}

// A generous but finite bound so a pathological setup (e.g. every habit resting
// every day of the week) can't ever loop forever.
const MAX_STREAK_LOOKBACK_DAYS = 3650 // ~10 years

// Current consecutive run of perfect days, ending today. Rest days pass through,
// today isn't required yet, and anything else breaks it.
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

// Longest run of perfect days across the full available habit history.
// This is intentionally all-time so a backdated entry can repair or extend an
// older record instead of being ignored because it is more than 30 days old.
export function overallLongestStreak(habits, logsByHabit) {
  if (habits.length === 0) return 0

  const startKey = habits.reduce((earliest, habit) => {
    const createdKey = toDateKey(habit.created_at)
    return !earliest || createdKey < earliest ? createdKey : earliest
  }, null)

  const keys = dateRangeKeys(startKey, todayKey())
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

// Longest streak across the full available history for this habit.
export function longestStreak(habit, statusMap) {
  const startKey = toDateKey(habit.created_at)
  const keys = dateRangeKeys(startKey, todayKey())
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
