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
    return {
      habit: h,
      weekly: completionRate(h, statusMap, 7),
      monthly: completionRate(h, statusMap, 30),
    }
  })

  const weeklyAvg = Math.round(withRates.reduce((sum, r) => sum + r.weekly, 0) / withRates.length)
  const monthlyAvg = Math.round(withRates.reduce((sum, r) => sum + r.monthly, 0) / withRates.length)
  const best = withRates.reduce((a, b) => (b.monthly > a.monthly ? b : a))
  const worst = withRates.reduce((a, b) => (b.monthly < a.monthly ? b : a))
  const allPerfect = worst.monthly === 100

  return (
    <section className="mb-6 animate-fade-in">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard icon="🔥" label="Current streak" value={`${perfectStreak}d`} sub={currentBadge.current ? `${currentBadge.current.icon} ${currentBadge.current.label}` : 'perfect days'} accent />
        <MetricCard icon="🏆" label="Best streak" value={`${perfectLongest}d`} sub={longestBadge.current ? `${longestBadge.current.icon} ${longestBadge.current.label}` : 'all-time'} />
        <MetricCard icon="📅" label="This week" value={`${weeklyAvg}%`} sub="7-day consistency" />
        <MetricCard icon="✨" label="This month" value={`${monthlyAvg}%`} sub="30-day consistency" />
      </div>

      <div className="grid sm:grid-cols-2 gap-3 mt-3">
        <ProgressInsight icon="🌱" title="Strongest habit" habit={best.habit} value={best.monthly} />
        <ProgressInsight icon={allPerfect ? '🎉' : '🎯'} title={allPerfect ? 'Everything is on track' : 'Needs a little focus'} habit={allPerfect ? null : worst.habit} value={allPerfect ? 100 : worst.monthly} positive={allPerfect} />
      </div>
    </section>
  )
}

function MetricCard({ icon, label, value, sub, accent }) {
  return (
    <div className={`rounded-2xl p-4 sm:p-5 shadow-card dark:shadow-cardDark ${accent ? 'bg-moss-600 dark:bg-bloom-500 text-white' : 'bg-white dark:bg-moss-900 text-moss-900 dark:text-parchment'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-lg">{icon}</span>
        <span className={`text-[10px] uppercase tracking-[0.12em] ${accent ? 'text-white/60' : 'text-moss-400 dark:text-moss-100/35'}`}>{label}</span>
      </div>
      <div className="font-display text-2xl sm:text-3xl font-semibold mt-3">{value}</div>
      <div className={`text-[10px] font-mono mt-1 ${accent ? 'text-white/65' : 'text-moss-500 dark:text-moss-100/45'}`}>{sub}</div>
    </div>
  )
}

function ProgressInsight({ icon, title, habit, value, positive }) {
  return (
    <div className="rounded-2xl bg-white dark:bg-moss-900 shadow-card dark:shadow-cardDark p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <span className="h-9 w-9 rounded-xl bg-parchment dark:bg-moss-950 flex items-center justify-center">{icon}</span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase tracking-[0.12em] text-moss-400 dark:text-moss-100/35">{title}</p>
          <p className="text-sm font-medium text-moss-900 dark:text-parchment truncate mt-0.5">{habit ? `${habit.icon || '🌿'} ${habit.name}` : 'You are keeping every habit on track'}</p>
        </div>
        <span className={`font-mono text-sm font-semibold ${positive ? 'text-bloom-500' : 'text-moss-700 dark:text-moss-100/80'}`}>{value}%</span>
      </div>
      <div className="mt-3 h-1.5 rounded-full bg-moss-100 dark:bg-moss-800 overflow-hidden">
        <div className="h-full rounded-full bg-moss-600 dark:bg-bloom-500 transition-all duration-500" style={{ width: `${value}%` }} />
      </div>
    </div>
  )
}
