import { useMemo } from 'react'
import { getDayState, lastNDateKeys, todayKey } from '../lib/dates'

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function ConsistencyHeatmap({ habits, logsByHabit }) {
  const days = useMemo(() => lastNDateKeys(84), [])
  const cells = useMemo(() => {
    return days.map((dateKey) => {
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
    })
  }, [days, habits, logsByHabit])

  const today = todayKey()
  const monthLabels = []
  days.forEach((key, index) => {
    const month = new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { month: 'short' })
    const prev = index > 0 ? new Date(`${days[index - 1]}T12:00:00`).toLocaleDateString(undefined, { month: 'short' }) : null
    if (month !== prev && index + 1 > 2) monthLabels.push({ index, month })
  })

  return (
    <section className="rounded-2xl bg-white dark:bg-moss-900 shadow-card dark:shadow-cardDark p-5 sm:p-6 mb-6 animate-fade-in">
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="section-kicker">Consistency</p>
          <h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">Your last 12 weeks</h2>
          <p className="text-xs text-moss-500 dark:text-moss-100/50 mt-1">Every square is a day. Darker means more habits completed.</p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[10px] text-moss-400 dark:text-moss-100/40">
          <span>Less</span>
          {[0, 25, 50, 75, 100].map((n) => <span key={n} className={`heat-cell heat-${n}`} />)}
          <span>More</span>
        </div>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[560px]">
          <div className="relative ml-7 h-5 text-[10px] font-mono text-moss-400 dark:text-moss-100/40">
            {monthLabels.map(({ index, month }) => (
              <span key={`${month}-${index}`} className="absolute" style={{ left: `${(index / days.length) * 100}%` }}>{month}</span>
            ))}
          </div>
          <div className="flex gap-1">
            <div className="grid grid-rows-7 gap-1 mr-1 pt-0">
              {DAY_LABELS.map((day, i) => <span key={`${day}-${i}`} className="h-3.5 w-5 text-[9px] font-mono text-moss-400 dark:text-moss-100/30 flex items-center">{i % 2 ? day : ''}</span>)}
            </div>
            <div className="grid grid-rows-7 grid-flow-col gap-1">
              {cells.map(({ dateKey, tracked, rate }) => {
                const todayCell = dateKey === today
                const level = rate === null ? 'rest' : rate === 0 ? '0' : rate <= 25 ? '25' : rate <= 50 ? '50' : rate <= 75 ? '75' : '100'
                return (
                  <div
                    key={dateKey}
                    title={`${dateKey}${rate === null ? ' · rest' : ` · ${rate}% complete`}`}
                    className={`heat-cell heat-${level} ${todayCell ? 'ring-2 ring-moss-400 ring-offset-1 dark:ring-offset-moss-900' : ''}`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
