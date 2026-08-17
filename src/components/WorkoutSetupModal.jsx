import { useMemo, useState } from 'react'
import { generateWorkoutPlan, intensityMeta } from '../lib/workout'
import { findGymHabit } from '../lib/gym'

const FREQUENCIES = [
  { value: 2, title: '2 days', subtitle: 'Full body · more recovery', badge: 'Beginner-friendly' },
  { value: 3, title: '3 days', subtitle: 'Full body · balanced', badge: 'Best default' },
  { value: 4, title: '4 days', subtitle: 'Upper / lower split', badge: 'Great balance' },
  { value: 5, title: '5 days', subtitle: 'More focused sessions', badge: 'Higher commitment' },
  { value: 6, title: '6 days', subtitle: 'Push / pull / legs ×2', badge: 'Advanced schedule' },
]

const INTENSITIES = [
  { value: 'low', icon: '🌿', title: 'Low', subtitle: 'Easier volume and more recovery' },
  { value: 'medium', icon: '⚖️', title: 'Medium', subtitle: 'Balanced training volume' },
  { value: 'high', icon: '🔥', title: 'High', subtitle: 'Higher volume and more work' },
]

function previewText(days, intensity) {
  const plan = generateWorkoutPlan({ daysPerWeek: days, intensity })
  return plan.workout_days.filter((day) => !day.is_rest).slice(0, 3).map((day) => day.name).join(' · ')
}

export default function WorkoutSetupModal({ plan, habits, error: externalError, onClose, onGenerate, onCustomize }) {
  const [days, setDays] = useState(plan?.days_per_week ?? plan?.generator_days_per_week ?? 3)
  const [intensity, setIntensity] = useState(plan?.intensity ?? plan?.generator_intensity ?? 'medium')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(externalError || '')
  const meta = useMemo(() => intensityMeta(intensity), [intensity])
  const gymHabit = findGymHabit(habits)

  async function generate() {
    setSaving(true)
    setError('')
    try {
      const generated = generateWorkoutPlan({ daysPerWeek: days, intensity, linkedHabitId: gymHabit?.id ?? plan?.linked_habit_id ?? null })
      await onGenerate(generated)
    } catch (err) {
      setError(err.message || 'Could not create your workout plan.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-5">
      <button aria-label="Close gym setup" className="modal-backdrop-button" onClick={onClose} />
      <div className="relative w-full sm:max-w-3xl max-h-[95vh] overflow-y-auto modal-card animate-pop-in rounded-t-[24px] sm:rounded-[24px]">
        <div className="modal-header sticky top-0 z-20">
          <div>
            <p className="section-kicker">Smart gym setup</p>
            <h2 className="font-display text-xl sm:text-2xl font-semibold text-moss-900 dark:text-parchment mt-1">Build my workout plan</h2>
            <p className="text-xs text-moss-400 dark:text-moss-100/45 mt-1">Pick how often and how hard you want to train. Sprout creates the weekly routine for you.</p>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close">×</button>
        </div>

        <div className="modal-body guided-workout-setup">
          {error && <div className="error-banner workout-planner-error">{error}</div>}

          <section className="guided-hero">
            <div className="guided-hero-icon">🏋️</div>
            <div>
              <span className="section-kicker">Recommended setup</span>
              <h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">You choose the effort. Sprout handles the split.</h3>
              <p className="text-xs text-moss-500 dark:text-moss-100/55 mt-1.5">Your plan is built from predefined exercise routines, then saved so today's workout appears automatically.</p>
            </div>
          </section>

          <section>
            <div className="guided-section-head"><div><p className="section-kicker">1 · Training frequency</p><h3 className="guided-section-title">How many days per week?</h3></div><span className="guided-selection-pill">{days} days</span></div>
            <div className="guided-frequency-grid">
              {FREQUENCIES.map((option) => {
                const selected = days === option.value
                return (
                  <button key={option.value} type="button" onClick={() => setDays(option.value)} className={`guided-choice ${selected ? 'selected' : ''}`}>
                    <div className="guided-choice-top"><strong>{option.title}</strong>{selected && <span className="guided-check">✓</span>}</div>
                    <span>{option.subtitle}</span>
                    <small>{option.badge}</small>
                  </button>
                )
              })}
            </div>
          </section>

          <section>
            <div className="guided-section-head"><div><p className="section-kicker">2 · Training intensity</p><h3 className="guided-section-title">How hard do you want to train?</h3></div><span className={`guided-intensity-pill ${meta.tone}`}>{meta.label}</span></div>
            <div className="guided-intensity-grid">
              {INTENSITIES.map((option) => {
                const selected = intensity === option.value
                return (
                  <button key={option.value} type="button" onClick={() => setIntensity(option.value)} className={`guided-intensity ${selected ? 'selected' : ''}`}>
                    <span className="guided-intensity-icon">{option.icon}</span>
                    <span className="min-w-0"><strong>{option.title}</strong><small>{option.subtitle}</small></span>
                    {selected && <span className="guided-check">✓</span>}
                  </button>
                )
              })}
            </div>
            <p className="guided-helper">{meta.description}</p>
          </section>

          <section className="guided-preview-card">
            <div className="guided-preview-head"><div><p className="section-kicker">Your generated week</p><h3 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-1">{days}-day · {meta.label} intensity</h3></div><span className="guided-auto-pill">Auto-built</span></div>
            <div className="guided-preview-line"><span>Example split</span><strong>{previewText(days, intensity)}</strong></div>
            <div className="guided-preview-grid">
              {generateWorkoutPlan({ daysPerWeek: days, intensity }).workout_days.map((day) => (
                <div key={day.day_of_week} className={`guided-day-preview ${day.is_rest ? 'rest' : ''}`}>
                  <span>{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][day.day_of_week]}</span>
                  <strong>{day.is_rest ? 'Rest' : day.name}</strong>
                  {!day.is_rest && <small>{day.workout_exercises.length} exercises</small>}
                </div>
              ))}
            </div>
          </section>

          {gymHabit ? (
            <div className="guided-link-note">🌱 Your existing <strong>{gymHabit.name}</strong> habit will be linked automatically. Finishing a workout marks that habit complete for the same date.</div>
          ) : (
            <div className="guided-link-note">💡 Add a habit named <strong>Gym</strong> later and you can link it from the workout planner.</div>
          )}

          <div className="guided-footer">
            <button type="button" className="secondary-btn" onClick={onClose}>Cancel</button>
            {plan && <button type="button" className="workout-secondary-btn" onClick={onCustomize}>Customize after generation</button>}
            <button type="button" className="workout-primary-btn" disabled={saving} onClick={generate}>{saving ? 'Building your plan…' : plan ? 'Replace my plan →' : 'Generate my plan →'}</button>
          </div>
        </div>
      </div>
    </div>
  )
}
