import { useState } from 'react'
import { lastNDateKeys, todayKey, currentStreak, longestStreak, getDayState } from '../lib/dates'
import { getBadge, HABIT_BADGE_TIERS } from '../lib/badges'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365]

export default function HabitCard({ habit, statusMap, onToggleToday, onDelete, onUpdateRestDays, onOpenDetail }) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [editingRestDays, setEditingRestDays] = useState(false)
  const [toggling, setToggling] = useState(false)
  const today = todayKey()
  const todayState = getDayState(habit, statusMap, today)
  const last7 = lastNDateKeys(7)
  const streak = currentStreak(habit, statusMap)
  const best = longestStreak(habit, statusMap)
  const badge = getBadge(streak, HABIT_BADGE_TIERS)
  const nextMilestone = MILESTONES.find((n) => n > streak) ?? Math.max(streak, 1)
  const milestoneProgress = nextMilestone === 0 ? 0 : Math.min(100, Math.round((streak / nextMilestone) * 100))

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
    <article className="habit-card group" style={{ '--habit-accent': habit.color || '#4a5f43' }}>
      <div className="habit-accent" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="habit-icon" style={{ backgroundColor: `${habit.color || '#4a5f43'}18` }}>{habit.icon || '🌿'}</span>
          <div className="min-w-0">
            <h3 className="font-display font-semibold text-moss-900 dark:text-parchment truncate">{habit.name}</h3>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
              <span className="micro-copy">{streak ? `${streak} day streak` : 'Ready to start'}</span>
              {best > 1 && <span className="micro-copy muted">Best {best}</span>}
            </div>
          </div>
        </div>

        {todayState === 'rest' ? (
          <span className="check-control check-rest" title="Rest day">🌙</span>
        ) : (
          <button
            onClick={handleToggle}
            disabled={toggling}
            aria-label={todayState === 'completed' ? 'Completed — tap for partial' : todayState === 'partial' ? 'Partial — tap to clear' : 'Not done — tap to mark complete'}
            className={`check-control ${todayState === 'completed' ? 'check-complete' : todayState === 'partial' ? 'check-partial' : 'check-empty'} ${toggling ? 'opacity-60' : ''}`}
          >
            {todayState === 'completed' ? '✓' : todayState === 'partial' ? '◐' : '✓'}
          </button>
        )}
      </div>

      <div className="habit-week">
        {last7.map((key) => {
          const state = getDayState(habit, statusMap, key)
          const isToday = key === today
          const dayIndex = new Date(`${key}T12:00:00`).getDay()
          const classes = state === 'completed' ? 'day-dot done' : state === 'partial' ? 'day-dot partial' : state === 'rest' ? 'day-dot rest' : 'day-dot missed'
          return (
            <div key={key} className="day-cell" title={`${key} · ${state}`}>
              <span className={`${classes} ${isToday ? 'day-dot-today' : ''}`} />
              <span className="day-label">{DAY_LABELS[dayIndex]}</span>
            </div>
          )
        })}
        <div className="ml-auto text-right">
          <div className="text-[10px] font-mono text-moss-400 dark:text-moss-100/45">{nextMilestone > streak ? `${nextMilestone - streak} to next milestone` : 'Top milestone reached'}</div>
          <div className="text-[9px] uppercase tracking-[0.12em] text-moss-400 dark:text-moss-100/30 mt-0.5">{streak ? `${streak} day streak` : 'Build your streak'}</div>
        </div>
      </div>

      <div className="milestone-track"><div style={{ width: `${milestoneProgress}%` }} /></div>

      <div className="habit-footer">
        <div className="flex items-center gap-3 min-w-0"><button onClick={() => setEditingRestDays((v) => !v)} className="footer-link">🌙 Rest days{habit.rest_days?.length ? ` · ${habit.rest_days.length}` : ''}</button><button onClick={() => onOpenDetail(habit)} className="footer-link detail-link">View history</button></div>
        {confirmingDelete ? (
          <div className="flex items-center gap-2 animate-fade-in">
            <span className="micro-copy">Delete?</span>
            <button onClick={() => onDelete(habit.id)} className="danger-link">Confirm</button>
            <button onClick={() => setConfirmingDelete(false)} className="footer-link">Cancel</button>
          </div>
        ) : (
          <button onClick={() => setConfirmingDelete(true)} className="delete-link">Delete</button>
        )}
      </div>

      {badge.current && <div className="habit-badge">{badge.current.icon} {badge.current.label}</div>}

      {editingRestDays && (
        <div className="rest-editor animate-fade-in">
          <p className="micro-copy mb-2">Rest days won't break your streak or count against you.</p>
          <div className="flex gap-1.5">
            {DAY_LABELS.map((label, index) => {
              const isRest = (habit.rest_days ?? []).includes(index)
              return <button key={index} onClick={() => toggleRestDay(index)} className={`rest-day-btn ${isRest ? 'selected' : ''}`}>{label}</button>
            })}
          </div>
        </div>
      )}
    </article>
  )
}
