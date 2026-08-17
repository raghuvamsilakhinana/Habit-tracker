export const WORKOUT_DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
  { value: 0, label: 'Sunday', short: 'Sun' },
]

export function dateDayOfWeek(dateKey) {
  return new Date(`${dateKey}T12:00:00`).getDay()
}

export function getWorkoutDayForDate(plan, dateKey) {
  if (!plan?.workout_days) return null
  return plan.workout_days.find((day) => day.day_of_week === dateDayOfWeek(dateKey)) ?? null
}

export function sortExercises(exercises = []) {
  return [...exercises].filter((exercise) => exercise.is_active !== false).sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0))
}

export function formatWorkoutDate(dateKey, options = {}) {
  if (!dateKey) return ''
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options,
  })
}

export function targetLabel(exercise) {
  const sets = exercise?.target_sets ?? 0
  const min = exercise?.target_rep_min ?? 0
  const max = exercise?.target_rep_max ?? min
  return `${sets} × ${min}${max !== min ? `–${max}` : ''}`
}

const EXERCISES = {
  chest: {
    main: { name: 'Bench Press', sets: 3, min: 6, max: 10 },
    alt: { name: 'Incline Dumbbell Press', sets: 3, min: 8, max: 12 },
    accessory: { name: 'Cable Fly', sets: 2, min: 10, max: 15 },
  },
  shoulders: {
    main: { name: 'Shoulder Press', sets: 3, min: 8, max: 10 },
    accessory: { name: 'Lateral Raise', sets: 3, min: 12, max: 15 },
    rear: { name: 'Rear Delt Fly', sets: 2, min: 12, max: 15 },
  },
  triceps: {
    main: { name: 'Triceps Pushdown', sets: 3, min: 10, max: 15 },
    accessory: { name: 'Overhead Triceps Extension', sets: 2, min: 10, max: 15 },
  },
  back: {
    vertical: { name: 'Lat Pulldown', sets: 3, min: 8, max: 12 },
    horizontal: { name: 'Seated Cable Row', sets: 3, min: 8, max: 12 },
    heavy: { name: 'Chest Supported Row', sets: 3, min: 8, max: 10 },
    accessory: { name: 'Face Pull', sets: 2, min: 12, max: 15 },
  },
  biceps: {
    main: { name: 'Dumbbell Curl', sets: 3, min: 10, max: 12 },
    accessory: { name: 'Hammer Curl', sets: 2, min: 10, max: 15 },
  },
  quads: {
    squat: { name: 'Squat', sets: 3, min: 6, max: 10 },
    press: { name: 'Leg Press', sets: 3, min: 10, max: 12 },
    accessory: { name: 'Leg Extension', sets: 2, min: 12, max: 15 },
  },
  hamstrings: {
    hinge: { name: 'Romanian Deadlift', sets: 3, min: 8, max: 10 },
    curl: { name: 'Leg Curl', sets: 3, min: 10, max: 15 },
  },
  calves: { main: { name: 'Calf Raise', sets: 3, min: 12, max: 15 } },
}

function cloneExercise(item, intensity = 'medium', accessory = false) {
  const multiplier = intensity === 'high' ? 1.15 : intensity === 'low' ? 0.75 : 1
  const sets = Math.max(1, Math.round(item.sets * multiplier))
  const max = intensity === 'low' ? Math.min(item.max, item.min + 2) : item.max
  return { exercise_name: item.name, target_sets: sets, target_rep_min: item.min, target_rep_max: max, exercise_order: 0, is_active: true, role: accessory ? 'accessory' : 'main' }
}

function workoutDay(name, focus, items) {
  return { day_of_week: null, name, focus, is_rest: false, workout_exercises: items.map((item, index) => ({ ...item, exercise_order: index })) }
}

function fullBodyDay(variant, intensity) {
  const sets = []
  if (variant === 'A') {
    sets.push(cloneExercise(EXERCISES.quads.squat, intensity))
    sets.push(cloneExercise(EXERCISES.chest.main, intensity))
    sets.push(cloneExercise(EXERCISES.back.vertical, intensity))
    sets.push(cloneExercise(EXERCISES.shoulders.accessory, intensity, true))
    sets.push(cloneExercise(EXERCISES.biceps.main, intensity, true))
    sets.push(cloneExercise(EXERCISES.hamstrings.curl, intensity, true))
    return workoutDay('Full Body A', 'Quads · chest · back · shoulders · arms', sets)
  }
  if (variant === 'B') {
    sets.push(cloneExercise(EXERCISES.hamstrings.hinge, intensity))
    sets.push(cloneExercise(EXERCISES.chest.alt, intensity))
    sets.push(cloneExercise(EXERCISES.back.horizontal, intensity))
    sets.push(cloneExercise(EXERCISES.quads.press, intensity, true))
    sets.push(cloneExercise(EXERCISES.triceps.main, intensity, true))
    sets.push(cloneExercise(EXERCISES.shoulders.rear, intensity, true))
    return workoutDay('Full Body B', 'Hamstrings · incline chest · back · legs · arms', sets)
  }
  sets.push(cloneExercise(EXERCISES.quads.press, intensity))
  sets.push(cloneExercise(EXERCISES.shoulders.main, intensity))
  sets.push(cloneExercise(EXERCISES.back.heavy, intensity))
  sets.push(cloneExercise(EXERCISES.chest.accessory, intensity, true))
  sets.push(cloneExercise(EXERCISES.biceps.accessory, intensity, true))
  sets.push(cloneExercise(EXERCISES.hamstrings.curl, intensity, true))
  return workoutDay('Full Body C', 'Legs · shoulders · back · chest · arms', sets)
}

function pushDay(intensity, label = 'Push') {
  return workoutDay(label, 'Chest · shoulders · triceps', [
    cloneExercise(EXERCISES.chest.main, intensity),
    cloneExercise(EXERCISES.chest.alt, intensity),
    cloneExercise(EXERCISES.shoulders.main, intensity),
    cloneExercise(EXERCISES.shoulders.accessory, intensity, true),
    cloneExercise(EXERCISES.triceps.main, intensity, true),
  ])
}

function pullDay(intensity, label = 'Pull') {
  return workoutDay(label, 'Back · biceps · rear delts', [
    cloneExercise(EXERCISES.back.vertical, intensity),
    cloneExercise(EXERCISES.back.horizontal, intensity),
    cloneExercise(EXERCISES.back.accessory, intensity, true),
    cloneExercise(EXERCISES.biceps.main, intensity, true),
    cloneExercise(EXERCISES.biceps.accessory, intensity, true),
  ])
}

function legsDay(intensity, label = 'Legs') {
  return workoutDay(label, 'Quads · hamstrings · glutes · calves', [
    cloneExercise(EXERCISES.quads.squat, intensity),
    cloneExercise(EXERCISES.hamstrings.hinge, intensity),
    cloneExercise(EXERCISES.quads.press, intensity),
    cloneExercise(EXERCISES.hamstrings.curl, intensity, true),
    cloneExercise(EXERCISES.quads.accessory, intensity, true),
    cloneExercise(EXERCISES.calves.main, intensity, true),
  ])
}

function upperDay(intensity, label = 'Upper') {
  return workoutDay(label, 'Chest · back · shoulders · arms', [
    cloneExercise(EXERCISES.chest.alt, intensity),
    cloneExercise(EXERCISES.back.horizontal, intensity),
    cloneExercise(EXERCISES.shoulders.main, intensity),
    cloneExercise(EXERCISES.back.vertical, intensity, true),
    cloneExercise(EXERCISES.biceps.main, intensity, true),
    cloneExercise(EXERCISES.triceps.main, intensity, true),
  ])
}

function restDay() {
  return { day_of_week: null, name: 'Rest', focus: 'Recovery and reset', is_rest: true, workout_exercises: [] }
}

function assignDays(workouts, dayNumbers) {
  const map = new Map(dayNumbers.map((value, index) => [index, value]))
  const days = WORKOUT_DAYS.map((day) => ({ ...restDay(), day_of_week: day.value, name: 'Rest', focus: 'Recovery and reset' }))
  workouts.forEach((workout, index) => {
    const dayOfWeek = map.get(index)
    const target = days.find((day) => day.day_of_week === dayOfWeek)
    Object.assign(target, workout, { day_of_week: dayOfWeek })
  })
  return days
}

export function generateWorkoutPlan({ daysPerWeek = 3, intensity = 'medium', linkedHabitId = null } = {}) {
  const days = Number(daysPerWeek)
  const safeIntensity = ['low', 'medium', 'high'].includes(intensity) ? intensity : 'medium'
  let workouts = []
  let activeDayNumbers = []
  let planName = ''

  if (days === 2) {
    activeDayNumbers = [1, 4]
    workouts = [fullBodyDay('A', safeIntensity), fullBodyDay('B', safeIntensity)]
    planName = `2-Day Full Body · ${titleCase(safeIntensity)}`
  } else if (days === 3) {
    activeDayNumbers = [1, 3, 5]
    workouts = [fullBodyDay('A', safeIntensity), fullBodyDay('B', safeIntensity), fullBodyDay('C', safeIntensity)]
    planName = `3-Day Full Body · ${titleCase(safeIntensity)}`
  } else if (days === 4) {
    activeDayNumbers = [1, 2, 4, 5]
    workouts = [upperDay(safeIntensity, 'Upper A'), legsDay(safeIntensity, 'Lower A'), upperDay(safeIntensity, 'Upper B'), legsDay(safeIntensity, 'Lower B')]
    planName = `4-Day Upper / Lower · ${titleCase(safeIntensity)}`
  } else if (days === 5) {
    activeDayNumbers = [1, 2, 3, 4, 5]
    workouts = [pushDay(safeIntensity), pullDay(safeIntensity), legsDay(safeIntensity), upperDay(safeIntensity), workoutDay('Lower', 'Quads · hamstrings · glutes · calves', [cloneExercise(EXERCISES.quads.press, safeIntensity), cloneExercise(EXERCISES.hamstrings.hinge, safeIntensity), cloneExercise(EXERCISES.quads.accessory, safeIntensity, true), cloneExercise(EXERCISES.hamstrings.curl, safeIntensity, true), cloneExercise(EXERCISES.calves.main, safeIntensity, true)])]
    planName = `5-Day Split · ${titleCase(safeIntensity)}`
  } else {
    activeDayNumbers = [1, 2, 3, 4, 5, 6]
    workouts = [pushDay(safeIntensity, 'Push A'), pullDay(safeIntensity, 'Pull A'), legsDay(safeIntensity, 'Legs A'), pushDay(safeIntensity, 'Push B'), pullDay(safeIntensity, 'Pull B'), legsDay(safeIntensity, 'Legs B')]
    planName = `6-Day Push / Pull / Legs · ${titleCase(safeIntensity)}`
  }

  return {
    name: planName,
    linked_habit_id: linkedHabitId || null,
    days_per_week: days,
    intensity: safeIntensity,
    generator_days_per_week: days,
    generator_intensity: safeIntensity,
    workout_days: assignDays(workouts, activeDayNumbers),
  }
}

export function intensityMeta(intensity) {
  const map = {
    low: { label: 'Low', tone: 'calm', description: 'Lower volume, simpler sessions and more room for recovery.' },
    medium: { label: 'Medium', tone: 'balanced', description: 'Balanced volume for a sustainable weekly routine.' },
    high: { label: 'High', tone: 'driven', description: 'Higher training volume for days when you want more work.' },
  }
  return map[intensity] ?? map.medium
}

function titleCase(value) {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

export function starterWorkoutPlan() {
  return generateWorkoutPlan({ daysPerWeek: 3, intensity: 'medium' })
}

export function sessionSetCount(sessionSets = [], exerciseIds = []) {
  const ids = new Set(exerciseIds)
  return sessionSets.filter((set) => ids.has(set.exercise_id) && set.completed !== false && Number(set.reps) > 0).length
}

export function sessionVolume(sessionSets = []) {
  return sessionSets.reduce((sum, set) => {
    if (set.completed === false) return sum
    const weight = Number(set.weight_kg) || 0
    const reps = Number(set.reps) || 0
    return sum + weight * reps
  }, 0)
}

export function formatVolume(value) {
  if (!Number.isFinite(value) || value <= 0) return '—'
  return value >= 1000 ? `${(value / 1000).toFixed(1)}k kg` : `${Math.round(value)} kg`
}

export function getLatestSetByExercise(sessions, sets, exerciseId, beforeDate = null) {
  const eligible = sessions
    .filter((session) => !beforeDate || session.workout_date < beforeDate)
    .sort((a, b) => b.workout_date.localeCompare(a.workout_date))
  for (const session of eligible) {
    const sessionSets = sets.filter((set) => set.session_id === session.id && set.exercise_id === exerciseId && set.completed !== false && Number(set.reps) > 0)
    if (sessionSets.length) return sessionSets[sessionSets.length - 1]
  }
  return null
}

export function bestExerciseStats(sessions, sets, exerciseId) {
  const exerciseSets = sets.filter((set) => set.exercise_id === exerciseId && set.completed !== false && Number(set.reps) > 0)
  if (!exerciseSets.length) return { maxWeight: 0, maxVolume: 0, bestReps: 0, date: null }
  let maxWeight = 0
  let maxVolume = 0
  let bestReps = 0
  let bestSet = null
  for (const set of exerciseSets) {
    const weight = Number(set.weight_kg) || 0
    const reps = Number(set.reps) || 0
    const volume = weight * reps
    const session = sessions.find((item) => item.id === set.session_id)
    if (weight > maxWeight || (weight === maxWeight && reps > bestReps)) {
      maxWeight = weight
      bestReps = reps
      bestSet = session
    }
    if (volume > maxVolume) maxVolume = volume
  }
  return { maxWeight, maxVolume, bestReps, date: bestSet?.workout_date ?? null }
}
