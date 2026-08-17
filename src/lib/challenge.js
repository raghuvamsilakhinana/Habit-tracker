import { dateRangeKeys, getDayState, toDateKey, todayKey } from './dates'

export const CHALLENGE_LENGTH_DAYS = 90
export const CHALLENGE_MILESTONES = [7, 14, 30, 45, 60, 75, 90]

export function dateDiffInclusive(startKey, endKey) {
  const start = new Date(`${startKey}T12:00:00`)
  const end = new Date(`${endKey}T12:00:00`)
  return Math.max(0, Math.floor((end - start) / 86400000) + 1)
}

export function challengeEndDate(startKey) {
  const date = new Date(`${startKey}T12:00:00`)
  date.setDate(date.getDate() + CHALLENGE_LENGTH_DAYS - 1)
  return toDateKey(date)
}

export function challengeDayNumber(challenge, dateKey = todayKey()) {
  if (!challenge?.start_date) return 0
  if (dateKey < challenge.start_date) return 0
  return Math.min(CHALLENGE_LENGTH_DAYS, dateDiffInclusive(challenge.start_date, dateKey))
}

export function challengeHabitRate(habits, logsByHabit, selectedHabitIds, dateKey) {
  const selected = habits.filter((habit) => selectedHabitIds.includes(habit.id))
  let tracked = 0
  let score = 0

  for (const habit of selected) {
    const state = getDayState(habit, logsByHabit[habit.id] ?? new Map(), dateKey)
    if (state === 'rest') continue
    tracked++
    if (state === 'completed') score += 1
    else if (state === 'partial') score += 0.5
  }

  return tracked === 0 ? null : Math.round((score / tracked) * 100)
}

export function challengeDayState(habits, logsByHabit, challenge, dateKey) {
  if (dateKey < challenge.start_date) return 'before'
  if (dateKey > challenge.end_date) return 'after'

  const rate = challengeHabitRate(habits, logsByHabit, challenge.selected_habit_ids ?? [], dateKey)
  if (rate === null) return 'rest'
  if (rate >= challenge.target_percent) return 'successful'
  if (rate > 0) return 'partial'
  return 'missed'
}

export function getChallengeSummary(habits, logsByHabit, challenge) {
  if (!challenge) return null

  const today = todayKey()
  const dayNumber = challengeDayNumber(challenge, today)
  const isBeforeStart = today < challenge.start_date
  const isFinished = today > challenge.end_date
  const throughKey = isBeforeStart ? null : (today < challenge.end_date ? today : challenge.end_date)
  const keys = throughKey ? dateRangeKeys(challenge.start_date, throughKey) : []

  let successfulDays = 0
  let partialDays = 0
  let missedDays = 0
  let restDays = 0
  let trackedDays = 0

  for (const key of keys) {
    const state = challengeDayState(habits, logsByHabit, challenge, key)
    if (state === 'successful') successfulDays++
    else if (state === 'partial') partialDays++
    else if (state === 'missed') missedDays++
    else if (state === 'rest') restDays++
    if (state !== 'rest') trackedDays++
  }

  const score = trackedDays ? Math.round((successfulDays / trackedDays) * 100) : 0
  const currentStreak = getChallengeCurrentStreak(habits, logsByHabit, challenge)
  const bestStreak = getChallengeBestStreak(habits, logsByHabit, challenge)
  const nextMilestone = CHALLENGE_MILESTONES.find((milestone) => milestone > dayNumber) ?? null
  const milestoneProgress = nextMilestone
    ? Math.min(100, Math.round((dayNumber / nextMilestone) * 100))
    : 100

  return {
    dayNumber,
    daysRemaining: Math.max(0, CHALLENGE_LENGTH_DAYS - dayNumber),
    progressPercent: Math.round((dayNumber / CHALLENGE_LENGTH_DAYS) * 100),
    successfulDays,
    partialDays,
    missedDays,
    restDays,
    trackedDays,
    score,
    currentStreak,
    bestStreak,
    nextMilestone,
    milestoneProgress,
    isBeforeStart,
    isFinished,
  }
}

export function getChallengeCurrentStreak(habits, logsByHabit, challenge) {
  const today = todayKey()
  if (today < challenge.start_date) return 0

  let cursorKey = today <= challenge.end_date ? today : challenge.end_date
  let state = challengeDayState(habits, logsByHabit, challenge, cursorKey)
  if (state !== 'successful') {
    const cursor = new Date(`${cursorKey}T12:00:00`)
    cursor.setDate(cursor.getDate() - 1)
    cursorKey = toDateKey(cursor)
  }

  let streak = 0
  while (cursorKey >= challenge.start_date) {
    state = challengeDayState(habits, logsByHabit, challenge, cursorKey)
    if (state === 'rest') {
      const cursor = new Date(`${cursorKey}T12:00:00`)
      cursor.setDate(cursor.getDate() - 1)
      cursorKey = toDateKey(cursor)
      continue
    }
    if (state !== 'successful') break
    streak++
    const cursor = new Date(`${cursorKey}T12:00:00`)
    cursor.setDate(cursor.getDate() - 1)
    cursorKey = toDateKey(cursor)
  }
  return streak
}

export function getChallengeBestStreak(habits, logsByHabit, challenge) {
  if (todayKey() < challenge.start_date) return 0
  const endKey = todayKey() < challenge.end_date ? todayKey() : challenge.end_date
  const keys = dateRangeKeys(challenge.start_date, endKey)
  let best = 0
  let current = 0
  for (const key of keys) {
    const state = challengeDayState(habits, logsByHabit, challenge, key)
    if (state === 'rest') continue
    if (state === 'successful') {
      current++
      best = Math.max(best, current)
    } else {
      current = 0
    }
  }
  return best
}

export function formatChallengeDate(key, options = {}) {
  if (!key) return ''
  return new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  })
}

export function clampChallengeStart(key) {
  const today = todayKey()
  if (!key || key > today) return today
  return key
}
