import { completionRate, overallCurrentStreak, overallLongestStreak } from '../lib/dates'

export default function StatsPanel({ habits, logsByHabit }) {
  if (habits.length === 0) return null

  const perfectStreak = overallCurrentStreak(habits, logsByHabit)
  const perfectLongest = overallLongestStreak(habits, logsByHabit)

  const withRates = habits.map((h) => {
    const statusMap = logsByHabit[h.id] ?? new Map()
    return {
      habit: h,
      weekly: completionRate(h, statusMap, 7),
      monthly: completionRate(h, statusMap, 30),
    }
  })

  const weeklyAvg = Math.round(
    withRates.reduce((sum, r) => sum + r.weekly, 0) / withRates.length
  )
  const monthlyAvg = Math.round(
    withRates.reduce((sum, r) => sum + r.monthly, 0) / withRates.length
  )

  const best = withRates.reduce((a, b) => (b.monthly > a.monthly ? b : a))
  const worst = withRates.reduce((a, b) => (b.monthly < a.monthly ? b : a))
  const allPerfect = worst.monthly === 100

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 animate-fade-in">
      <StatCard
        icon="🔥"
        label="Perfect Day Streak"
        value={`${perfectStreak} day${perfectStreak === 1 ? '' : 's'}`}
        sub="all habits, every day"
        highlight
      />
      <StatCard
        icon="🥇"
        label="Longest Perfect Streak"
        value={`${perfectLongest} day${perfectLongest === 1 ? '' : 's'}`}
        sub="last 30 days"
        highlight
      />
      <StatCard icon="📅" label="This Week" value={`${weeklyAvg}%`} />
      <StatCard icon="📆" label="This Month" value={`${monthlyAvg}%`} />
      <StatCard
        icon="🏆"
        label="Best Habit"
        value={best.habit.name}
        sub={`${best.monthly}% this month`}
      />
      <StatCard
        icon={allPerfect ? '🎉' : '⚠️'}
        label={allPerfect ? 'Status' : 'Needs Focus'}
        value={allPerfect ? 'All on track' : worst.habit.name}
        sub={allPerfect ? '' : `${worst.monthly}% this month`}
      />
    </div>
  )
}

function StatCard({ icon, label, value, sub, highlight }) {
  return (
    <div
      className={`rounded-xl2 p-4 text-center animate-pop-in shadow-card dark:shadow-cardDark ${
        highlight
          ? 'bg-moss-600 dark:bg-bloom-500 text-white'
          : 'bg-white dark:bg-moss-900 text-moss-900 dark:text-parchment'
      }`}
    >
      <div className="text-xl mb-1">{icon}</div>
      <div
        className={`text-[11px] uppercase tracking-wide mb-1 ${
          highlight ? 'text-white/70' : 'text-moss-500 dark:text-moss-100/50'
        }`}
      >
        {label}
      </div>
      <div className="font-display font-semibold truncate">{value}</div>
      {sub && (
        <div
          className={`text-[11px] font-mono mt-0.5 ${
            highlight ? 'text-white/60' : 'text-moss-500 dark:text-moss-100/50'
          }`}
        >
          {sub}
        </div>
      )}
    </div>
  )
}
