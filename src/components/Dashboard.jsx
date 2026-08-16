import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { lastNDateKeys, toDateKey } from '../lib/dates'
import HabitCard from './HabitCard'
import AddHabitModal from './AddHabitModal'
import BackdatedEntryModal from './BackdatedEntryModal'
import ThemeToggle from './ThemeToggle'
import StatsPanel from './StatsPanel'
import ConsistencyHeatmap from './ConsistencyHeatmap'
import { todayKey } from '../lib/dates'

export default function Dashboard({ user, isAdmin, onOpenAdmin }) {
  const [habits, setHabits] = useState([])
  const [logsByHabit, setLogsByHabit] = useState({}) // { habitId: Map(dateKey -> 'completed' | 'partial') }
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showBackdatedModal, setShowBackdatedModal] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setError('')
    // Load the full history so backdated entries can affect current/best streaks.
    // Weekly/monthly cards still calculate only their own 7/30-day windows.
    const [habitsRes, logsRes] = await Promise.all([
      supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true }),
      supabase
        .from('habit_logs')
        .select('habit_id, completed_date, status')
        .eq('user_id', user.id),
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

  useEffect(() => {
    loadData()
  }, [loadData])

  async function handleCreateHabit({ name, color, icon, restDays }) {
    const { data, error } = await supabase
      .from('habits')
      .insert({ name, color, icon, rest_days: restDays, user_id: user.id })
      .select()
      .single()

    if (error) {
      setError(error.message)
      return
    }
    setHabits((prev) => [...prev, data])
    setShowAddModal(false)
  }

  async function handleDeleteHabit(habitId) {
    const previous = habits
    setHabits((prev) => prev.filter((h) => h.id !== habitId)) // optimistic
    const { error } = await supabase.from('habits').delete().eq('id', habitId).eq('user_id', user.id)
    if (error) {
      setError(error.message)
      setHabits(previous) // roll back on failure
    }
  }

  async function handleUpdateRestDays(habitId, restDays) {
    const previous = habits
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, rest_days: restDays } : h)))

    const { error } = await supabase
      .from('habits')
      .update({ rest_days: restDays })
      .eq('id', habitId)
      .eq('user_id', user.id)
    if (error) {
      setError(error.message)
      setHabits(previous)
    }
  }

  // Cycles a day's status: none -> completed -> partial -> none.
  async function handleToggleToday(habit, dateKey, currentStatus) {
    const nextStatus =
      !currentStatus ? 'completed' : currentStatus === 'completed' ? 'partial' : null

    setLogsByHabit((prev) => {
      const next = { ...prev }
      const map = new Map(next[habit.id] ?? [])
      if (nextStatus) map.set(dateKey, nextStatus)
      else map.delete(dateKey)
      next[habit.id] = map
      return next
    })

    if (nextStatus) {
      const { error } = await supabase
        .from('habit_logs')
        .upsert(
          { habit_id: habit.id, completed_date: dateKey, status: nextStatus, user_id: user.id },
          { onConflict: 'habit_id,completed_date' },
        )
      if (error) setError(error.message)
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habit.id)
        .eq('completed_date', dateKey)
        .eq('user_id', user.id)
      if (error) setError(error.message)
    }
  }

  async function handleSaveBackdatedEntries(dateKey, draft) {
    // Never allow a future date through the UI or API request built here.
    if (dateKey > toDateKey(new Date())) {
      throw new Error('Backdated entries can only be saved for today or an earlier date.')
    }

    const changes = []
    for (const habit of habits) {
      const status = draft[habit.id]
      if (status === 'completed' || status === 'partial') {
        changes.push({
          habit_id: habit.id,
          completed_date: dateKey,
          status,
          user_id: user.id,
        })
      } else {
        changes.push({
          habit_id: habit.id,
          completed_date: dateKey,
          status: null,
          user_id: user.id,
        })
      }
    }

    const toDelete = changes.filter((change) => change.status === null)
    const toUpsert = changes.filter((change) => change.status !== null)

    if (toUpsert.length > 0) {
      const { error } = await supabase
        .from('habit_logs')
        .upsert(toUpsert, { onConflict: 'habit_id,completed_date' })
      if (error) throw error
    }

    for (const change of toDelete) {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', change.habit_id)
        .eq('completed_date', dateKey)
        .eq('user_id', user.id)
      if (error) throw error
    }

    // Reload from Supabase so every card, streak, badge and stats panel uses the saved data.
    await loadData()
  }

  const today = todayKey()
  const todayCompletion = habits.length
    ? Math.round(
        habits.reduce((sum, habit) => {
          const status = logsByHabit[habit.id]?.get(today)
          if (status === 'completed') return sum + 1
          if (status === 'partial') return sum + 0.5
          return sum
        }, 0) / habits.length * 100
      )
    : 0
  const completedToday = habits.filter((habit) => logsByHabit[habit.id]?.get(today) === 'completed').length
  const partialToday = habits.filter((habit) => logsByHabit[habit.id]?.get(today) === 'partial').length
  const dateLabel = new Date(`${today}T12:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="min-h-screen bg-parchment dark:bg-moss-950 transition-colors duration-300">
      <header className="max-w-5xl mx-auto px-5 sm:px-6 pt-7 sm:pt-9 pb-5 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-9 w-9 rounded-xl bg-moss-600 dark:bg-bloom-500 flex items-center justify-center text-lg shadow-sm">🌱</span>
            <h1 className="font-display text-2xl font-semibold text-moss-900 dark:text-parchment">Sprout</h1>
          </div>
          <p className="text-xs text-moss-500 dark:text-moss-100/45 mt-2 ml-11">Small actions. Stronger days.</p>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          {isAdmin && <button onClick={onOpenAdmin} className="hidden sm:block text-xs font-medium text-moss-500 dark:text-moss-100/60 hover:text-bloom-500 transition-colors">Admin</button>}
          <ThemeToggle />
          <button onClick={() => supabase.auth.signOut()} className="text-xs font-medium text-moss-500 dark:text-moss-100/60 hover:text-bloom-500 transition-colors">Log out</button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 sm:px-6 pb-16">
        {error && <div className="mb-4 rounded-xl bg-bloom-500/10 border border-bloom-500/10 text-bloom-600 dark:text-bloom-400 text-sm px-4 py-3 animate-fade-in">{error}</div>}

        <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-moss-600 dark:bg-moss-900 text-white shadow-xl shadow-moss-900/10 p-5 sm:p-7 mb-5 animate-fade-in">
          <div className="absolute -right-10 -top-16 h-44 w-44 rounded-full bg-white/10 blur-2xl" />
          <div className="relative flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.16em] text-white/55">Today</p>
              <h2 className="font-display text-2xl sm:text-3xl font-semibold mt-1">{dateLabel}</h2>
              <p className="text-sm text-white/65 mt-2">{todayCompletion === 100 ? 'Everything is done. Beautiful work.' : todayCompletion >= 70 ? 'You are having a strong day. Keep going.' : 'A few small wins can change the day.'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative h-20 w-20 rounded-full border-4 border-white/15 flex items-center justify-center">
                <svg className="absolute inset-0 -rotate-90 h-full w-full" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray={`${todayCompletion} 100`} />
                </svg>
                <span className="font-display text-xl font-semibold">{todayCompletion}%</span>
              </div>
              <div className="text-xs text-white/60 leading-5">
                <div><span className="text-white font-semibold">{completedToday}</span> completed</div>
                <div><span className="text-white font-semibold">{partialToday}</span> partial</div>
                <div><span className="text-white font-semibold">{Math.max(habits.length - completedToday - partialToday, 0)}</span> remaining</div>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => setShowAddModal(true)} className="rounded-2xl bg-white dark:bg-moss-900 shadow-card dark:shadow-cardDark p-4 text-left hover:-translate-y-0.5 transition-all group">
            <span className="text-lg">＋</span>
            <span className="block text-sm font-semibold text-moss-800 dark:text-parchment mt-2">Add a habit</span>
            <span className="block text-[10px] text-moss-400 dark:text-moss-100/40 mt-0.5">Plant something new</span>
          </button>
          <button onClick={() => setShowBackdatedModal(true)} disabled={loading || habits.length === 0} className="rounded-2xl bg-white dark:bg-moss-900 shadow-card dark:shadow-cardDark p-4 text-left hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="text-lg">📅</span>
            <span className="block text-sm font-semibold text-moss-800 dark:text-parchment mt-2">Edit a past day</span>
            <span className="block text-[10px] text-moss-400 dark:text-moss-100/40 mt-0.5">Never lose a streak to forgetfulness</span>
          </button>
        </div>

        {!loading && <StatsPanel habits={habits} logsByHabit={logsByHabit} />}
        {!loading && habits.length > 0 && <ConsistencyHeatmap habits={habits} logsByHabit={logsByHabit} />}

        <div className="flex items-end justify-between mb-3">
          <div>
            <p className="section-kicker">Daily practice</p>
            <h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">Your habits</h2>
          </div>
          {habits.length > 0 && <span className="text-xs font-mono text-moss-400 dark:text-moss-100/35">{habits.length} habit{habits.length === 1 ? '' : 's'}</span>}
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">{[1, 2, 3, 4].map((i) => <div key={i} className="h-48 rounded-2xl bg-moss-100/40 dark:bg-moss-900/40 animate-pulse" />)}</div>
        ) : habits.length === 0 ? (
          <div className="rounded-2xl bg-white dark:bg-moss-900 shadow-card dark:shadow-cardDark text-center py-16 px-6 animate-fade-in">
            <p className="text-4xl mb-3">🌱</p>
            <p className="font-display text-xl text-moss-800 dark:text-parchment">Nothing planted yet</p>
            <p className="text-sm text-moss-500 dark:text-moss-100/60 mt-1 max-w-sm mx-auto">Start with one small habit. You can always grow from there.</p>
            <button onClick={() => setShowAddModal(true)} className="mt-5 px-5 py-2.5 rounded-xl bg-moss-600 dark:bg-bloom-500 text-white text-sm font-semibold hover:opacity-90 transition-opacity">Add your first habit</button>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {habits.map((habit) => <HabitCard key={habit.id} habit={habit} statusMap={logsByHabit[habit.id] ?? new Map()} onToggleToday={handleToggleToday} onDelete={handleDeleteHabit} onUpdateRestDays={handleUpdateRestDays} />)}
          </div>
        )}
      </main>

      {showAddModal && <AddHabitModal onClose={() => setShowAddModal(false)} onCreate={handleCreateHabit} />}
      {showBackdatedModal && <BackdatedEntryModal habits={habits} logsByHabit={logsByHabit} onClose={() => setShowBackdatedModal(false)} onSave={handleSaveBackdatedEntries} />}
    </div>
  )
}
