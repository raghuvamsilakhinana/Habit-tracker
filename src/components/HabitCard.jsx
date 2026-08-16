import { useState } from 'react'
import { lastNDateKeys, todayKey, currentStreak, longestStreak, getDayState } from '../lib/dates'
import { getBadge, HABIT_BADGE_TIERS } from '../lib/badges'

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
  const badge = getBadge(streak, HABIT_BADGE_TIERS)
  const completion = Math.min(100, Math.max(0, Math.round((streak / Math.max(best || streak || 1, 1)) * 100)))

  async function handleToggle() {
    if (todayState === 'rest') return
    setToggling(true)
    await onToggleToday(habit, today, statusMap.get(today))
    setToggling(false)
  }

  function toggleRestDay(dayIndex) {
    const current = habit.rest_days ?? []
    const next = current.includes(dayIndex) ? current.filter((d) => d !== dayIndex) : [...current, dayIndex]
    onUpdateRestDays(habit.id, next)
  }

  return (
    <article className="group relative overflow-hidden rounded-2xl bg-white dark:bg-moss-900 shadow-card dark:shadow-cardDark p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl">
      <div className="absolute inset-x-0 top-0 h-1" style={{ backgroundColor: habit.color || '#4a5f43' }} />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-xl shadow-sm" style={{ backgroundColor: `${habit.color || '#4a5f43'}22` }}>
            {habit.icon || '🌿'}
          </span>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-moss-900 dark:text-parchment truncate">{habit.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[11px] font-mono text-moss-500 dark:text-moss-100/50">{streak ? `${streak} day streak` : 'Ready to start'}</span>
              {best > 1 && <span className="text-[10px] text-moss-400 dark:text-moss-100/30">• best {best}</span>}
            </div>
            {badge.current && <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-medium bg-moss-100 dark:bg-moss-800 text-moss-700 dark:text-moss-100/80 px-2 py-0.5 rounded-full">{badge.current.icon} {badge.current.label}</span>}
          </div>
        </div>

        {todayState === 'rest' ? (
          <span className="shrink-0 h-11 w-11 rounded-full border-2 border-dashed border-moss-200 dark:border-moss-700 flex items-center justify-center text-sm" title="Rest day">🌙</span>
        ) : (
          <button
            onClick={handleToggle}
            disabled={toggling}
            aria-label={todayState === 'completed' ? 'Completed — tap for partial' : todayState === 'partial' ? 'Partial — tap to clear' : 'Not done — tap to mark complete'}
            className={`shrink-0 h-11 w-11 rounded-full border-2 flex items-center justify-center text-base transition-all duration-200 ${todayState === 'completed' ? 'bg-bloom-500 border-bloom-500 text-white animate-check-pop shadow-lg shadow-bloom-500/20' : todayState === 'partial' ? 'bg-bloom-400/30 border-bloom-400 text-bloom-600 dark:text-bloom-400' : 'border-moss-100 dark:border-moss-700 text-transparent hover:border-moss-400 hover:bg-moss-50 dark:hover:bg-moss-800'}`}
          >
            {todayState === 'completed' ? '✓' : todayState === 'partial' ? '◐' : '✓'}
          </button>
        )}
      </div>

      <div className="mt-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {last7.map((key) => {
            const state = getDayState(habit, statusMap, key)
            const isToday = key === today
            const dayIndex = new Date(`${key}T12:00:00`).getDay()
            const dotClasses = state === 'completed' ? 'bg-moss-600 dark:bg-bloom-500' : state === 'partial' ? 'bg-bloom-400/50 border border-bloom-400' : state === 'rest' ? 'border-2 border-dashed border-moss-200 dark:border-moss-700' : 'bg-moss-100 dark:bg-moss-800'
            return (
              <div key={key} className="flex flex-col items-center gap-1" title={`${key} · ${state}`}>
                <span className={`h-3 w-3 rounded-full transition-colors duration-300 ${dotClasses} ${isToday ? 'ring-2 ring-offset-2 ring-moss-400 dark:ring-offset-moss-900' : ''}`} />
                <span className="text-[9px] font-mono text-moss-400 dark:text-moss-100/35">{DAY_LABELS[dayIndex]}</span>
              </div>
            )
          })}
        </div>
        <span className="text-[10px] font-mono text-moss-400 dark:text-moss-100/35 whitespace-nowrap">{completion}% streak progress</span>
      </div>

      <div className="mt-4 h-1 rounded-full bg-moss-100 dark:bg-moss-800 overflow-hidden">
        <div className="h-full rounded-full bg-moss-600 dark:bg-bloom-500 transition-all duration-700" style={{ width: `${completion}%` }} />
      </div>

      <div className="mt-4 pt-3 border-t border-moss-50 dark:border-moss-800 flex items-center justify-between">
        <button onClick={() => setEditingRestDays((v) => !v)} className="text-xs text-moss-400 hover:text-moss-700 dark:hover:text-parchment transition-colors">🌙 Rest days{habit.rest_days?.length ? ` (${habit.rest_days.length})` : ''}</button>
        {confirmingDelete ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="text-xs text-moss-600 dark:text-moss-100/60">Delete?</span>
            <button onClick={() => onDelete(habit.id)} className="text-xs font-medium text-bloom-600 hover:text-bloom-500">Confirm</button>
            <button onClick={() => setConfirmingDelete(false)} className="text-xs font-medium text-moss-500 hover:text-moss-700 dark:hover:text-parchment">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmingDelete(true)} className="text-xs text-moss-400 hover:text-bloom-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200">Delete</button>
        )}
      </div>

      {editingRestDays && (
        <div className="mt-3 pt-3 border-t border-moss-50 dark:border-moss-800 animate-fade-in">
          <p className="text-xs text-moss-500 dark:text-moss-100/50 mb-2">Days this habit is intentionally skipped — they won't break your streak or count against you.</p>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, index) => {
              const isRest = (habit.rest_days ?? []).includes(index)
              return <button key={index} onClick={() => toggleRestDay(index)} className={`h-8 w-8 rounded-full text-xs font-medium transition-colors duration-150 ${isRest ? 'bg-moss-600 text-white' : 'bg-parchment dark:bg-moss-950 text-moss-500 dark:text-moss-100/50 hover:bg-moss-100 dark:hover:bg-moss-800'}`}>{label}</button>
            })}
          </div>
        </div>
      )}
    </article>
  )
}
