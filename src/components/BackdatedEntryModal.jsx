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

  useEffect(() => {
    dateInputRef.current?.showPicker?.()
  }, [])

  useEffect(() => {
    const next = {}
    for (const habit of habits) {
      const existing = logsByHabit[habit.id]?.get(selectedDate) ?? null
      next[habit.id] = existing
    }
    setDraft(next)
    setError('')
  }, [selectedDate, habits, logsByHabit])

  const availableHabits = useMemo(() => {
    return habits.filter((habit) => selectedDate >= toDateKey(habit.created_at))
  }, [habits, selectedDate])

  function setStatus(habitId, status) {
    setDraft((prev) => ({ ...prev, [habitId]: status }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    try {
      await onSave(selectedDate, draft)
      onClose()
    } catch (err) {
      setError(err?.message || 'Could not save the backdated entries.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <button
        aria-label="Close backdated entry dialog"
        className="absolute inset-0 bg-moss-950/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-moss-900 shadow-2xl animate-pop-in">
        <div className="p-5 sm:p-6 border-b border-moss-100 dark:border-moss-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment">
                Backdated entry
              </h2>
              <p className="text-sm text-moss-500 dark:text-moss-100/60 mt-1">
                Add or correct your habit data for an earlier date.
              </p>
            </div>
            <button
              onClick={onClose}
              className="h-9 w-9 rounded-full text-moss-400 hover:bg-moss-50 dark:hover:bg-moss-800 hover:text-moss-700 dark:hover:text-parchment transition-colors"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          <label className="block mt-5">
            <span className="block text-xs font-medium uppercase tracking-wide text-moss-500 dark:text-moss-100/50 mb-2">
              Date
            </span>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              max={today}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-xl border border-moss-100 dark:border-moss-700 bg-parchment/70 dark:bg-moss-950 px-4 py-3 text-sm text-moss-900 dark:text-parchment outline-none focus:ring-2 focus:ring-moss-400"
            />
          </label>
        </div>

        <div className="p-5 sm:p-6 space-y-3">
          {availableHabits.length === 0 ? (
            <div className="rounded-xl bg-parchment dark:bg-moss-950 px-4 py-5 text-sm text-moss-500 dark:text-moss-100/60 text-center">
              No habits existed on this date.
            </div>
          ) : (
            availableHabits.map((habit) => {
              const rest = isRestDay(habit, selectedDate)
              const current = draft[habit.id] ?? null
              const state = getDayState(habit, logsByHabit[habit.id] ?? new Map(), selectedDate)
              const displayedStatus = current ?? (state === 'rest' ? null : null)

              return (
                <div
                  key={habit.id}
                  className="rounded-xl border border-moss-100 dark:border-moss-800 bg-parchment/30 dark:bg-moss-950/40 p-4"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${habit.color}22` }}
                    >
                      {habit.icon || '🌿'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-moss-900 dark:text-parchment truncate">
                        {habit.name}
                      </p>
                      <p className="text-xs text-moss-500 dark:text-moss-100/50 mt-0.5">
                        {rest ? 'Rest day' : `Current: ${statusLabel(displayedStatus)}`}
                      </p>
                    </div>
                  </div>

                  {rest ? (
                    <div className="mt-3 rounded-lg bg-moss-100/60 dark:bg-moss-800/50 px-3 py-2 text-xs text-moss-600 dark:text-moss-100/60">
                      This habit is intentionally skipped on this weekday, so it will not break the streak.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <button
                        type="button"
                        onClick={() => setStatus(habit.id, 'completed')}
                        className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                          current === 'completed'
                            ? 'bg-bloom-500 text-white'
                            : 'bg-moss-100/60 dark:bg-moss-800 text-moss-700 dark:text-moss-100/70 hover:bg-moss-100 dark:hover:bg-moss-700'
                        }`}
                      >
                        ✓ Completed
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(habit.id, 'partial')}
                        className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                          current === 'partial'
                            ? 'bg-bloom-400/70 text-moss-950'
                            : 'bg-moss-100/60 dark:bg-moss-800 text-moss-700 dark:text-moss-100/70 hover:bg-moss-100 dark:hover:bg-moss-700'
                        }`}
                      >
                        ◐ Partial
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus(habit.id, null)}
                        className={`rounded-lg px-2 py-2 text-xs font-medium transition-colors ${
                          current === null
                            ? 'bg-moss-600 text-white dark:bg-moss-700'
                            : 'bg-moss-100/60 dark:bg-moss-800 text-moss-700 dark:text-moss-100/70 hover:bg-moss-100 dark:hover:bg-moss-700'
                        }`}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}

          {error && (
            <div className="rounded-lg bg-bloom-500/10 text-bloom-600 dark:text-bloom-400 text-sm px-4 py-3">
              {error}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-5 sm:p-6 border-t border-moss-100 dark:border-moss-800 bg-white/95 dark:bg-moss-900/95 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2.5 rounded-lg text-sm font-medium text-moss-600 dark:text-moss-100/70 hover:bg-moss-50 dark:hover:bg-moss-800 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || availableHabits.length === 0}
            className="px-5 py-2.5 rounded-lg bg-moss-600 hover:bg-moss-700 dark:bg-bloom-500 dark:hover:bg-bloom-400 text-white dark:text-moss-950 text-sm font-semibold transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save backdated entry'}
          </button>
        </div>
      </div>
    </div>
  )
}
