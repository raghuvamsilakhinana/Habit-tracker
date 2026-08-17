import { useMemo } from 'react'
import { getDayState, getOverallDayState, lastNDateKeys } from '../lib/dates'

export default function WeeklyReview({ habits, logsByHabit }) {
  const days = useMemo(() => lastNDateKeys(7), [])
  const overview = useMemo(() => {
    const dayRates = days.map((dateKey) => {
      let tracked = 0
      let score = 0
      for (const habit of habits) {
        const state = getDayState(habit, logsByHabit[habit.id] ?? new Map(), dateKey)
        if (state === 'rest') continue
        tracked++
        if (state === 'completed') score += 1
        if (state === 'partial') score += 0.5
      }
      return { dateKey, rate: tracked ? Math.round((score / tracked) * 100) : null }
    })

    const perHabit = habits.map((habit) => {
      const map = logsByHabit[habit.id] ?? new Map()
      let tracked = 0
      let score = 0
      for (const dateKey of days) {
        const state = getDayState(habit, map, dateKey)
        if (state === 'rest') continue
        tracked++
        if (state === 'completed') score += 1
        if (state === 'partial') score += 0.5
      }
      return { habit, rate: tracked ? Math.round((score / tracked) * 100) : 100 }
    })

    const average = Math.round(dayRates.filter((d) => d.rate !== null).reduce((sum, d) => sum + d.rate, 0) / Math.max(1, dayRates.filter((d) => d.rate !== null).length))
    const perfectDays = days.filter((dateKey) => getOverallDayState(habits, logsByHabit, dateKey) === 'perfect').length
    const best = perHabit.reduce((a, b) => (b.rate > a.rate ? b : a), perHabit[0])
    const worst = perHabit.reduce((a, b) => (b.rate < a.rate ? b : a), perHabit[0])
    const strongestDay = dayRates.filter((d) => d.rate !== null).reduce((a, b) => (b.rate > a.rate ? b : a), dayRates.find((d) => d.rate !== null) || dayRates[0])
    const hardestDay = dayRates.filter((d) => d.rate !== null).reduce((a, b) => (b.rate < a.rate ? b : a), dayRates.find((d) => d.rate !== null) || dayRates[0])

    return { dayRates, average, perfectDays, best, worst, strongestDay, hardestDay }
  }, [days, habits, logsByHabit])

  if (!habits.length) return null

  const dayName = (key) => new Date(`${key}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' })

  return (
    <section className="review-card mb-5 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-5">
        <div><p className="section-kicker">Weekly review</p><h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">A week worth looking back on</h2><p className="text-xs text-moss-400 dark:text-moss-100/50 mt-1">A quick read on what went well and where your next small win is.</p></div>
        <span className="review-score">{overview.average}% week</span>
      </div>

      <div className="review-chart">
        {overview.dayRates.map(({ dateKey, rate }) => {
          const height = rate === null ? 18 : Math.max(12, rate)
          return <div key={dateKey} className="review-bar-wrap"><span className="review-bar-value">{rate === null ? '–' : `${rate}%`}</span><div className="review-bar-track"><div className="review-bar" style={{ height: `${height}%` }} /></div><span className="review-bar-label">{dayName(dateKey)}</span></div>
        })}
      </div>

      <div className="review-insights">
        <div><span>🌱 Strongest habit</span><strong>{overview.best?.habit?.icon || '🌿'} {overview.best?.habit?.name || '—'}</strong><em>{overview.best?.rate ?? 0}% this week</em></div>
        <div><span>🎯 Needs attention</span><strong>{overview.worst?.habit?.icon || '🌿'} {overview.worst?.habit?.name || '—'}</strong><em>{overview.worst?.rate ?? 0}% this week</em></div>
        <div><span>✨ Perfect days</span><strong>{overview.perfectDays}</strong><em>of 7 days</em></div>
        <div><span>🏁 Strongest day</span><strong>{overview.strongestDay ? dayName(overview.strongestDay.dateKey) : '—'}</strong><em>{overview.strongestDay?.rate ?? 0}% complete</em></div>
        <div><span>🧭 Hardest day</span><strong>{overview.hardestDay ? dayName(overview.hardestDay.dateKey) : '—'}</strong><em>{overview.hardestDay?.rate ?? 0}% complete</em></div>
      </div>
    </section>
  )
}
