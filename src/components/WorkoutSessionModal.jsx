import { useMemo, useState } from 'react'
import { formatWorkoutDate, getLatestSetByExercise, sortExercises, targetLabel } from '../lib/workout'
import { todayKey } from '../lib/dates'

function emptyRow(exercise, setNumber, previous) {
  return {
    id: `new-${exercise.id}-${setNumber}`,
    exercise_id: exercise.id,
    set_number: setNumber,
    weight_kg: previous?.weight_kg ?? '',
    reps: previous?.reps ?? '',
    completed: false,
  }
}

export default function WorkoutSessionModal({ day, dateKey, session, existingSets, allSessions, allSets, onClose, onSave, linkedHabitName }) {
  const exercises = useMemo(() => sortExercises(day?.workout_exercises), [day])
  const initialRows = useMemo(() => exercises.flatMap((exercise) => {
    const current = existingSets.filter((set) => set.exercise_id === exercise.id).sort((a, b) => a.set_number - b.set_number)
    if (current.length) return current.map((set) => ({ ...set, weight_kg: set.weight_kg ?? '', reps: set.reps ?? '', completed: set.completed !== false }))
    return Array.from({ length: exercise.target_sets || 1 }, (_, index) => emptyRow(exercise, index + 1, getLatestSetByExercise(allSessions, allSets, exercise.id, dateKey)))
  }), [exercises, existingSets, allSessions, allSets, dateKey])
  const [rows, setRows] = useState(initialRows)
  const [notes, setNotes] = useState(session?.notes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const isPast = dateKey < todayKey()

  function updateRow(id, patch) {
    setRows((prev) => prev.map((row) => row.id === id ? { ...row, ...patch } : row))
  }
  function addSet(exerciseId) {
    setRows((prev) => {
      const current = prev.filter((row) => row.exercise_id === exerciseId)
      const previous = current[current.length - 1]
      return [...prev, emptyRow(exercises.find((exercise) => exercise.id === exerciseId), current.length + 1, previous)]
    })
  }
  function removeSet(id) {
    setRows((prev) => {
      const target = prev.find((row) => row.id === id)
      const filtered = prev.filter((row) => row.id !== id)
      return filtered.map((row) => row.exercise_id === target.exercise_id ? { ...row, set_number: filtered.filter((item) => item.exercise_id === row.exercise_id).indexOf(row) + 1 } : row)
    })
  }
  async function save(finish) {
    setSaving(true)
    setError('')
    try {
      const cleanRows = rows.map((row) => ({ ...row, weight_kg: row.weight_kg === '' ? null : Number(row.weight_kg), reps: row.reps === '' ? null : Number(row.reps), completed: row.reps !== '' && Number(row.reps) > 0 }))
      for (const row of cleanRows) {
        if (row.weight_kg !== null && (Number.isNaN(row.weight_kg) || row.weight_kg < 0)) throw new Error('Weight must be 0 or greater.')
        if (row.reps !== null && (Number.isNaN(row.reps) || row.reps < 1)) throw new Error('Reps must be at least 1.')
      }
      await onSave({ dateKey, dayId: day.id, sessionId: session?.id ?? null, rows: cleanRows, notes, finish })
    } catch (saveError) {
      setError(saveError.message || 'Unable to save the workout.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <button aria-label="Close workout session" className="modal-backdrop-button" onClick={onClose} />
      <div className="relative w-full sm:max-w-4xl max-h-[95vh] overflow-y-auto modal-card animate-pop-in rounded-t-[24px] sm:rounded-[24px]">
        <div className="modal-header sticky top-0 z-20"><div><p className="section-kicker">Workout log</p><h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">{day.name} · {formatWorkoutDate(dateKey)}</h2><p className="text-xs text-moss-400 dark:text-moss-100/45 mt-1">Enter what you actually did. Previous numbers are only suggestions.</p></div><button onClick={onClose} className="modal-close" aria-label="Close">×</button></div>
        <div className="modal-body space-y-5">
          {error && <div className="error-banner">{error}</div>}
          {isPast && <div className="workout-backdated-note">📅 Editing a past workout. Saving a completed workout will also mark {linkedHabitName || 'your linked gym habit'} as completed for this date.</div>}

          {exercises.map((exercise) => {
            const exerciseRows = rows.filter((row) => row.exercise_id === exercise.id).sort((a, b) => a.set_number - b.set_number)
            return <section key={exercise.id} className="workout-session-exercise">
              <div className="flex items-start justify-between gap-3 mb-3"><div><p className="section-kicker">Exercise {exerciseRows.length ? '' : '—'}</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">{exercise.exercise_name}</h3><p className="text-[10px] text-moss-400 dark:text-moss-100/45 mt-1">Target · {targetLabel(exercise)}</p></div><button className="workout-add-small" onClick={() => addSet(exercise.id)}>＋ set</button></div>
              <div className="workout-set-head"><span>Set</span><span>Weight (kg)</span><span>Reps</span><span></span></div>
              <div className="workout-set-list">
                {exerciseRows.map((row) => <div className={`workout-set-row ${row.completed ? 'done' : ''}`} key={row.id}>
                  <span className="set-number">{row.set_number}</span>
                  <input className="text-input workout-number" inputMode="decimal" type="number" min="0" step="0.5" placeholder="0" value={row.weight_kg} onChange={(e) => updateRow(row.id, { weight_kg: e.target.value })} />
                  <input className="text-input workout-number" inputMode="numeric" type="number" min="0" step="1" placeholder="0" value={row.reps} onChange={(e) => updateRow(row.id, { reps: e.target.value, completed: e.target.value !== '' && Number(e.target.value) > 0 })} />
                  <button type="button" className="workout-delete-btn" onClick={() => removeSet(row.id)} aria-label="Remove set">×</button>
                </div>)}
              </div>
            </section>
          })}

          <label className="field-block"><span>Workout notes</span><textarea className="text-input workout-notes" rows="3" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Energy, pain-free form, PR notes, anything worth remembering…" /></label>
          <div className="workout-session-footer"><div><strong>{rows.filter((row) => row.completed).length} sets logged</strong><span>{session?.completed_at ? 'Completed workout · edits are allowed' : 'Save now and finish later'}</span></div><div className="flex flex-wrap gap-2 justify-end"><button className="secondary-btn" onClick={onClose}>Cancel</button><button className="workout-secondary-btn" onClick={() => save(false)} disabled={saving}>{saving ? 'Saving…' : 'Save progress'}</button><button className="workout-primary-btn" onClick={() => save(true)} disabled={saving}>{saving ? 'Saving…' : session?.completed_at ? 'Save completed workout' : 'Finish workout'}</button></div></div>
        </div>
      </div>
    </div>
  )
}
