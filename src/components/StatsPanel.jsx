import { completionRate, overallCurrentStreak, overallLongestStreak } from '../lib/dates'
import { getBadge, PERFECT_DAY_BADGE_TIERS } from '../lib/badges'

export default function StatsPanel({ habits, logsByHabit }) {
  if (habits.length === 0) return null

  const perfectStreak = overallCurrentStreak(habits, logsByHabit)
  const perfectLongest = overallLongestStreak(habits, logsByHabit)
  const currentBadge = getBadge(perfectStreak, PERFECT_DAY_BADGE_TIERS)
  const longestBadge = getBadge(perfectLongest, PERFECT_DAY_BADGE_TIERS)

  const withRates = habits.map((h) => {
    const statusMap = logsByHabit[h.id] ?? new Map()
    return { habit: h, weekly: completionRate(h, statusMap, 7), monthly: completionRate(h, statusMap, 30) }
  })

  const weeklyAvg = Math.round(withRates.reduce((sum, r) => sum + r.weekly, 0) / withRates.length)
  const monthlyAvg = Math.round(withRates.reduce((sum, r) => sum + r.monthly, 0) / withRates.length)
  const best = withRates.reduce((a, b) => (b.monthly > a.monthly ? b : a))
  const worst = withRates.reduce((a, b) => (b.monthly < a.monthly ? b : a))
  const allPerfect = worst.monthly === 100

  return (
    <section className="mb-5 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon="🔥" label="Current streak" value={`${perfectStreak}d`} sub={currentBadge.current ? `${currentBadge.current.icon} ${currentBadge.current.label}` : 'perfect days'} accent />
        <MetricCard icon="🏆" label="Best streak" value={`${perfectLongest}d`} sub={longestBadge.current ? `${longestBadge.current.icon} ${longestBadge.current.label}` : 'all-time'} />
        <MetricCard icon="📅" label="This week" value={`${weeklyAvg}%`} sub="7-day consistency" />
        <MetricCard icon="✨" label="This month" value={`${monthlyAvg}%`} sub="30-day consistency" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <ProgressInsight icon="🌱" title="Strongest habit" habit={best.habit} value={best.monthly} positive />
        <ProgressInsight icon={allPerfect ? '🎉' : '🎯'} title={allPerfect ? 'Everything is on track' : 'Needs a little focus'} habit={allPerfect ? null : worst.habit} value={allPerfect ? 100 : worst.monthly} positive={allPerfect} />
      </div>
    </section>
  )
}

function MetricCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`metric-card ${accent ? 'metric-card-accent' : ''}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="metric-icon">{icon}</span>
        <span className="metric-label">{label}</span>
      </div>
      <div className="font-display text-2xl sm:text-3xl font-semibold mt-2.5">{value}</div>
      <div className="metric-sub">{sub}</div>
    </div>
  )
}

function ProgressInsight({ icon, title, habit, value, positive }) {
  return (
    <div className="insight-card">
      <div className="flex items-center gap-3">
        <span className="insight-icon">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="metric-label text-left">{title}</p>
          <p className="text-sm font-medium text-moss-900 dark:text-parchment truncate mt-0.5">{habit ? `${habit.icon || '🌿'} ${habit.name}` : 'You are keeping every habit on track'}</p>
        </div>
        <span className={`font-mono text-sm font-semibold ${positive ? 'text-bloom-500' : 'text-moss-800 dark:text-moss-100/80'}`}>{value}%</span>
      </div>
      <div className="insight-track"><div style={{ width: `${value}%` }} /></div>
    </div>
  )
}
