import { getChallengeSummary, formatChallengeDate } from '../lib/challenge'

export default function ChallengeCard({ challenge, habits, logsByHabit, onOpen }) {
  if (!challenge) {
    return (
      <section className="challenge-card challenge-empty animate-fade-in mb-5">
        <div className="challenge-card-glow" />
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 sm:p-6">
          <div className="min-w-0">
            <div className="flex items-center gap-2 challenge-kicker"><span>🌱</span> 90 day challenge</div>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-moss-900 dark:text-parchment mt-1.5">Build something that lasts.</h2>
            <p className="text-xs text-moss-500 dark:text-moss-100/55 mt-1.5 max-w-xl">Choose the habits that matter most and keep showing up for the next 90 days.</p>
          </div>
          <button type="button" className="challenge-primary-btn" onClick={onOpen}>Start a challenge <span>→</span></button>
        </div>
      </section>
    )
  }

  const summary = getChallengeSummary(habits, logsByHabit, challenge)
  const endLabel = formatChallengeDate(challenge.end_date, { month: 'short' })

  return (
    <section className="challenge-card animate-fade-in mb-5">
      <div className="challenge-card-glow" />
      <div className="relative p-5 sm:p-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2 challenge-kicker"><span>🌱</span> 90 day challenge</div>
            <div className="flex flex-wrap items-center gap-2.5 mt-1.5">
              <h2 className="font-display text-xl sm:text-2xl font-semibold text-moss-900 dark:text-parchment">{challenge.name}</h2>
              {summary.isFinished && <span className="challenge-status done">Completed</span>}
            </div>
            <p className="text-xs text-moss-500 dark:text-moss-100/55 mt-1">Until {endLabel}</p>
          </div>
          <button type="button" className="challenge-link" onClick={onOpen}>View challenge <span>→</span></button>
        </div>

        <div className="challenge-progress-head mt-5">
          <div><strong>Day {summary.dayNumber || 0} of 90</strong><span>{summary.daysRemaining} days remaining</span></div>
          <strong>{summary.progressPercent}%</strong>
        </div>
        <div className="challenge-progress-track"><div style={{ width: `${summary.progressPercent}%` }} /></div>

        <div className="challenge-mini-grid mt-4">
          <div><span>🔥 Current streak</span><strong>{summary.currentStreak}d</strong></div>
          <div><span>🏆 Best streak</span><strong>{summary.bestStreak}d</strong></div>
          <div><span>✓ Successful days</span><strong>{summary.successfulDays}</strong></div>
          <div><span>✨ Success rate</span><strong>{summary.score}%</strong></div>
        </div>
      </div>
    </section>
  )
}
