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
export function getBadge(streakDays, tiers) {
  let current = null
  let next = null
  for (const tier of tiers) {
    if (streakDays >= tier.days) current = tier
    else { next = tier; break }
  }
  return { current, next: next ? { ...next, daysRemaining: next.days - streakDays } : null }
}
