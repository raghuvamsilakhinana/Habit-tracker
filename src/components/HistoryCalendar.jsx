import { useMemo, useState } from 'react'
import { getDayState, isRestDay, todayKey, toDateKey } from '../lib/dates'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const MONTH_FMT = new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' })
const DATE_FMT = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

function monthStartKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`
}

function addMonths(date, amount) {
  const next = new Date(date)
  next.setMonth(next.getMonth() + amount, 1)
  return next
}

function monthDays(date) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1, 12)
  const firstDay = start.getDay()
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(toDateKey(new Date(date.getFullYear(), date.getMonth(), day, 12)))
  }
  while (cells.length % 7) cells.push(null)
  return cells
}

function daySummary(habits, logsByHabit, dateKey) {
  let completed = 0
  let partial = 0
  let tracked = 0
  let rest = 0
  for (const habit of habits) {
    const state = getDayState(habit, logsByHabit[habit.id] ?? new Map(), dateKey)
    if (state === 'rest') { rest++; continue }
    tracked++
    if (state === 'completed') completed++
    if (state === 'partial') partial++
  }
  const rate = tracked ? Math.round(((completed + partial * 0.5) / tracked) * 100) : null
  return { completed, partial, tracked, rest, rate }
}

export default function HistoryCalendar({ habits, logsByHabit, onClose, onEditDate }) {
  const today = todayKey()
  const earliestKey = useMemo(() => habits.reduce((earliest, habit) => {
    const key = toDateKey(habit.created_at)
    return !earliest || key < earliest ? key : earliest
  }, null), [habits])
  const [month, setMonth] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1, 12)
  })
  const [selectedDate, setSelectedDate] = useState(today)
  const cells = useMemo(() => monthDays(month), [month])
  const selected = selectedDate && selectedDate <= today && (!earliestKey || selectedDate >= earliestKey) ? selectedDate : null
  const summary = selected ? daySummary(habits, logsByHabit, selected) : null

  const canPrev = !earliestKey || monthStartKey(month) > monthStartKey(new Date(`${earliestKey}T12:00:00`))
  const canNext = month.getFullYear() < new Date(`${today}T12:00:00`).getFullYear()
    || (month.getFullYear() === new Date(`${today}T12:00:00`).getFullYear() && month.getMonth() < new Date(`${today}T12:00:00`).getMonth())

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <button aria-label="Close history" className="modal-backdrop-button" onClick={onClose} />
      <div className="relative w-full sm:max-w-4xl max-h-[94vh] overflow-y-auto modal-card animate-pop-in rounded-t-[24px] sm:rounded-[24px]">
        <div className="modal-header sticky top-0 z-20">
          <div>
            <p className="section-kicker">Your history</p>
            <h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">Consistency calendar</h2>
            <p className="text-xs text-moss-400 dark:text-moss-100/45 mt-1">Pick any past day to review what happened and correct it when needed.</p>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close">×</button>
        </div>

        <div className="modal-body grid lg:grid-cols-[1.45fr_.9fr] gap-5">
          <section className="calendar-panel">
            <div className="flex items-center justify-between gap-3 mb-4">
              <button type="button" className="calendar-nav" disabled={!canPrev} onClick={() => setMonth((m) => addMonths(m, -1))}>←</button>
              <h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment">{MONTH_FMT.format(month)}</h3>
              <button type="button" className="calendar-nav" disabled={!canNext} onClick={() => setMonth((m) => addMonths(m, 1))}>→</button>
            </div>
            <div className="calendar-week-head">
              {DAY_LABELS.map((label, index) => <span key={`${label}-${index}`}>{label}</span>)}
            </div>
            <div className="calendar-grid">
              {cells.map((key, index) => {
                if (!key) return <span key={`blank-${index}`} className="calendar-cell calendar-cell-empty" />
                const isFuture = key > today
                const isBeforeHabit = earliestKey && key < earliestKey
                const info = daySummary(habits, logsByHabit, key)
                const state = info.rate === null ? (info.rest ? 'rest' : 'empty') : info.rate === 100 ? 'perfect' : info.rate >= 70 ? 'good' : info.rate > 0 ? 'partial' : 'missed'
                const selectedClass = key === selected ? 'selected' : ''
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isFuture || isBeforeHabit}
                    onClick={() => setSelectedDate(key)}
                    className={`calendar-cell ${state} ${selectedClass} ${key === today ? 'today' : ''}`}
                    title={isBeforeHabit ? 'Before your first habit' : isFuture ? 'Future date' : `${DATE_FMT.format(new Date(`${key}T12:00:00`))} · ${info.rate ?? 0}%`}
                  >
                    <span>{Number(key.slice(-2))}</span>
                  </button>
                )
              })}
            </div>
            <div className="calendar-legend">
              <span><i className="legend-dot perfect" /> 100%</span>
              <span><i className="legend-dot good" /> 70–99%</span>
              <span><i className="legend-dot partial" /> 1–69%</span>
              <span><i className="legend-dot missed" /> 0%</span>
              <span><i className="legend-dot rest" /> Rest</span>
            </div>
          </section>

          <section className="calendar-detail">
            {selected && summary ? (
              <>
                <div className="calendar-detail-head">
                  <div>
                    <p className="section-kicker">Selected day</p>
                    <h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">{DATE_FMT.format(new Date(`${selected}T12:00:00`))}</h3>
                  </div>
                  <span className={`calendar-rate-badge ${summary.rate === 100 ? 'good' : summary.rate > 0 ? 'partial' : summary.rate === null ? 'rest' : 'missed'}`}>{summary.rate === null ? 'Rest' : `${summary.rate}%`}</span>
                </div>
                <div className="calendar-summary-grid">
                  <div><strong>{summary.completed}</strong><span>completed</span></div>
                  <div><strong>{summary.partial}</strong><span>partial</span></div>
                  <div><strong>{summary.tracked - summary.completed - summary.partial}</strong><span>missed</span></div>
                  <div><strong>{summary.rest}</strong><span>rest</span></div>
                </div>
                <div className="day-habit-list">
                  {habits.filter((habit) => selected >= toDateKey(habit.created_at)).map((habit) => {
                    const state = getDayState(habit, logsByHabit[habit.id] ?? new Map(), selected)
                    return (
                      <div key={habit.id} className="day-habit-row">
                        <span className="habit-icon small" style={{ backgroundColor: `${habit.color || '#4a5f43'}18` }}>{habit.icon || '🌿'}</span>
                        <span className="min-w-0 flex-1 truncate">{habit.name}</span>
                        <span className={`day-state-pill ${state}`}>{state === 'rest' ? 'Rest' : state === 'completed' ? 'Done' : state === 'partial' ? 'Partial' : 'Missed'}</span>
                      </div>
                    )
                  })}
                </div>
                <button type="button" className="primary-btn w-full mt-4" onClick={() => onEditDate(selected)}>Edit this day</button>
              </>
            ) : (
              <div className="empty-state py-12">Select a day to see the breakdown.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
