import { useEffect, useMemo, useRef, useState } from 'react'
import { getDayState, isRestDay, toDateKey, todayKey } from '../lib/dates'

function statusLabel(status) {
  if (status === 'completed') return 'Completed'
  if (status === 'partial') return 'Partial'
  return 'Not logged'
}

export default function BackdatedEntryModal({ habits, logsByHabit, onClose, onSave }) {
  const today = todayKey()
  const [selectedDate, setSelectedDate] = useState(today)
  const [draft, setDraft] = useState({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dateInputRef = useRef(null)

  useEffect(() => { dateInputRef.current?.showPicker?.() }, [])
  useEffect(() => {
    const next = {}
    for (const habit of habits) next[habit.id] = logsByHabit[habit.id]?.get(selectedDate) ?? null
    setDraft(next)
    setError('')
  }, [selectedDate, habits, logsByHabit])

  const availableHabits = useMemo(() => habits.filter((habit) => selectedDate >= toDateKey(habit.created_at)), [habits, selectedDate])
  const completed = availableHabits.filter((habit) => draft[habit.id] === 'completed').length
  const partial = availableHabits.filter((habit) => draft[habit.id] === 'partial').length

  function setStatus(habitId, status) { setDraft((prev) => ({ ...prev, [habitId]: status })) }
  async function handleSave() {
    setSaving(true); setError('')
    try { await onSave(selectedDate, draft); onClose() }
    catch (err) { setError(err?.message || 'Could not save the backdated entries.') }
    finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <button aria-label="Close backdated entry dialog" className="modal-backdrop-button" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto modal-card animate-pop-in rounded-t-[24px] sm:rounded-[24px]">
        <div className="modal-header sticky top-0 z-10">
          <div><p className="section-kicker">History</p><h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">Edit a past day</h2><p className="text-xs text-moss-400 dark:text-moss-100/45 mt-1">Correct missed entries without changing today's workflow.</p></div>
          <button onClick={onClose} className="modal-close" aria-label="Close">×</button>
        </div>

        <div className="px-5 sm:px-6 pt-5">
          <div className="date-picker-card">
            <div><span className="field-label mb-1">Choose a date</span><p className="text-xs text-moss-400 dark:text-moss-100/45">Today or any earlier day.</p></div>
            <input ref={dateInputRef} type="date" value={selectedDate} max={today} onChange={(e) => setSelectedDate(e.target.value)} className="field-input date-input" />
          </div>
          <div className="flex items-center gap-3 mt-3 text-[10px] font-mono text-moss-400 dark:text-moss-100/45"><span>{availableHabits.length} habits</span><span>•</span><span className="text-moss-800 dark:text-parchment">{completed} completed</span><span>{partial} partial</span></div>
        </div>

        <div className="modal-body space-y-3">
          {availableHabits.length === 0 ? <div className="empty-state py-12">No habits existed on this date.</div> : availableHabits.map((habit) => {
            const rest = isRestDay(habit, selectedDate)
            const current = draft[habit.id] ?? null
            const state = getDayState(habit, logsByHabit[habit.id] ?? new Map(), selectedDate)
            const displayedStatus = current ?? (state === 'rest' ? null : null)
            return (
              <div key={habit.id} className="history-row">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="habit-icon" style={{ backgroundColor: `${habit.color || '#4a5f43'}18` }}>{habit.icon || '🌿'}</span>
                  <div className="min-w-0"><p className="font-medium text-moss-900 dark:text-parchment truncate">{habit.name}</p><p className="text-xs text-moss-400 dark:text-moss-100/45 mt-0.5">{rest ? 'Rest day' : `Current: ${statusLabel(displayedStatus)}`}</p></div>
                </div>
                {rest ? <div className="rest-note">🌙 Intentionally skipped — this will not break the streak.</div> : <div className="history-actions">
                  <button type="button" onClick={() => setStatus(habit.id, 'completed')} className={`status-btn ${current === 'completed' ? 'selected completed' : ''}`}>✓ Completed</button>
                  <button type="button" onClick={() => setStatus(habit.id, 'partial')} className={`status-btn ${current === 'partial' ? 'selected partial' : ''}`}>◐ Partial</button>
                  <button type="button" onClick={() => setStatus(habit.id, null)} className={`status-btn ${current === null ? 'selected clear' : ''}`}>Clear</button>
                </div>}
              </div>
            )
          })}
          {error && <div className="error-banner">{error}</div>}
        </div>

        <div className="modal-footer sticky bottom-0 bg-white/95 dark:bg-moss-900/95 backdrop-blur">
          <button type="button" onClick={onClose} disabled={saving} className="secondary-btn">Cancel</button>
          <button type="button" onClick={handleSave} disabled={saving || availableHabits.length === 0} className="primary-btn">{saving ? 'Saving…' : 'Save changes'}</button>
        </div>
      </div>
    </div>
  )
}
