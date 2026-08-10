// Milestone badges for individual habit streaks — everyday, encouraging words.
export const HABIT_BADGE_TIERS = [
  { days: 3, label: 'Starter', icon: '🌱' },
  { days: 7, label: 'Consistent', icon: '✅' },
  { days: 14, label: 'Steady', icon: '📈' },
  { days: 30, label: 'Committed', icon: '💪' },
  { days: 60, label: 'Dedicated', icon: '🔥' },
  { days: 100, label: 'Unstoppable', icon: '🚀' },
  { days: 200, label: 'Master', icon: '🏅' },
  { days: 365, label: 'Champion', icon: '👑' },
]

// Milestone badges for the overall "perfect day" streak — bigger, more
// dramatic tier since this one means everything was done, every day.
export const PERFECT_DAY_BADGE_TIERS = [
  { days: 3, label: 'Warming Up', icon: '✨' },
  { days: 7, label: 'Achiever', icon: '🎯' },
  { days: 14, label: 'Overachiever', icon: '⚡' },
  { days: 21, label: 'Obsessor', icon: '🔮' },
  { days: 30, label: 'Relentless', icon: '🌋' },
  { days: 60, label: 'Unbreakable', icon: '🛡️' },
  { days: 100, label: 'Legendary', icon: '👑' },
  { days: 365, label: 'Immortal', icon: '♾️' },
]

// Given a streak length and a tier list (sorted ascending by `days`),
// returns the highest badge already earned, and the next one still to reach.
export function getBadge(streakDays, tiers) {
  let current = null
  let next = null

  for (const tier of tiers) {
    if (streakDays >= tier.days) {
      current = tier
    } else {
      next = tier
      break
    }
  }

  return {
    current,
    next: next ? { ...next, daysRemaining: next.days - streakDays } : null,
  }
}
