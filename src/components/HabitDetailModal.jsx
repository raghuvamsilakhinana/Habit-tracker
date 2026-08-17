import { useMemo, useState } from 'react'
import { completionRate, currentStreak, getDayState, lastNDateKeys, longestStreak, todayKey, toDateKey } from '../lib/dates'
import { getBadge, HABIT_BADGE_TIERS } from '../lib/badges'

const DATE_FMT = new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
const MILESTONES = [3, 7, 14, 30, 60, 100, 200, 365]

export default function HabitDetailModal({ habit, statusMap, onClose, onEditDate }) {
  const today = todayKey()
  const [selectedDate, setSelectedDate] = useState(today)
  const days = useMemo(() => lastNDateKeys(90), [])
  const streak = currentStreak(habit, statusMap)
  const best = longestStreak(habit, statusMap)
  const monthly = completionRate(habit, statusMap, 30)
  const ninety = completionRate(habit, statusMap, 90)
  const badge = getBadge(streak, HABIT_BADGE_TIERS)
  const nextMilestone = MILESTONES.find((n) => n > streak) ?? streak
  const progress = nextMilestone ? Math.min(100, Math.round((streak / nextMilestone) * 100)) : 100
  const selectedState = getDayState(habit, statusMap, selectedDate)
  const selectedExists = selectedDate >= toDateKey(habit.created_at)

  const weeks = useMemo(() => {
    const result = []
    for (let i = 0; i < days.length; i += 7) result.push(days.slice(i, i + 7))
    return result
  }, [days])

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <button aria-label="Close habit details" className="modal-backdrop-button" onClick={onClose} />
      <div className="relative w-full sm:max-w-4xl max-h-[94vh] overflow-y-auto modal-card animate-pop-in rounded-t-[24px] sm:rounded-[24px]">
        <div className="modal-header sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <span className="habit-icon large" style={{ backgroundColor: `${habit.color || '#4a5f43'}18` }}>{habit.icon || '🌿'}</span>
            <div className="min-w-0">
              <p className="section-kicker">Habit journey</p>
              <h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1 truncate">{habit.name}</h2>
            </div>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close">×</button>
        </div>

        <div className="modal-body space-y-5">
          <div className="habit-detail-stats">
            <div className="detail-stat accent"><span>🔥</span><small>Current streak</small><strong>{streak}d</strong></div>
            <div className="detail-stat"><span>🏆</span><small>Best streak</small><strong>{best}d</strong></div>
            <div className="detail-stat"><span>📅</span><small>30-day</small><strong>{monthly}%</strong></div>
            <div className="detail-stat"><span>✨</span><small>90-day</small><strong>{ninety}%</strong></div>
          </div>

          <section className="detail-section">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div><p className="section-kicker">Consistency</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">Last 90 days</h3></div>
              {badge.current && <span className="detail-badge">{badge.current.icon} {badge.current.label}</span>}
            </div>
            <div className="detail-heatmap-scroll">
              <div className="detail-heatmap">
                {weeks.map((week, index) => (
                  <div key={index} className="detail-week">
                    {week.map((key) => {
                      const state = getDayState(habit, statusMap, key)
                      const level = state === 'rest' ? 'rest' : state === 'completed' ? 'completed' : state === 'partial' ? 'partial' : 'missed'
                      return <button key={key} type="button" className={`detail-cell ${level} ${key === today ? 'today' : ''}`} onClick={() => setSelectedDate(key)} title={`${key} · ${state}`} />
                    })}
                  </div>
                ))}
              </div>
            </div>
            <div className="detail-legend"><span><i className="legend-dot completed" /> Completed</span><span><i className="legend-dot partial" /> Partial</span><span><i className="legend-dot missed" /> Missed</span><span><i className="legend-dot rest" /> Rest</span></div>
          </section>

          <section className="detail-section">
            <div className="flex items-center justify-between gap-3">
              <div><p className="section-kicker">Selected day</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">{DATE_FMT.format(new Date(`${selectedDate}T12:00:00`))}</h3></div>
              <span className={`day-state-pill ${selectedState}`}>{selectedState === 'completed' ? 'Completed' : selectedState === 'partial' ? 'Partial' : selectedState === 'rest' ? 'Rest day' : selectedExists ? 'Missed' : 'Before habit'}</span>
            </div>
            {selectedExists && selectedState !== 'rest' && <button className="secondary-btn mt-3" type="button" onClick={() => onEditDate(selectedDate)}>Edit this day</button>}
          </section>

          <section className="detail-section">
            <div className="flex items-center justify-between gap-3 mb-2"><div><p className="section-kicker">Next milestone</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">{nextMilestone ? `${nextMilestone} day milestone` : 'All milestones reached'}</h3></div><span className="font-mono text-sm text-moss-400 dark:text-moss-100/55">{Math.max(0, nextMilestone - streak)} to go</span></div>
            <div className="milestone-track large"><div style={{ width: `${progress}%` }} /></div>
          </section>
        </div>
      </div>
    </div>
  )
}
