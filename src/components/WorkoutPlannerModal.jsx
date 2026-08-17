import { useMemo, useState } from 'react'
import { starterWorkoutPlan, WORKOUT_DAYS } from '../lib/workout'

function uid() { return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}` }
function normalizePlan(plan, habits) {
  if (!plan) {
    const starter = starterWorkoutPlan()
    const gymHabit = habits.find((habit) => habit.name.toLowerCase().trim() === 'gym')
    starter.linked_habit_id = gymHabit?.id ?? null
    return starter
  }
  return {
    ...plan,
    workout_days: WORKOUT_DAYS.map(({ value, label }) => {
      const existing = (plan.workout_days ?? []).find((day) => day.day_of_week === value)
      return existing ?? { day_of_week: value, name: label, focus: '', is_rest: false, workout_exercises: [] }
    }).map((day) => ({ ...day, workout_exercises: [...(day.workout_exercises ?? [])].sort((a, b) => (a.exercise_order ?? 0) - (b.exercise_order ?? 0)) })),
  }
}

export default function WorkoutPlannerModal({ plan, habits, onClose, onSave, error: externalError }) {
  const [draft, setDraft] = useState(() => normalizePlan(plan, habits))
  const [selectedDay, setSelectedDay] = useState(WORKOUT_DAYS[0].value)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(externalError || '')
  const currentDay = draft.workout_days.find((day) => day.day_of_week === selectedDay)

  const dayLabel = useMemo(() => WORKOUT_DAYS.find((day) => day.value === selectedDay)?.label ?? 'Workout day', [selectedDay])

  function updateDay(patch) {
    setDraft((prev) => ({ ...prev, workout_days: prev.workout_days.map((day) => day.day_of_week === selectedDay ? { ...day, ...patch } : day) }))
  }

  function addExercise() {
    const exercises = currentDay?.workout_exercises ?? []
    updateDay({ workout_exercises: [...exercises, { id: uid(), exercise_name: 'New exercise', target_sets: 3, target_rep_min: 8, target_rep_max: 12, exercise_order: exercises.length, is_active: true }] })
  }

  function updateExercise(index, patch) {
    const exercises = currentDay.workout_exercises.map((exercise, i) => i === index ? { ...exercise, ...patch } : exercise)
    updateDay({ workout_exercises: exercises })
  }

  function removeExercise(index) {
    const exercises = currentDay.workout_exercises.map((exercise, i) => i === index ? { ...exercise, is_active: false } : exercise).filter((exercise) => exercise.id && String(exercise.id).startsWith('local-') ? false : true)
    updateDay({ workout_exercises: exercises.map((exercise, i) => ({ ...exercise, exercise_order: i })) })
  }

  function applyStarter() {
    const starter = starterWorkoutPlan()
    const linked = draft.linked_habit_id
    setDraft({ ...starter, ...plan, linked_habit_id: linked ?? starter.linked_habit_id, workout_days: starter.workout_days })
    setSelectedDay(1)
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      await onSave({ ...draft, workout_days: draft.workout_days.map((day) => ({ ...day, workout_exercises: day.is_rest ? [] : day.workout_exercises.filter((exercise) => exercise.is_active !== false).map((exercise, index) => ({ ...exercise, exercise_order: index })) })) })
    } catch (saveError) {
      setError(saveError.message || 'Unable to save your workout plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <button aria-label="Close workout planner" className="modal-backdrop-button" onClick={onClose} />
      <div className="relative w-full sm:max-w-6xl max-h-[95vh] overflow-y-auto modal-card animate-pop-in rounded-t-[24px] sm:rounded-[24px]">
        <div className="modal-header sticky top-0 z-20">
          <div><p className="section-kicker">Workout planner</p><h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">Build your weekly routine</h2><p className="text-xs text-moss-400 dark:text-moss-100/45 mt-1">Plan once. Track every set. Let your gym habit reflect the work.</p></div>
          <button onClick={onClose} className="modal-close" aria-label="Close">×</button>
        </div>

        <div className="modal-body workout-planner-layout">
          {error && <div className="error-banner workout-planner-error">{error}</div>}
          <div className="workout-plan-top">
            <label className="field-block"><span>Plan name</span><input className="text-input" value={draft.name || ''} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} maxLength={60} /></label>
            <label className="field-block"><span>Link to your gym habit</span><select className="text-input" value={draft.linked_habit_id ?? ''} onChange={(e) => setDraft((prev) => ({ ...prev, linked_habit_id: e.target.value || null }))}><option value="">Don't link a habit</option>{habits.map((habit) => <option key={habit.id} value={habit.id}>{habit.icon || '🌿'} {habit.name}</option>)}</select></label>
            <button type="button" className="workout-secondary-btn starter-btn" onClick={applyStarter}>Use starter split</button>
          </div>

          <div className="workout-planner-main">
            <div className="workout-day-tabs">
              {WORKOUT_DAYS.map((day) => {
                const item = draft.workout_days.find((d) => d.day_of_week === day.value)
                return <button key={day.value} type="button" className={`workout-day-tab ${selectedDay === day.value ? 'active' : ''} ${item?.is_rest ? 'rest' : ''}`} onClick={() => setSelectedDay(day.value)}><strong>{day.short}</strong><small>{item?.name || 'Plan'}</small></button>
              })}
            </div>

            <section className="workout-editor-panel">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3"><div><p className="section-kicker">{dayLabel}</p><h3 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">{currentDay?.name || 'Workout day'}</h3></div><label className="workout-toggle"><input type="checkbox" checked={Boolean(currentDay?.is_rest)} onChange={(e) => updateDay({ is_rest: e.target.checked })} /><span>{currentDay?.is_rest ? 'Rest day' : 'Workout day'}</span></label></div>

              <div className="workout-editor-fields mt-4">
                <label className="field-block"><span>Day title</span><input className="text-input" value={currentDay?.name || ''} onChange={(e) => updateDay({ name: e.target.value })} placeholder="e.g. Push" /></label>
                <label className="field-block"><span>Focus</span><input className="text-input" value={currentDay?.focus || ''} onChange={(e) => updateDay({ focus: e.target.value })} placeholder="e.g. Chest · shoulders · triceps" /></label>
              </div>

              {!currentDay?.is_rest && (
                <div className="mt-5">
                  <div className="flex items-center justify-between gap-3 mb-3"><div><p className="section-kicker">Exercises</p><p className="text-xs text-moss-400 dark:text-moss-100/45 mt-1">Set the target. You can change what you actually lift during the workout.</p></div><button type="button" className="workout-add-btn" onClick={addExercise}>＋ Add exercise</button></div>
                  <div className="workout-editor-list">
                    {(currentDay?.workout_exercises ?? []).filter((exercise) => exercise.is_active !== false).map((exercise, index) => <div className="workout-editor-row" key={exercise.id || index}>
                      <div className="workout-order-pill">{index + 1}</div>
                      <input className="text-input exercise-name-input" value={exercise.exercise_name} onChange={(e) => updateExercise(index, { exercise_name: e.target.value })} />
                      <label className="mini-field"><span>Sets</span><input className="text-input" type="number" min="1" max="10" value={exercise.target_sets} onChange={(e) => updateExercise(index, { target_sets: Math.max(1, Number(e.target.value) || 1) })} /></label>
                      <label className="mini-field"><span>Min reps</span><input className="text-input" type="number" min="1" max="50" value={exercise.target_rep_min} onChange={(e) => updateExercise(index, { target_rep_min: Math.max(1, Number(e.target.value) || 1) })} /></label>
                      <label className="mini-field"><span>Max reps</span><input className="text-input" type="number" min="1" max="50" value={exercise.target_rep_max} onChange={(e) => updateExercise(index, { target_rep_max: Math.max(1, Number(e.target.value) || 1) })} /></label>
                      <button type="button" className="workout-delete-btn" onClick={() => removeExercise(index)} aria-label={`Remove ${exercise.exercise_name}`}>×</button>
                    </div>)}
                    {!currentDay?.workout_exercises?.filter((exercise) => exercise.is_active !== false).length && <div className="workout-editor-empty">No exercises yet. Add your first exercise or use the starter split.</div>}
                  </div>
                </div>
              )}
            </section>
          </div>

          <div className="workout-planner-footer"><div><strong>{draft.name || 'Workout plan'}</strong><span>7 days · fully customizable</span></div><div className="flex gap-2"><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="workout-primary-btn" onClick={save} disabled={saving || !draft.name?.trim()}>{saving ? 'Saving…' : 'Save workout plan'}</button></div></div>
        </div>
      </div>
    </div>
  )
}
