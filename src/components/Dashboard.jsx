import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { toDateKey, todayKey } from '../lib/dates'
import HabitCard from './HabitCard'
import AddHabitModal from './AddHabitModal'
import BackdatedEntryModal from './BackdatedEntryModal'
import ThemeToggle from './ThemeToggle'
import StatsPanel from './StatsPanel'
import ConsistencyHeatmap from './ConsistencyHeatmap'

export default function Dashboard({ user, isAdmin, onOpenAdmin }) {
  const [habits, setHabits] = useState([])
  const [logsByHabit, setLogsByHabit] = useState({})
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBackdatedModal, setShowBackdatedModal] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setError('')
    const [habitsRes, logsRes] = await Promise.all([
      supabase.from('habits').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
      supabase.from('habit_logs').select('habit_id, completed_date, status').eq('user_id', user.id),
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

    const grouped = {}
    for (const row of logsRes.data ?? []) {
      if (!grouped[row.habit_id]) grouped[row.habit_id] = new Map()
      grouped[row.habit_id].set(row.completed_date, row.status)
    }

    setHabits(habitsRes.data ?? [])
    setLogsByHabit(grouped)
    setLoading(false)
  }, [user.id])

  useEffect(() => { loadData() }, [loadData])

  async function handleCreateHabit({ name, color, icon, restDays }) {
    const { data, error } = await supabase.from('habits').insert({ name, color, icon, rest_days: restDays, user_id: user.id }).select().single()
    if (error) return setError(error.message)
    setHabits((prev) => [...prev, data])
    setShowAddModal(false)
  }

  async function handleDeleteHabit(habitId) {
    const previous = habits
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
    const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', user.id)
    if (error) {
      setError(error.message)
      setHabits(previous)
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

        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          <button onClick={() => setShowAddModal(true)} className="action-card group">
            <span className="action-icon">＋</span>
            <span className="action-copy"><span className="action-title">Add a habit</span><span className="action-sub">Plant something new</span></span>
            <span className="action-arrow">→</span>
          </button>
          <button onClick={() => setShowBackdatedModal(true)} disabled={loading || habits.length === 0} className="action-card group disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="action-icon">📅</span>
            <span className="action-copy"><span className="action-title">Edit a past day</span><span className="action-sub">Keep your history accurate</span></span>
            <span className="action-arrow">→</span>
          </button>
        </div>

        {!loading && <StatsPanel habits={habits} logsByHabit={logsByHabit} />}
        {!loading && habits.length > 0 && <ConsistencyHeatmap habits={habits} logsByHabit={logsByHabit} />}

        <div className="flex items-end justify-between mb-3.5">
          <div><p className="section-kicker">Daily practice</p><h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">Your habits</h2></div>
          {habits.length > 0 && <span className="pill-count">{habits.length} habit{habits.length === 1 ? '' : 's'}</span>}
        </div>

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
          <div className="grid sm:grid-cols-2 gap-3.5">
            {habits.map((habit) => <HabitCard key={habit.id} habit={habit} statusMap={logsByHabit[habit.id] ?? new Map()} onToggleToday={handleToggleToday} onDelete={handleDeleteHabit} onUpdateRestDays={handleUpdateRestDays} />)}
          </div>
        )}
      </main>

      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} onCreate={handleCreateHabit} />}
      {showBackdatedModal && <BackdatedEntryModal habits={habits} logsByHabit={logsByHabit} onClose={() => setShowBackdatedModal(false)} onSave={handleSaveBackdatedEntries} />}
    </div>
  )
}
