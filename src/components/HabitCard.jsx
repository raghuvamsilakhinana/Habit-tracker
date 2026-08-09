import { useState } from 'react'
import { lastNDateKeys, todayKey, currentStreak, longestStreak, getDayState } from '../lib/dates'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function HabitCard({ habit, statusMap, onToggleToday, onDelete, onUpdateRestDays }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [editingRestDays, setEditingRestDays] = useState(false)
  const [toggling, setToggling] = useState(false)

  const today = todayKey()
  const todayState = getDayState(habit, statusMap, today)
  const last7 = lastNDateKeys(7)
  const streak = currentStreak(habit, statusMap)
  const best = longestStreak(habit, statusMap)

  async function handleToggle() {
    if (todayState === 'rest') return
    setToggling(true)
    await onToggleToday(habit, today, statusMap.get(today))
    setToggling(false)
  }

  function toggleRestDay(dayIndex) {
    const current = habit.rest_days ?? []
    const next = current.includes(dayIndex)
      ? current.filter((d) => d !== dayIndex)
      : [...current, dayIndex]
    onUpdateRestDays(habit.id, next)
  }

  return (
    <div className="group bg-white dark:bg-moss-900 rounded-xl2 shadow-card dark:shadow-cardDark p-5 animate-pop-in transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="h-9 w-9 shrink-0 rounded-lg flex items-center justify-center text-lg"
            style={{ backgroundColor: `${habit.color}22` }}
          >
            {habit.icon || '🌿'}
          </span>
          <div className="min-w-0">
            <h3 className="font-display font-medium text-moss-900 dark:text-parchment truncate">
              {habit.name}
            </h3>
            <p className="text-xs font-mono text-moss-600 dark:text-moss-100/60 mt-0.5">
              {streak > 0 ? `${streak} day${streak === 1 ? '' : 's'} streak` : 'Start today'}
              {best > 1 && <span className="text-moss-400 dark:text-moss-100/40"> · best {best}</span>}
            </p>
          </div>
        </div>

        {todayState === 'rest' ? (
          <span
            className="shrink-0 h-9 w-9 rounded-full border-2 border-dashed border-moss-200 dark:border-moss-700 flex items-center justify-center text-sm"
            title="Rest day"
          >
            🌙
          </span>
        ) : (
          <button
            onClick={handleToggle}
            disabled={toggling}
            aria-label={
              todayState === 'completed'
                ? 'Completed — tap for partial'
                : todayState === 'partial'
                ? 'Partial — tap to clear'
                : 'Not done — tap to mark complete'
            }
            className={`shrink-0 h-9 w-9 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
              todayState === 'completed'
                ? 'bg-bloom-500 border-bloom-500 text-white animate-check-pop'
                : todayState === 'partial'
                ? 'bg-bloom-400/40 border-bloom-400 text-bloom-600 dark:text-bloom-400'
                : 'border-moss-100 dark:border-moss-700 text-transparent hover:border-moss-400'
            }`}
          >
            {todayState === 'completed' ? '✓' : todayState === 'partial' ? '◐' : '✓'}
          </button>
        )}
      </div>

      {/* 7-day history: filled = completed, half-filled = partial, outlined = rest, faint = missed */}
      <div className="flex items-center justify-between mt-5">
        {last7.map((key) => {
          const state = getDayState(habit, statusMap, key)
          const isToday = key === today
          const dayIndex = new Date(key).getDay()

          const dotClasses =
            state === 'completed'
              ? 'bg-moss-600 dark:bg-bloom-500'
              : state === 'partial'
              ? 'bg-bloom-400/50 border border-bloom-400'
              : state === 'rest'
              ? 'border-2 border-dashed border-moss-200 dark:border-moss-700'
              : 'bg-moss-100 dark:bg-moss-800'

          return (
            <div key={key} className="flex flex-col items-center gap-1.5">
              <span
                className={`h-2.5 w-2.5 rounded-full transition-colors duration-300 ${dotClasses} ${
                  isToday ? 'ring-2 ring-offset-2 ring-moss-400 dark:ring-offset-moss-900' : ''
                }`}
              />
              <span className="text-[10px] font-mono text-moss-400 dark:text-moss-100/40">
                {DAY_LABELS[dayIndex]}
              </span>
            </div>
          )
        })}
      </div>

      <div className="mt-4 pt-3 border-t border-moss-50 dark:border-moss-800 flex items-center justify-between">
        <button
          onClick={() => setEditingRestDays((v) => !v)}
          className="text-xs text-moss-400 hover:text-moss-700 dark:hover:text-parchment transition-colors"
        >
          🌙 Rest days{habit.rest_days?.length ? ` (${habit.rest_days.length})` : ''}
        </button>

        {confirmingDelete ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="text-xs text-moss-600 dark:text-moss-100/60">Delete?</span>
            <button
              onClick={() => onDelete(habit.id)}
              className="text-xs font-medium text-bloom-600 hover:text-bloom-500"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirmingDelete(false)}
              className="text-xs font-medium text-moss-500 hover:text-moss-700 dark:hover:text-parchment"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmingDelete(true)}
            className="text-xs text-moss-400 hover:text-bloom-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            Delete
          </button>
        )}
      </div>

      {editingRestDays && (
        <div className="mt-3 pt-3 border-t border-moss-50 dark:border-moss-800 animate-fade-in">
          <p className="text-xs text-moss-500 dark:text-moss-100/50 mb-2">
            Days this habit is intentionally skipped — they won't break your streak or count against you.
          </p>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, index) => {
              const isRest = (habit.rest_days ?? []).includes(index)
              return (
                <button
                  key={index}
                  onClick={() => toggleRestDay(index)}
                  className={`h-8 w-8 rounded-full text-xs font-medium transition-colors duration-150 ${
                    isRest
                      ? 'bg-moss-600 text-white'
                      : 'bg-parchment dark:bg-moss-950 text-moss-500 dark:text-moss-100/50'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
