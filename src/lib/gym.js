/**
 * Returns true when the user has explicitly created a Gym habit.
 * Keep this check centralized so the Gym module can be conditionally rendered
 * without coupling the rest of Sprout to workout-specific UI.
 */
export function isGymHabit(habit) {
  if (!habit?.name) return false
  const normalized = habit.name.trim().toLowerCase().replace(/\s+/g, ' ')
  return normalized === 'gym' || normalized === 'gym workout'
}

export function findGymHabit(habits = []) {
  return habits.find(isGymHabit) ?? null
}
