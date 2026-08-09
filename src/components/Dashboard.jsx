import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { lastNDateKeys } from '../lib/dates'
import HabitCard from './HabitCard'
import AddHabitModal from './AddHabitModal'
import ThemeToggle from './ThemeToggle'
import StatsPanel from './StatsPanel'

export default function Dashboard({ user, isAdmin, onOpenAdmin }) {
  const [habits, setHabits] = useState([])
  const [logsByHabit, setLogsByHabit] = useState({}) // { habitId: Map(dateKey -> 'completed' | 'partial') }
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [error, setError] = useState('')

  const loadData = useCallback(async () => {
    setError('')
    // 30 days covers monthly progress, best/worst habit, and longest streak.
    const since = lastNDateKeys(30)[0]

    const [habitsRes, logsRes] = await Promise.all([
      supabase.from('habits').select('*').order('created_at', { ascending: true }),
      supabase
        .from('habit_logs')
        .select('habit_id, completed_date, status')
        .gte('completed_date', since),
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
    for (const row of logsRes.data) {
      if (!grouped[row.habit_id]) grouped[row.habit_id] = new Map()
      grouped[row.habit_id].set(row.completed_date, row.status)
    }

    setHabits(habitsRes.data)
    setLogsByHabit(grouped)
    setLoading(false)
  }, [])

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
    const { error } = await supabase.from('habits').delete().eq('id', habitId)
    if (error) {
      setError(error.message)
      setHabits(previous) // roll back on failure
    }
  }

  async function handleUpdateRestDays(habitId, restDays) {
    const previous = habits
    setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, rest_days: restDays } : h)))

    const { error } = await supabase.from('habits').update({ rest_days: restDays }).eq('id', habitId)
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
          { onConflict: 'habit_id,completed_date' }
        )
      if (error) setError(error.message)
    } else {
      const { error } = await supabase
        .from('habit_logs')
        .delete()
        .eq('habit_id', habit.id)
        .eq('completed_date', dateKey)
      if (error) setError(error.message)
    }
  }

  return (
    <div className="min-h-screen bg-parchment dark:bg-moss-950 transition-colors duration-300">
      <header className="max-w-3xl mx-auto px-5 sm:px-6 pt-8 pb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-moss-900 dark:text-parchment">
            🌱 Sprout
          </h1>
          <p className="text-sm text-moss-600 dark:text-moss-100/60 mt-0.5">{user.email}</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-sm font-medium text-moss-600 dark:text-moss-100/70 hover:text-bloom-500 transition-colors"
            >
              Admin console
            </button>
          )}
          <ThemeToggle />
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-sm font-medium text-moss-600 dark:text-moss-100/70 hover:text-bloom-500 transition-colors"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-6 pb-16">
        {error && (
          <div className="mb-4 rounded-lg bg-bloom-500/10 text-bloom-600 dark:text-bloom-400 text-sm px-4 py-3 animate-fade-in">
            {error}
          </div>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          className="w-full mb-6 rounded-xl2 border-2 border-dashed border-moss-100 dark:border-moss-800 text-moss-500 dark:text-moss-100/60 hover:border-moss-400 hover:text-moss-700 dark:hover:text-parchment py-4 text-sm font-medium transition-colors duration-200"
        >
          + Add a habit
        </button>

        {!loading && <StatsPanel habits={habits} logsByHabit={logsByHabit} />}

        {loading ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 rounded-xl2 bg-moss-100/40 dark:bg-moss-900/40 animate-pulse" />
            ))}
          </div>
        ) : habits.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <p className="text-4xl mb-3">🌱</p>
            <p className="font-display text-lg text-moss-800 dark:text-parchment">Nothing planted yet</p>
            <p className="text-sm text-moss-500 dark:text-moss-100/60 mt-1">
              Add your first habit to start a streak.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-4">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                statusMap={logsByHabit[habit.id] ?? new Map()}
                onToggleToday={handleToggleToday}
                onDelete={handleDeleteHabit}
                onUpdateRestDays={handleUpdateRestDays}
              />
            ))}
          </div>
        )}
      </main>

      {showAddModal && (
        <AddHabitModal onClose={() => setShowAddModal(false)} onCreate={handleCreateHabit} />
      )}
    </div>
  )
}
