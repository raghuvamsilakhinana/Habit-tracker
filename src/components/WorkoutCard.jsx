import { formatWorkoutDate, sessionSetCount, sortExercises, targetLabel } from '../lib/workout'

export default function WorkoutCard({ plan, workoutDay, dateKey, session, sessionSets, available, onOpenPlan, onCustomizePlan, onStart, onHistory, expanded = false, onToggleExpanded }) {
  if (!available) {
    return (
      <section className="workout-card workout-empty animate-fade-in mb-5">
        <div className="workout-card-glow" />
        <div className="relative p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="min-w-0">
            <div className="workout-kicker"><span>🏋️</span> Gym routine</div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-moss-900 dark:text-parchment mt-1.5">Give your gym days a plan.</h2>
            <p className="text-xs text-moss-500 dark:text-moss-100/55 mt-1.5 max-w-xl">Set a weekly routine, record every set, and keep your gym habit connected to the work you actually did.</p>
          </div>
          <button type="button" className="workout-primary-btn" onClick={onOpenPlan}>Set up routine <span>→</span></button>
        </div>
      </section>
    )
  }

  if (!plan || !workoutDay) {
    return (
      <section className="workout-card workout-empty animate-fade-in mb-5">
        <div className="workout-card-glow" />
        <div className="relative p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div><div className="workout-kicker"><span>🏋️</span> Gym routine</div><h2 className="font-display text-xl sm:text-2xl font-semibold text-moss-900 dark:text-parchment mt-1.5">Your routine is waiting.</h2><p className="text-xs text-moss-500 dark:text-moss-100/55 mt-1.5">Plan your week once, then just follow today's workout.</p></div>
          <div className="flex flex-wrap gap-2"><button className="workout-primary-btn" onClick={onOpenPlan}>Build my routine <span>→</span></button><button className="workout-secondary-btn" onClick={onHistory}>History</button></div>
        </div>
      </section>
    )
  }

  const exercises = sortExercises(workoutDay.workout_exercises)
  if (workoutDay.is_rest) {
    return (
      <section className="workout-card animate-fade-in mb-5">
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div><div className="workout-kicker"><span>🌿</span> Today's workout</div><h2 className="font-display text-xl sm:text-2xl font-semibold text-moss-900 dark:text-parchment mt-1.5">{workoutDay.name || 'Recovery day'}</h2><p className="text-xs text-moss-500 dark:text-moss-100/55 mt-1">{workoutDay.focus || 'Take the day to recover and reset.'}</p></div>
            <div className="flex gap-2"><button className="workout-secondary-btn" onClick={onOpenPlan}>Change routine</button><button className="workout-secondary-btn" onClick={onCustomizePlan}>Customize</button><button className="workout-secondary-btn" onClick={onHistory}>History</button></div>
          </div>
          <div className="workout-rest-banner mt-4"><span>🌙</span><div><strong>No workout is scheduled today.</strong><p>Recovery is part of the routine. Come back tomorrow.</p></div></div>
        </div>
      </section>
    )
  }
  if (!exercises.length) {
    return (
      <section className="workout-card animate-fade-in mb-5">
        <div className="relative p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div><div className="workout-kicker"><span>🏋️</span> Today's workout</div><h2 className="font-display text-xl sm:text-2xl font-semibold text-moss-900 dark:text-parchment mt-1.5">{workoutDay.name || 'Workout day'}</h2><p className="text-xs text-moss-500 dark:text-moss-100/55 mt-1">No exercises are set for today yet.</p></div>
            <div className="flex gap-2"><button className="workout-primary-btn" onClick={onOpenPlan}>Build my routine <span>→</span></button><button className="workout-secondary-btn" onClick={onHistory}>History</button></div>
          </div>
        </div>
      </section>
    )
  }

  const exerciseIds = exercises.map((exercise) => exercise.id)
  const completedSets = sessionSetCount(sessionSets, exerciseIds)
  const plannedSets = exercises.reduce((sum, exercise) => sum + (exercise.target_sets || 0), 0)
  const progress = plannedSets ? Math.min(100, Math.round((completedSets / plannedSets) * 100)) : 0
  const isComplete = Boolean(session?.completed_at)

  return (
    <section className={`workout-card workout-collapsible animate-fade-in mb-5 ${expanded ? 'is-expanded' : 'is-collapsed'}`}>
      <button type="button" className="workout-collapsed-summary" onClick={onToggleExpanded} aria-expanded={expanded}>
        <span className="workout-collapsed-icon">🏋️</span>
        <span className="workout-collapsed-copy">
          <span className="workout-kicker">Today's workout · {formatWorkoutDate(dateKey, { year: undefined })}</span>
          <span className="workout-collapsed-title">{workoutDay.name}</span>
          <span className="workout-collapsed-meta">{workoutDay.focus || 'Chest · shoulders · triceps'} · {completedSets}/{plannedSets} sets</span>
        </span>
        <span className="workout-collapsed-progress"><strong>{progress}%</strong><span><i style={{ width: `${progress}%` }} /></span></span>
        <span className="workout-collapse-chevron" aria-hidden="true">{expanded ? '⌃' : '⌄'}</span>
      </button>

      <div className="workout-expanded-content">
        <div className="relative p-5 sm:p-6 pt-2">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mt-1.5"><h2 className="font-display text-xl sm:text-2xl font-semibold text-moss-900 dark:text-parchment">{workoutDay.name}</h2>{isComplete && <span className="workout-status done">Completed</span>}</div>
              <p className="text-xs text-moss-500 dark:text-moss-100/55 mt-1">{workoutDay.focus || 'Follow the plan and record what you actually lift.'}</p>
            </div>
            <div className="flex flex-wrap gap-2"><button className="workout-primary-btn" onClick={(event) => { event.stopPropagation(); onStart() }}>{session ? (isComplete ? 'Review workout' : 'Resume workout') : 'Start workout'} <span>→</span></button><button className="workout-secondary-btn" onClick={(event) => { event.stopPropagation(); onOpenPlan() }}>Change routine</button><button className="workout-secondary-btn" onClick={(event) => { event.stopPropagation(); onCustomizePlan() }}>Customize</button><button className="workout-secondary-btn" onClick={(event) => { event.stopPropagation(); onHistory() }}>History</button></div>
          </div>

          <div className="workout-progress-head mt-5"><div><strong>{completedSets} / {plannedSets} sets logged</strong><span>{progress}% workout progress</span></div><strong>{progress}%</strong></div>
          <div className="workout-progress-track"><div style={{ width: `${progress}%` }} /></div>

          <div className="workout-exercise-preview mt-4">
            {exercises.slice(0, 5).map((exercise) => <div key={exercise.id} className="workout-exercise-chip"><span>{exercise.exercise_name}</span><small>{targetLabel(exercise)}</small></div>)}
            {exercises.length > 5 && <div className="workout-exercise-chip more"><span>+{exercises.length - 5} more</span><small>in this workout</small></div>}
          </div>
        </div>
      </div>
    </section>
  )
}
