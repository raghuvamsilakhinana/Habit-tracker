import { useMemo, useState } from 'react'
import { getDayState, lastNDateKeys, todayKey } from '../lib/dates'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function ConsistencyHeatmap({ habits, logsByHabit }) {
  const days = useMemo(() => lastNDateKeys(84), [])
  const [hovered, setHovered] = useState(null)
  const cells = useMemo(() => days.map((dateKey) => {
    let tracked = 0
    let score = 0
    for (const habit of habits) {
      const state = getDayState(habit, logsByHabit[habit.id] ?? new Map(), dateKey)
      if (state === 'rest') continue
      tracked += 1
      if (state === 'completed') score += 1
      if (state === 'partial') score += 0.5
    }
    return { dateKey, tracked, score, rate: tracked ? Math.round((score / tracked) * 100) : null }
  }), [days, habits, logsByHabit])

  const today = todayKey()
  const monthLabels = []
  days.forEach((key, index) => {
    const month = new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { month: 'short' })
    const prev = index ? new Date(`${days[index - 1]}T12:00:00`).toLocaleDateString(undefined, { month: 'short' }) : null
    if (month !== prev && index > 2) monthLabels.push({ index, month })
  })

  const hoverData = hovered ? cells.find((cell) => cell.dateKey === hovered) : null
  const hoverLabel = hovered ? new Date(`${hovered}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) : ''

  return (
    <section className="heatmap-card mb-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div>
          <p className="section-kicker">Consistency</p>
          <h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">Your last 12 weeks</h2>
          <p className="text-xs text-moss-400 dark:text-moss-100/50 mt-1">A visual record of how often you showed up.</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-moss-400 dark:text-moss-100/40 self-start">
          <span>Less</span>
          {[0, 25, 50, 75, 100].map((n) => <span key={n} className={`heat-cell heat-${n}`} />)}
          <span>More</span>
        </div>
      </div>

      <div className="heatmap-scroll">
        <div className="min-w-[560px]">
          <div className="relative ml-7 h-5 text-[10px] font-mono text-moss-400 dark:text-moss-100/40">
            {monthLabels.map(({ index, month }) => <span key={`${month}-${index}`} className="absolute" style={{ left: `${(index / days.length) * 100}%` }}>{month}</span>)}
          </div>
          <div className="flex gap-1.5">
            <div className="grid grid-rows-7 gap-1.5 mr-1 pt-0">
              {DAY_LABELS.map((day, i) => <span key={`${day}-${i}`} className="h-3.5 w-5 text-[9px] font-mono text-moss-400 dark:text-moss-100/30 flex items-center">{i % 2 ? day : ''}</span>)}
            </div>
            <div className="grid grid-rows-7 grid-flow-col gap-1.5">
              {cells.map(({ dateKey, tracked, rate }) => {
                const todayCell = dateKey === today
                const level = rate === null ? 'rest' : rate === 0 ? '0' : rate <= 25 ? '25' : rate <= 50 ? '50' : rate <= 75 ? '75' : '100'
                return (
                  <button
                    key={dateKey}
                    type="button"
                    aria-label={`${dateKey}${rate === null ? ' rest day' : ` ${rate}% complete`}`}
                    onMouseEnter={() => setHovered(dateKey)}
                    onMouseLeave={() => setHovered(null)}
                    onFocus={() => setHovered(dateKey)}
                    onBlur={() => setHovered(null)}
                    className={`heat-cell heat-${level} cursor-pointer ${todayCell ? 'ring-2 ring-moss-400 ring-offset-2 dark:ring-offset-moss-900' : ''}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="heatmap-footnote">
        <span>{hoverData ? <><strong>{hoverLabel}</strong> · {hoverData.rate === null ? 'Rest day' : `${hoverData.rate}% complete (${hoverData.tracked} tracked)`}</> : 'Hover a day for details'}</span>
        <span>Today is highlighted</span>
      </div>
    </section>
  )
}
