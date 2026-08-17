import { useMemo, useState } from 'react'
import { challengeEndDate, CHALLENGE_LENGTH_DAYS, CHALLENGE_MILESTONES, challengeDayNumber, challengeDayState, clampChallengeStart, formatChallengeDate, getChallengeSummary } from '../lib/challenge'
import { toDateKey, todayKey } from '../lib/dates'

function monthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 12)
}
function shiftMonth(date, amount) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1, 12)
}
function monthCells(date) {
  const start = monthStart(date)
  const first = start.getDay()
  const count = new Date(start.getFullYear(), start.getMonth() + 1, 0).getDate()
  const cells = []
  for (let i = 0; i < first; i++) cells.push(null)
  for (let day = 1; day <= count; day++) cells.push(toDateKey(new Date(start.getFullYear(), start.getMonth(), day, 12)))
  while (cells.length % 7) cells.push(null)
  return cells
}

const DATE_FMT = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

export default function ChallengeModal({ challenge, habits, logsByHabit, onClose, onCreate, onEditDate, setupError }) {
  const today = todayKey()
  const [mode, setMode] = useState(challenge ? 'view' : 'setup')
  const [name, setName] = useState('My 90 Day Reset')
  const [startDate, setStartDate] = useState(today)
  const [targetPercent, setTargetPercent] = useState(80)
  const [selectedIds, setSelectedIds] = useState(habits.map((habit) => habit.id))
  const [saving, setSaving] = useState(false)
  const [month, setMonth] = useState(() => monthStart(new Date()))
  const [selectedDate, setSelectedDate] = useState(today)

  const endDate = challengeEndDate(clampChallengeStart(startDate))
  const summary = useMemo(() => challenge ? getChallengeSummary(habits, logsByHabit, challenge) : null, [challenge, habits, logsByHabit])
  const cells = useMemo(() => monthCells(month), [month])

  function toggleHabit(id) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id])
  }

  async function handleCreate() {
    if (!name.trim()) return
    if (!selectedIds.length) return
    setSaving(true)
    try {
      await onCreate({ name: name.trim(), startDate: clampChallengeStart(startDate), targetPercent, selectedHabitIds: selectedIds })
    } catch (error) {
      // Dashboard surfaces setup/save errors in the modal.
    } finally {
      setSaving(false)
    }
  }

  const selectedState = challenge && selectedDate >= challenge.start_date && selectedDate <= challenge.end_date
    ? challengeDayState(habits, logsByHabit, challenge, selectedDate)
    : null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <button aria-label="Close 90 day challenge" className="modal-backdrop-button" onClick={onClose} />
      <div className="relative w-full sm:max-w-4xl max-h-[94vh] overflow-y-auto modal-card animate-pop-in rounded-t-[24px] sm:rounded-[24px]">
        <div className="modal-header sticky top-0 z-20">
          <div>
            <p className="section-kicker">90 day challenge</p>
            <h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">{challenge ? challenge.name : 'Start your next 90 days'}</h2>
            <p className="text-xs text-moss-400 dark:text-moss-100/45 mt-1">{challenge ? 'Keep the challenge simple: show up, recover when needed, and keep moving.' : 'Choose the habits that define this challenge and a daily target.'}</p>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close">×</button>
        </div>

        {!challenge && mode === 'setup' && (
          <div className="modal-body space-y-5">
            {setupError && <div className="error-banner">{setupError}</div>}
            <section className="challenge-setup-hero">
              <span>🌱</span>
              <div><strong>90 days. One clear direction.</strong><p>Missed days don't erase the challenge. Your score is about consistency across the days you actually track.</p></div>
            </section>

            <div className="challenge-form-grid">
              <label className="field-block"><span>Challenge name</span><input className="text-input" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></label>
              <label className="field-block"><span>Start date</span><input className="text-input" type="date" value={startDate} max={today} onChange={(e) => setStartDate(clampChallengeStart(e.target.value))} /></label>
            </div>

            <section className="challenge-form-section">
              <div><p className="section-kicker">Daily target</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">How much counts as a successful day?</h3></div>
              <div className="target-options mt-3">
                {[70, 80, 100].map((value) => <button key={value} type="button" className={`target-option ${targetPercent === value ? 'selected' : ''}`} onClick={() => setTargetPercent(value)}><strong>{value}%</strong><span>{value === 100 ? 'Every selected habit' : value === 80 ? 'Most habits' : 'Flexible day'}</span></button>)}
              </div>
            </section>

            <section className="challenge-form-section">
              <div><p className="section-kicker">Selected habits</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">Only the habits that matter for this challenge</h3></div>
              <div className="challenge-habit-picker mt-3">
                {habits.map((habit) => <button type="button" key={habit.id} className={`challenge-habit-option ${selectedIds.includes(habit.id) ? 'selected' : ''}`} onClick={() => toggleHabit(habit.id)}><span className="habit-icon small" style={{ backgroundColor: `${habit.color || '#4a5f43'}18` }}>{habit.icon || '🌿'}</span><span className="min-w-0 text-left"><strong>{habit.name}</strong><small>{selectedIds.includes(habit.id) ? 'Included' : 'Not included'}</small></span><span className="challenge-check">{selectedIds.includes(habit.id) ? '✓' : ''}</span></button>)}
              </div>
            </section>

            <div className="challenge-setup-summary"><span>Ends on</span><strong>{formatChallengeDate(endDate, { weekday: 'long', month: 'long' })}</strong><span>Selected habits</span><strong>{selectedIds.length}</strong></div>
            <button type="button" className="primary-btn w-full sm:w-auto" disabled={!selectedIds.length || !name.trim() || saving} onClick={handleCreate}>{saving ? 'Starting…' : 'Start 90 day challenge'}</button>
          </div>
        )}

        {challenge && (
          <div className="modal-body space-y-5">
            <div className="challenge-detail-hero">
              <div><span className="challenge-day-pill">Day {summary.dayNumber} / {CHALLENGE_LENGTH_DAYS}</span><h3 className="font-display text-2xl font-semibold text-white mt-3">Keep showing up.</h3><p className="text-sm text-white/60 mt-1">{summary.daysRemaining} days remaining · {summary.score}% successful-day rate</p></div>
              <div className="challenge-detail-ring" style={{ '--ring-progress': `${summary.progressPercent * 3.6}deg` }}><div>{summary.progressPercent}%</div></div>
            </div>

            <div className="challenge-detail-stats">
              <div><span>🔥 Current streak</span><strong>{summary.currentStreak}d</strong></div>
              <div><span>🏆 Best streak</span><strong>{summary.bestStreak}d</strong></div>
              <div><span>✓ Successful days</span><strong>{summary.successfulDays}</strong></div>
              <div><span>⚠ Missed days</span><strong>{summary.missedDays}</strong></div>
            </div>

            <section className="detail-section">
              <div className="flex items-start justify-between gap-3"><div><p className="section-kicker">Milestones</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">Your 90-day journey</h3></div><span className="font-mono text-xs text-moss-400 dark:text-moss-100/55">{summary.nextMilestone ? `${summary.nextMilestone - summary.dayNumber} days to go` : 'Complete'}</span></div>
              <div className="challenge-milestones mt-4">
                {CHALLENGE_MILESTONES.map((milestone) => <div key={milestone} className={`challenge-milestone ${summary.dayNumber >= milestone ? 'reached' : ''}`}><span>{summary.dayNumber >= milestone ? '✓' : milestone}</span><small>Day {milestone}</small></div>)}
              </div>
            </section>

            <section className="detail-section">
              <div className="flex items-center justify-between gap-3 mb-3"><div><p className="section-kicker">Challenge calendar</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">Track the journey</h3></div><div className="calendar-nav"><button type="button" onClick={() => setMonth((m) => shiftMonth(m, -1))} aria-label="Previous month">‹</button><strong>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</strong><button type="button" onClick={() => setMonth((m) => shiftMonth(m, 1))} aria-label="Next month">›</button></div></div>
              <div className="challenge-calendar-grid">
                {['S','M','T','W','T','F','S'].map((day, index) => <span key={`${day}-${index}`} className="challenge-calendar-head">{day}</span>)}
                {cells.map((key, index) => key ? <button type="button" key={key} className={`challenge-calendar-cell ${key === selectedDate ? 'selected' : ''} ${key === today ? 'today' : ''} ${challengeDayState(habits, logsByHabit, challenge, key)}`} onClick={() => setSelectedDate(key)} title={key} /> : <span key={`empty-${index}`} />)}
              </div>
              <div className="detail-legend"><span><i className="legend-dot completed" /> Successful</span><span><i className="legend-dot partial" /> Partial</span><span><i className="legend-dot missed" /> Missed</span><span><i className="legend-dot rest" /> Rest</span></div>
              {selectedState && <div className="challenge-day-detail mt-4"><div><span className="section-kicker">Selected day</span><strong>{DATE_FMT.format(new Date(`${selectedDate}T12:00:00`))}</strong></div><span className={`day-state-pill ${selectedState === 'successful' ? 'completed' : selectedState === 'partial' ? 'partial' : selectedState === 'rest' ? 'rest' : 'missed'}`}>{selectedState === 'successful' ? 'Successful' : selectedState === 'partial' ? 'Partial' : selectedState === 'rest' ? 'Rest day' : 'Missed'}</span>{selectedState !== 'rest' && <button type="button" className="secondary-btn" onClick={() => onEditDate(selectedDate)}>Edit this day</button>}</div>}
            </section>

            <section className="detail-section">
              <div><p className="section-kicker">Challenge habits</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">What you're growing</h3></div>
              <div className="challenge-habit-summary mt-3">{habits.filter((habit) => challenge.selected_habit_ids.includes(habit.id)).map((habit) => <div key={habit.id}><span className="habit-icon small" style={{ backgroundColor: `${habit.color || '#4a5f43'}18` }}>{habit.icon || '🌿'}</span><strong>{habit.name}</strong></div>)}</div>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
