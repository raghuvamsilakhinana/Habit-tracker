import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toDateKey, todayKey } from '../lib/dates'
import HabitCard from './HabitCard'
import AddHabitModal from './AddHabitModal'
import BackdatedEntryModal from './BackdatedEntryModal'
import ThemeToggle from './ThemeToggle'
import StatsPanel from './StatsPanel'
import ConsistencyHeatmap from './ConsistencyHeatmap'
import HistoryCalendar from './HistoryCalendar'
import HabitDetailModal from './HabitDetailModal'
import WeeklyReview from './WeeklyReview'
import ChallengeCard from './ChallengeCard'
import ChallengeModal from './ChallengeModal'
import WorkoutCard from './WorkoutCard'
import WorkoutSetupModal from './WorkoutSetupModal'
import WorkoutPlannerModal from './WorkoutPlannerModal'
import WorkoutSessionModal from './WorkoutSessionModal'
import WorkoutHistoryModal from './WorkoutHistoryModal'
import { getWorkoutDayForDate } from '../lib/workout'
import { findGymHabit } from '../lib/gym'

export default function Dashboard({ user, isAdmin, onOpenAdmin }) {
  const [habits, setHabits] = useState([])
  const [logsByHabit, setLogsByHabit] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBackdatedModal, setShowBackdatedModal] = useState(false)
  const [backdatedInitialDate, setBackdatedInitialDate] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [detailHabit, setDetailHabit] = useState(null)
  const [challenge, setChallenge] = useState(null)
  const [showChallengeModal, setShowChallengeModal] = useState(false)
  const [challengeSetupError, setChallengeSetupError] = useState('')
  const [challengeAvailable, setChallengeAvailable] = useState(true)
  const [workoutAvailable, setWorkoutAvailable] = useState(true)
  const [workoutPlan, setWorkoutPlan] = useState(null)
  const [workoutSessions, setWorkoutSessions] = useState([])
  const [workoutSets, setWorkoutSets] = useState([])
  const [showWorkoutSetup, setShowWorkoutSetup] = useState(false)
  const [showWorkoutPlanner, setShowWorkoutPlanner] = useState(false)
  const [showWorkoutHistory, setShowWorkoutHistory] = useState(false)
  const [showWorkoutSession, setShowWorkoutSession] = useState(false)
  const [workoutSessionContext, setWorkoutSessionContext] = useState(null)
  const [workoutSetupError, setWorkoutSetupError] = useState('')
  const [error, setError] = useState('')
  const [workoutExpanded, setWorkoutExpanded] = useState(false)
  const [dailyPracticeExpanded, setDailyPracticeExpanded] = useState(false)

  const loadData = useCallback(async () => {
    setError('')
    // Workout data is intentionally loaded only when the user has a Gym habit.
    // This keeps the Gym module completely optional for users who don't track Gym.
    const [habitsRes, logsRes, challengeRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('habit_id, completed_date, status').eq('user_id', user.id),
      supabase.from('challenges').select('*').eq('user_id', user.id).eq('status', 'active').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ])

    if (habitsRes.error) {
      setError(habitsRes.error.message)
      setLoading(false)
      return
    }
    if (logsRes.error) {
      setError(logsRes.error.message)
      setLoading(false)
      return
    }
    if (challengeRes.error) {
      if (challengeRes.error.code === '42P01' || challengeRes.error.message?.includes('relation') && challengeRes.error.message?.includes('challenges')) {
        setChallengeAvailable(false)
        setChallenge(null)
      } else {
        setError(challengeRes.error.message)
      }
    } else {
      setChallengeAvailable(true)
      const active = challengeRes.data ?? null
      if (active && active.end_date < todayKey()) {
        const { error: finishError } = await supabase.from('challenges').update({ status: 'completed' }).eq('id', active.id).eq('user_id', user.id)
        if (finishError) setError(finishError.message)
        setChallenge(null)
      } else {
        setChallenge(active)
      }
    }

    const grouped = {}
    for (const row of logsRes.data ?? []) {
      if (!grouped[row.habit_id]) grouped[row.habit_id] = new Map()
      grouped[row.habit_id].set(row.completed_date, row.status)
    }

    const loadedHabits = habitsRes.data ?? []
    setHabits(loadedHabits)
    setLogsByHabit(grouped)

    const gymEnabledForUser = Boolean(findGymHabit(loadedHabits))
    if (!gymEnabledForUser) {
      // No Gym habit: don't query workout tables and don't expose Gym state/UI.
      setWorkoutAvailable(false)
      setWorkoutPlan(null)
      setWorkoutSessions([])
      setWorkoutSets([])
    } else {
      const workoutPlanRes = await supabase.from('workout_plans').select('*, workout_days(*, workout_exercises(*))').eq('user_id', user.id).eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
      const workoutMessage = workoutPlanRes.error?.message || ''
      const workoutMissing = workoutPlanRes.error && (workoutPlanRes.error.code === '42P01' || workoutPlanRes.error.code === 'PGRST205' || workoutMessage.includes('relation') && workoutMessage.includes('workout_') || workoutMessage.includes('Could not find the table'))
      if (workoutPlanRes.error && !workoutMissing) {
        setError(workoutPlanRes.error.message)
      }
      setWorkoutAvailable(!workoutMissing)

      if (!workoutMissing) {
        let activePlan = workoutPlanRes.data ?? null
        const currentGymHabit = findGymHabit(loadedHabits)
        if (activePlan && currentGymHabit && activePlan.linked_habit_id !== currentGymHabit.id) {
          const { error: linkError } = await supabase.from('workout_plans').update({ linked_habit_id: currentGymHabit.id, updated_at: new Date().toISOString() }).eq('id', activePlan.id).eq('user_id', user.id)
          if (linkError) setError(linkError.message)
          else activePlan = { ...activePlan, linked_habit_id: currentGymHabit.id }
        }
        setWorkoutPlan(activePlan)
        const sessionsRes = await supabase.from('workout_sessions').select('id, workout_day_id, workout_date, completed_at, notes').eq('user_id', user.id).order('workout_date', { ascending: false }).limit(120)
        if (sessionsRes.error) {
          setError(sessionsRes.error.message)
          setWorkoutSessions([])
          setWorkoutSets([])
        } else {
          const sessions = sessionsRes.data ?? []
          setWorkoutSessions(sessions)
          if (sessions.length) {
            const setsRes = await supabase.from('workout_sets').select('id, session_id, exercise_id, set_number, weight_kg, reps, completed').in('session_id', sessions.map((session) => session.id))
            if (setsRes.error) setError(setsRes.error.message)
            setWorkoutSets(setsRes.data ?? [])
          } else {
            setWorkoutSets([])
          }
        }
      } else {
        setWorkoutPlan(null)
        setWorkoutSessions([])
        setWorkoutSets([])
      }
    }

    setLoading(false)
  }, [user.id])

  useEffect(() => { loadData() }, [loadData])

  async function handleCreateHabit({ name, color, icon, restDays }) {
    const { data, error } = await supabase.from('habits').insert({ name, color, icon, rest_days: restDays, user_id: user.id }).select().single()
    if (error) return setError(error.message)
    setHabits((prev) => [...prev, data])
    setShowAddModal(false)
    // Re-run the normal loader so adding a Gym habit immediately activates
    // the Gym module and loads any previously saved workout plan/history.
    if (findGymHabit([data])) await loadData()
  }

  async function handleDeleteHabit(habitId) {
    const previous = habits
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
    const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', user.id)
    if (error) {
      setError(error.message)
      setHabits(previous)
      return
    }
    if (findGymHabit(previous)?.id === habitId) {
      setShowWorkoutSetup(false)
      setShowWorkoutPlanner(false)
      setShowWorkoutHistory(false)
      setShowWorkoutSession(false)
      setWorkoutSessionContext(null)
      setWorkoutPlan(null)
      setWorkoutSessions([])
      setWorkoutSets([])
      setWorkoutAvailable(false)
    }
  }

  async function handleUpdateRestDays(habitId, restDays) {
    const previous = habits
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, rest_days: restDays } : h)))
    const { error } = await supabase.from('habits').update({ rest_days: restDays }).eq('id', habitId).eq('user_id', user.id)
    if (error) {
      setError(error.message)
      setHabits(previous)
    }
  }

  async function handleToggleToday(habit, dateKey, currentStatus) {
    const nextStatus = !currentStatus ? 'completed' : currentStatus === 'completed' ? 'partial' : null

    setLogsByHabit((prev) => {
      const next = { ...prev }
      const map = new Map(next[habit.id] ?? [])
      if (nextStatus) map.set(dateKey, nextStatus)
      else map.delete(dateKey)
      next[habit.id] = map
      return next
    })

    if (nextStatus) {
      const { error } = await supabase.from('habit_logs').upsert(
        { habit_id: habit.id, completed_date: dateKey, status: nextStatus, user_id: user.id },
        { onConflict: 'habit_id,completed_date' },
      )
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habit.id).eq('completed_date', dateKey).eq('user_id', user.id)
      if (error) setError(error.message)
    }
  }

  async function handleSaveBackdatedEntries(dateKey, draft) {
    if (dateKey > toDateKey(new Date())) throw new Error('Backdated entries can only be saved for today or an earlier date.')

    const toDelete = []
    const toUpsert = []
    for (const habit of habits) {
      const status = draft[habit.id]
      if (status === 'completed' || status === 'partial') {
        toUpsert.push({ habit_id: habit.id, completed_date: dateKey, status, user_id: user.id })
      } else {
        toDelete.push(habit.id)
      }
    }

    if (toUpsert.length) {
      const { error } = await supabase.from('habit_logs').upsert(toUpsert, { onConflict: 'habit_id,completed_date' })
      if (error) throw error
    }
    for (const habitId of toDelete) {
      const { error } = await supabase.from('habit_logs').delete().eq('habit_id', habitId).eq('completed_date', dateKey).eq('user_id', user.id)
      if (error) throw error
    }

    await loadData()
  }

  async function handleSaveWorkoutPlan(draft) {
    if (!workoutAvailable) {
      const message = 'Gym workout tracking is not set up yet. Run workout-setup.sql once in Supabase, then reload the app.'
      setWorkoutSetupError(message)
      throw new Error(message)
    }

    let planId = workoutPlan?.id
    const gymHabitForSave = findGymHabit(habits)
    const daysPerWeek = draft.days_per_week ?? draft.generator_days_per_week ?? null
    const planIntensity = draft.intensity ?? draft.generator_intensity ?? null
    if (!gymHabitForSave) {
      const message = 'Add a habit named Gym before creating a workout plan.'
      setWorkoutSetupError(message)
      throw new Error(message)
    }
    if (!planId) {
      const payload = {
        user_id: user.id,
        name: draft.name.trim(),
        linked_habit_id: gymHabitForSave.id,
        is_active: true,
      }
      if (daysPerWeek) payload.days_per_week = Number(daysPerWeek)
      if (planIntensity) payload.intensity = planIntensity
      const { data, error } = await supabase.from('workout_plans').insert(payload).select().single()
      if (error) throw error
      planId = data.id
    } else {
      const payload = {
        name: draft.name.trim(),
        linked_habit_id: gymHabitForSave.id,
        updated_at: new Date().toISOString(),
      }
      if (daysPerWeek) payload.days_per_week = Number(daysPerWeek)
      if (planIntensity) payload.intensity = planIntensity
      const { error } = await supabase.from('workout_plans').update(payload).eq('id', planId).eq('user_id', user.id)
      if (error) throw error
    }

    for (const day of draft.workout_days) {
      const existingDay = workoutPlan?.workout_days?.find((item) => item.day_of_week === day.day_of_week)
      let dayId = day.id
      if (dayId && String(dayId).startsWith('local-')) dayId = null
      if (!dayId) dayId = existingDay?.id ?? null
      if (dayId) {
        const { error } = await supabase.from('workout_days').update({ name: day.name?.trim() || 'Workout', focus: day.focus?.trim() || null, is_rest: Boolean(day.is_rest) }).eq('id', dayId).eq('plan_id', planId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('workout_days').insert({ plan_id: planId, day_of_week: day.day_of_week, name: day.name?.trim() || 'Workout', focus: day.focus?.trim() || null, is_rest: Boolean(day.is_rest) }).select().single()
        if (error) throw error
        dayId = data.id
      }

      const activeIds = []
      for (const [index, exercise] of (day.workout_exercises ?? []).filter((item) => item.is_active !== false).entries()) {
        const existingId = exercise.id && !String(exercise.id).startsWith('local-') ? exercise.id : null
        const payload = {
          workout_day_id: dayId,
          exercise_name: exercise.exercise_name?.trim() || `Exercise ${index + 1}`,
          exercise_order: index,
          target_sets: Math.max(1, Number(exercise.target_sets) || 1),
          target_rep_min: Math.max(1, Number(exercise.target_rep_min) || 1),
          target_rep_max: Math.max(1, Number(exercise.target_rep_max) || Number(exercise.target_rep_min) || 1),
          is_active: true,
        }
        if (existingId) {
          const { error } = await supabase.from('workout_exercises').update(payload).eq('id', existingId).eq('workout_day_id', dayId)
          if (error) throw error
          activeIds.push(existingId)
        } else {
          const { data, error } = await supabase.from('workout_exercises').insert(payload).select().single()
          if (error) throw error
          activeIds.push(data.id)
        }
      }

      const oldExercises = existingDay?.workout_exercises ?? []
      const staleIds = oldExercises.filter((exercise) => exercise.is_active !== false && !activeIds.includes(exercise.id)).map((exercise) => exercise.id)
      if (staleIds.length) {
        const { error } = await supabase.from('workout_exercises').update({ is_active: false }).in('id', staleIds).eq('workout_day_id', dayId)
        if (error) throw error
      }
    }

    setShowWorkoutPlanner(false)
    setWorkoutSetupError('')
    await loadData()
  }

  async function handleGenerateWorkoutPlan(generatedPlan) {
    await handleSaveWorkoutPlan(generatedPlan)
    setShowWorkoutSetup(false)
  }

  function openWorkoutSession(dateKey = today, dayOverride = null, sessionOverride = null) {
    if (!workoutPlan) {
      setWorkoutSetupError('Set up your weekly workout plan first.')
      setShowWorkoutPlanner(true)
      return
    }
    const day = dayOverride || getWorkoutDayForDate(workoutPlan, dateKey)
    if (!day || day.is_rest) return
    const session = sessionOverride || workoutSessions.find((item) => item.workout_date === dateKey) || null
    setWorkoutSessionContext({ dateKey, day, session })
    setShowWorkoutSession(true)
  }

  async function handleSaveWorkoutSession({ dateKey, dayId, sessionId, rows, notes, finish }) {
    if (dateKey > todayKey()) throw new Error('Future workouts cannot be logged.')
    const completedRows = rows.filter((row) => row.completed && row.reps !== null && Number(row.reps) > 0)
    if (finish && completedRows.length === 0) throw new Error('Log at least one set before finishing the workout.')

    const existing = sessionId ? workoutSessions.find((item) => item.id === sessionId) : workoutSessions.find((item) => item.workout_date === dateKey)
    const completedAt = finish ? new Date().toISOString() : existing?.completed_at ?? null
    const { data: savedSession, error: sessionError } = await supabase.from('workout_sessions').upsert({
      ...(existing?.id ? { id: existing.id } : {}),
      user_id: user.id,
      workout_day_id: dayId,
      workout_date: dateKey,
      completed_at: completedAt,
      notes: notes?.trim() || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,workout_date' }).select().single()
    if (sessionError) throw sessionError

    const { error: deleteSetError } = await supabase.from('workout_sets').delete().eq('session_id', savedSession.id)
    if (deleteSetError) throw deleteSetError
    if (completedRows.length) {
      const payload = completedRows.map((row) => ({ session_id: savedSession.id, exercise_id: row.exercise_id, set_number: row.set_number, weight_kg: row.weight_kg, reps: row.reps, completed: true }))
      const { error: setError } = await supabase.from('workout_sets').insert(payload)
      if (setError) throw setError
    }

    const linkedHabitId = workoutPlan?.linked_habit_id
    if (finish && linkedHabitId) {
      const { error: habitError } = await supabase.from('habit_logs').upsert({ habit_id: linkedHabitId, completed_date: dateKey, status: 'completed', user_id: user.id }, { onConflict: 'habit_id,completed_date' })
      if (habitError) throw habitError
    }

    setShowWorkoutSession(false)
    setWorkoutSessionContext(null)
    await loadData()
  }

  function openPastWorkout(dateKey) {
    if (!workoutPlan) return
    const day = getWorkoutDayForDate(workoutPlan, dateKey)
    if (!day || day.is_rest) {
      setWorkoutSetupError('That day is a rest day in your current plan. Change the plan first if you want to log a workout there.')
      return
    }
    setShowWorkoutHistory(false)
    openWorkoutSession(dateKey, day, workoutSessions.find((session) => session.workout_date === dateKey) || null)
  }

  async function handleCreateChallenge({ name, startDate, targetPercent, selectedHabitIds }) {
    setChallengeSetupError('')
    if (!challengeAvailable) {
      const message = '90-day challenges are not set up in Supabase yet. Run 90-day-challenge-setup.sql once, then reload the app.'
      setChallengeSetupError(message)
      throw new Error(message)
    }
    if (challenge) {
      const message = 'You already have an active 90-day challenge.'
      setChallengeSetupError(message)
      throw new Error(message)
    }
    const endDate = (() => {
      const d = new Date(`${startDate}T12:00:00`)
      d.setDate(d.getDate() + 89)
      return toDateKey(d)
    })()
    const { data, error } = await supabase.from('challenges').insert({
      user_id: user.id,
      name,
      start_date: startDate,
      end_date: endDate,
      selected_habit_ids: selectedHabitIds,
      target_percent: targetPercent,
      status: 'active',
    }).select().single()
    if (error) {
      const message = error.code === '42P01' ? 'The challenges table is missing. Run 90-day-challenge-setup.sql in Supabase and try again.' : error.message
      setChallengeSetupError(message)
      throw new Error(message)
    }
    setChallenge(data)
    setChallengeAvailable(true)
    setShowChallengeModal(false)
  }

  function openBackdated(dateKey = null) {
    setBackdatedInitialDate(dateKey)
    setShowBackdatedModal(true)
  }

  function editHistoryDate(dateKey) {
    setShowHistory(false)
    setDetailHabit(null)
    openBackdated(dateKey)
  }

  const today = todayKey()
  const completedToday = habits.filter((habit) => logsByHabit[habit.id]?.get(today) === 'completed').length
  const partialToday = habits.filter((habit) => logsByHabit[habit.id]?.get(today) === 'partial').length
  const todayCompletion = habits.length
    ? Math.round((habits.reduce((sum, habit) => {
        const status = logsByHabit[habit.id]?.get(today)
        return sum + (status === 'completed' ? 1 : status === 'partial' ? 0.5 : 0)
      }, 0) / habits.length) * 100)
    : 0
  const remainingToday = Math.max(habits.length - completedToday - partialToday, 0)
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
  const todayMessage = todayCompletion === 100
    ? 'Everything is done. Beautiful work.'
    : todayCompletion >= 70
      ? 'You are having a strong day. Keep going.'
      : todayCompletion > 0
        ? 'You have started. One more small win.'
        : 'A few small wins can change the day.'

  const gymHabit = findGymHabit(habits)
  const gymEnabled = Boolean(gymHabit)
  const todayWorkoutDay = gymEnabled ? getWorkoutDayForDate(workoutPlan, today) : null
  const todayWorkoutSession = gymEnabled ? (workoutSessions.find((session) => session.workout_date === today) ?? null) : null
  const todayWorkoutSets = todayWorkoutSession ? workoutSets.filter((set) => set.session_id === todayWorkoutSession.id) : []

  return (
    <div className="min-h-screen bg-parchment dark:bg-moss-950 transition-colors duration-300">
      <header className="app-shell-wide px-4 sm:px-6 pt-5 sm:pt-7 pb-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="brand-mark">🌱</span>
            <div className="min-w-0">
              <h1 className="font-display text-xl sm:text-2xl font-semibold text-moss-900 dark:text-parchment">Sprout</h1>
              <p className="text-[11px] sm:text-xs text-moss-400 dark:text-moss-100/50 mt-0.5">Small actions. Stronger days.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && <button onClick={onOpenAdmin} className="top-link hidden sm:block">Admin</button>}
            <ThemeToggle />
            <button onClick={() => supabase.auth.signOut()} className="top-link">Log out</button>
          </div>
        </div>
      </header>

      <main className="app-shell-wide px-4 sm:px-6 pb-16">
        {error && <div className="error-banner mb-4 animate-fade-in">{error}</div>}

        <section className="today-hero animate-fade-in mb-4 sm:mb-5">
          <div className="hero-glow hero-glow-one" />
          <div className="hero-glow hero-glow-two" />
          <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-5 p-5 sm:p-6">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-white/60 text-[10px] font-mono uppercase tracking-[0.18em]">
                <span className="h-1.5 w-1.5 rounded-full bg-bloom-400 shadow-[0_0_0_4px_rgba(241,122,97,.12)]" />
                Today
              </div>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold text-white mt-2 leading-tight">{dateLabel}</h2>
              <p className="text-sm text-white/65 mt-1.5 max-w-lg">{todayMessage}</p>
            </div>
            <div className="flex items-center gap-4 sm:gap-5 self-start sm:self-auto">
              <div className="progress-ring" style={{ '--ring-progress': `${todayCompletion * 3.6}deg` }}>
                <div className="progress-ring-inner"><span>{todayCompletion}%</span></div>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-1 gap-3 sm:gap-1.5 text-[11px] sm:text-xs text-white/55 min-w-[140px]">
                <div><strong>{completedToday}</strong> done</div>
                <div><strong>{partialToday}</strong> partial</div>
                <div><strong>{remainingToday}</strong> left</div>
              </div>
            </div>
          </div>
          <div className="relative h-1 bg-white/8"><div className="h-full bg-bloom-400 transition-all duration-700" style={{ width: `${todayCompletion}%` }} /></div>
        </section>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          <button onClick={() => setShowAddModal(true)} className="action-card group">
            <span className="action-icon">＋</span>
            <span className="action-copy"><span className="action-title">Add a habit</span><span className="action-sub">Plant something new</span></span>
            <span className="action-arrow">→</span>
          </button>
          <button onClick={() => openBackdated()} disabled={loading || habits.length === 0} className="action-card group disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="action-icon">📅</span>
            <span className="action-copy"><span className="action-title">Edit a past day</span><span className="action-sub">Keep your history accurate</span></span>
            <span className="action-arrow">→</span>
          </button>
          <button onClick={() => setShowHistory(true)} disabled={loading || habits.length === 0} className="action-card group disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="action-icon">🗓️</span>
            <span className="action-copy"><span className="action-title">View history</span><span className="action-sub">Explore your consistency</span></span>
            <span className="action-arrow">→</span>
          </button>
          <button onClick={() => { setChallengeSetupError(''); setShowChallengeModal(true) }} disabled={loading || habits.length === 0} className="action-card group disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="action-icon">🌱</span>
            <span className="action-copy"><span className="action-title">90 day challenge</span><span className="action-sub">Grow with a clear target</span></span>
            <span className="action-arrow">→</span>
          </button>
        </div>

        {!loading && gymEnabled && <WorkoutCard
          plan={workoutPlan}
          workoutDay={todayWorkoutDay}
          dateKey={today}
          session={todayWorkoutSession}
          sessionSets={todayWorkoutSets}
          available={workoutAvailable}
          onOpenPlan={() => { setWorkoutSetupError(''); setShowWorkoutSetup(true) }}
          onCustomizePlan={() => { setWorkoutSetupError(''); setShowWorkoutPlanner(true) }}
          onStart={() => openWorkoutSession(today)}
          onHistory={() => setShowWorkoutHistory(true)}
          expanded={workoutExpanded}
          onToggleExpanded={() => setWorkoutExpanded((value) => !value)}
        />}
        {!loading && <ChallengeCard challenge={challenge} habits={habits} logsByHabit={logsByHabit} onOpen={() => { setChallengeSetupError(''); setShowChallengeModal(true) }} />}
        {!loading && <StatsPanel habits={habits} logsByHabit={logsByHabit} />}
        {!loading && habits.length > 0 && <WeeklyReview habits={habits} logsByHabit={logsByHabit} />}
        {!loading && habits.length > 0 && <ConsistencyHeatmap habits={habits} logsByHabit={logsByHabit} />}

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-3.5">{[1, 2, 3, 4].map((i) => <div key={i} className="skeleton-card" />)}</div>
        ) : habits.length === 0 ? (
          <div className="empty-state animate-fade-in">
            <span className="text-4xl mb-3">🌱</span>
            <p className="font-display text-xl text-moss-800 dark:text-parchment">Nothing planted yet</p>
            <p className="text-sm text-moss-400 dark:text-moss-100/55 mt-1 max-w-sm mx-auto">Start with one small habit. You can always grow from there.</p>
            <button onClick={() => setShowAddModal(true)} className="primary-btn mt-5">Add your first habit</button>
          </div>
        ) : (
          <section className={`daily-practice-panel ${dailyPracticeExpanded ? 'is-expanded' : ''} animate-fade-in`}>
            <button type="button" className="daily-practice-summary" onClick={() => setDailyPracticeExpanded((value) => !value)} aria-expanded={dailyPracticeExpanded}>
              <span className="daily-practice-icon">🌱</span>
              <span className="daily-practice-copy">
                <span className="section-kicker">Daily practice</span>
                <span className="daily-practice-title">Your habits</span>
                <span className="daily-practice-meta">{completedToday + partialToday} of {habits.length} updated today · {remainingToday} remaining</span>
              </span>
              <span className="daily-practice-progress">
                <strong>{todayCompletion}%</strong>
                <span className="daily-practice-progress-track"><span style={{ width: `${todayCompletion}%` }} /></span>
              </span>
              <span className="daily-practice-arrow" aria-hidden="true">{dailyPracticeExpanded ? '⌃' : '⌄'}</span>
            </button>

            <div className="daily-practice-content">
              <div className="daily-practice-inner">
                <div className="daily-practice-toolbar">
                  <div>
                    <p className="section-kicker">Today</p>
                    <h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">Record your small wins.</h2>
                  </div>
                  <span className="pill-count">{habits.length} habit{habits.length === 1 ? '' : 's'}</span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3.5 daily-practice-habit-grid">
                  {habits.map((habit) => <HabitCard key={habit.id} habit={habit} statusMap={logsByHabit[habit.id] ?? new Map()} onToggleToday={handleToggleToday} onDelete={handleDeleteHabit} onUpdateRestDays={handleUpdateRestDays} onOpenDetail={setDetailHabit} />)}
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {gymEnabled && showWorkoutSetup && <WorkoutSetupModal plan={workoutPlan} habits={habits} error={workoutSetupError} onClose={() => setShowWorkoutSetup(false)} onGenerate={handleGenerateWorkoutPlan} onCustomize={() => { setShowWorkoutSetup(false); setShowWorkoutPlanner(true) }} />}
      {gymEnabled && showWorkoutPlanner && <WorkoutPlannerModal plan={workoutPlan} habits={habits} error={workoutSetupError} onClose={() => setShowWorkoutPlanner(false)} onSave={handleSaveWorkoutPlan} />}
      {gymEnabled && showWorkoutSession && workoutSessionContext && <WorkoutSessionModal
        day={workoutSessionContext.day}
        dateKey={workoutSessionContext.dateKey}
        session={workoutSessionContext.session}
        existingSets={workoutSessionContext.session ? workoutSets.filter((set) => set.session_id === workoutSessionContext.session.id) : []}
        allSessions={workoutSessions}
        allSets={workoutSets}
        linkedHabitName={habits.find((habit) => habit.id === workoutPlan?.linked_habit_id)?.name}
        onClose={() => { setShowWorkoutSession(false); setWorkoutSessionContext(null) }}
        onSave={handleSaveWorkoutSession}
      />}
      {gymEnabled && showWorkoutHistory && <WorkoutHistoryModal plan={workoutPlan} sessions={workoutSessions} sets={workoutSets} onClose={() => setShowWorkoutHistory(false)} onEditSession={(session) => { setShowWorkoutHistory(false); const day = workoutPlan?.workout_days?.find((item) => item.id === session.workout_day_id); if (day) openWorkoutSession(session.workout_date, day, session) }} onLogPast={(date) => openPastWorkout(date)} />}
      {showChallengeModal && <ChallengeModal challenge={challenge} habits={habits} logsByHabit={logsByHabit} setupError={challengeSetupError} onClose={() => setShowChallengeModal(false)} onCreate={handleCreateChallenge} onEditDate={(dateKey) => { setShowChallengeModal(false); openBackdated(dateKey) }} />}
      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} onCreate={handleCreateHabit} />}
      {showBackdatedModal && <BackdatedEntryModal habits={habits} logsByHabit={logsByHabit} initialDate={backdatedInitialDate} onClose={() => { setShowBackdatedModal(false); setBackdatedInitialDate(null) }} onSave={handleSaveBackdatedEntries} />}
      {showHistory && <HistoryCalendar habits={habits} logsByHabit={logsByHabit} onClose={() => setShowHistory(false)} onEditDate={editHistoryDate} />}
      {detailHabit && <HabitDetailModal habit={detailHabit} statusMap={logsByHabit[detailHabit.id] ?? new Map()} onClose={() => setDetailHabit(null)} onEditDate={editHistoryDate} />}
    </div>
  )
}
