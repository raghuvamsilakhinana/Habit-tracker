import { useMemo, useState } from 'react'
import { todayKey } from '../lib/dates'
import { bestExerciseStats, formatVolume, formatWorkoutDate, sessionVolume, sortExercises } from '../lib/workout'

export default function WorkoutHistoryModal({ plan, sessions, sets, onClose, onEditSession, onLogPast }) {
  const [expanded, setExpanded] = useState(null)
  const [pastDate, setPastDate] = useState('')
  const exerciseMap = useMemo(() => new Map((plan?.workout_days ?? []).flatMap((day) => (day.workout_exercises ?? []).map((exercise) => [exercise.id, exercise]))), [plan])
  const orderedSessions = useMemo(() => [...sessions].sort((a, b) => b.workout_date.localeCompare(a.workout_date)), [sessions])
  const totalVolume = sessions.reduce((sum, session) => sum + sessionVolume(sets.filter((set) => set.session_id === session.id)), 0)
  const prs = [...exerciseMap.values()].filter((exercise) => exercise.is_active !== false).map((exercise) => ({ exercise, stats: bestExerciseStats(sessions, sets, exercise.id) })).filter((item) => item.stats.maxWeight > 0).sort((a, b) => b.stats.maxWeight - a.stats.maxWeight).slice(0, 6)

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <button aria-label="Close workout history" className="modal-backdrop-button" onClick={onClose} />
      <div className="relative w-full sm:max-w-5xl max-h-[95vh] overflow-y-auto modal-card animate-pop-in rounded-t-[24px] sm:rounded-[24px]">
        <div className="modal-header sticky top-0 z-20"><div><p className="section-kicker">Workout history</p><h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">Your gym work, kept over time.</h2><p className="text-xs text-moss-400 dark:text-moss-100/45 mt-1">Review sessions, volume, and your heaviest recorded sets.</p></div><button onClick={onClose} className="modal-close" aria-label="Close">×</button></div>
        <div className="modal-body space-y-5">
          <div className="workout-history-stats"><div><span>Sessions</span><strong>{sessions.length}</strong></div><div><span>Total volume</span><strong>{formatVolume(totalVolume)}</strong></div><div><span>Completed</span><strong>{sessions.filter((s) => s.completed_at).length}</strong></div></div>

          <section><div className="flex items-end justify-between gap-3 mb-3"><div><p className="section-kicker">Personal bests</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">Your strongest recorded lifts</h3></div></div>{prs.length ? <div className="workout-pr-list">{prs.map(({ exercise, stats }) => <div key={exercise.id} className="workout-pr-card"><span className="workout-pr-icon">🏆</span><div className="min-w-0"><strong>{exercise.exercise_name}</strong><small>{stats.date ? formatWorkoutDate(stats.date, { year: undefined }) : 'No date'}</small></div><div className="ml-auto text-right"><strong>{stats.maxWeight} kg × {stats.bestReps}</strong><small>best load</small></div></div>)}</div> : <div className="workout-history-empty">No personal bests yet. Finish your first workout to start building a history.</div>}</section>

          <section><div className="flex items-end justify-between gap-3 mb-3"><div><p className="section-kicker">Sessions</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">Recent workouts</h3></div><div className="workout-history-logpast"><input className="text-input" type="date" max={todayKey()} value={pastDate} onChange={(e) => setPastDate(e.target.value)} /><button className="workout-secondary-btn" onClick={() => { if (pastDate) onLogPast(pastDate) }} disabled={!pastDate}>Log past workout</button></div></div>
            {orderedSessions.length ? <div className="workout-history-list">{orderedSessions.slice(0, 30).map((session) => {
              const day = plan?.workout_days?.find((item) => item.id === session.workout_day_id)
              const sessionSets = sets.filter((set) => set.session_id === session.id)
              const volume = sessionVolume(sessionSets)
              const isExpanded = expanded === session.id
              return <div key={session.id} className="workout-history-item"><button type="button" className="workout-history-main" onClick={() => setExpanded(isExpanded ? null : session.id)}><span className={`history-status-dot ${session.completed_at ? 'done' : ''}`} /><span className="min-w-0 text-left"><strong>{day?.name || 'Workout'}</strong><small>{formatWorkoutDate(session.workout_date)}</small></span><span className="ml-auto text-right"><strong>{formatVolume(volume)}</strong><small>{sessionSets.filter((set) => set.completed !== false && Number(set.reps) > 0).length} sets</small></span><span className="history-chevron">{isExpanded ? '⌃' : '⌄'}</span></button>{isExpanded && <div className="workout-history-detail"><div className="workout-history-exercises">{sessionSets.reduce((groups, set) => { const list = groups.get(set.exercise_id) ?? []; list.push(set); groups.set(set.exercise_id, list); return groups }, new Map()).size ? [...sessionSets.reduce((groups, set) => { const list = groups.get(set.exercise_id) ?? []; list.push(set); groups.set(set.exercise_id, list); return groups }, new Map()).entries()].map(([exerciseId, exerciseSets]) => <div key={exerciseId}><strong>{exerciseMap.get(exerciseId)?.exercise_name || 'Exercise'}</strong><span>{exerciseSets.sort((a, b) => a.set_number - b.set_number).map((set) => `${set.weight_kg ?? 0}×${set.reps ?? 0}`).join(' · ')}</span></div>) : <p>No sets logged.</p>}</div><div className="mt-3"><button className="secondary-btn" onClick={() => onEditSession(session)}>Edit workout</button></div></div>}</div>
            })}</div> : <div className="workout-history-empty">No workouts logged yet. Start today's session or log a past workout.</div>}
          </section>
        </div>
      </div>
    </div>
  )
}
