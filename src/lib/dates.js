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
