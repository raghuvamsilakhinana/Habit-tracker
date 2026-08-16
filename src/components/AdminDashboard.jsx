import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabaseClient'
import { currentStreak } from '../lib/dates'
import ThemeToggle from './ThemeToggle'
export default function AdminDashboard({ onBack }) {
  const [users, setUsers] = useState([]); const [habits, setHabits] = useState([]); const [logs, setLogs] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('')
  const loadAll = useCallback(async () => {
    setError('')
    const [usersRes, habitsRes, logsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('habits').select('*'),
      supabase.from('habit_logs').select('habit_id, completed_date'),
    ])
    if (usersRes.error) setError(usersRes.error.message); else setUsers(usersRes.data)
    if (habitsRes.error) setError(habitsRes.error.message); else setHabits(habitsRes.data)
    if (logsRes.error) setError(logsRes.error.message); else setLogs(logsRes.data)
    setLoading(false)
  }, [])
  useEffect(() => { loadAll() }, [loadAll])
  async function handleDeleteHabit(habitId) {
    const { error } = await supabase.from('habits').delete().eq('id', habitId)
    if (error) { setError(error.message); return }
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
  }
  const totalCheckIns = logs.length
  return (
    <div className="min-h-screen bg-parchment dark:bg-moss-950 transition-colors duration-300">
      <header className="max-w-4xl mx-auto px-5 sm:px-6 pt-8 pb-4 flex items-center justify-between"><div><h1 className="font-display text-2xl font-semibold text-moss-900 dark:text-parchment">Admin console</h1><p className="text-sm text-moss-600 dark:text-moss-100/60 mt-0.5">{users.length} users · {habits.length} habits · {totalCheckIns} check-ins</p></div><div className="flex items-center gap-3"><ThemeToggle /><button onClick={onBack} className="text-sm font-medium text-moss-600 dark:text-moss-100/70 hover:text-bloom-500 transition-colors">Back to my habits</button></div></header>
      <main className="max-w-4xl mx-auto px-5 sm:px-6 pb-16">{error && <div className="mb-4 rounded-lg bg-bloom-500/10 text-bloom-600 dark:text-bloom-400 text-sm px-4 py-3">{error}</div>}{loading ? <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-20 rounded-xl2 bg-moss-100/40 dark:bg-moss-900/40 animate-pulse" />)}</div> : <div className="space-y-4">{users.map((u) => { const userHabits = habits.filter((h) => h.user_id === u.id); return <div key={u.id} className="bg-white dark:bg-moss-900 rounded-xl2 shadow-card dark:shadow-cardDark p-5 animate-fade-in"><div className="flex items-center justify-between mb-3"><div><p className="font-medium text-moss-900 dark:text-parchment">{u.email}{u.is_admin && <span className="ml-2 text-[10px] uppercase tracking-wide bg-bloom-500/15 text-bloom-600 dark:text-bloom-400 px-2 py-0.5 rounded-full">Admin</span>}</p><p className="text-xs text-moss-400 dark:text-moss-100/50 font-mono">Joined {new Date(u.created_at).toLocaleDateString()}</p></div><span className="text-xs font-mono text-moss-400 dark:text-moss-100/50">{userHabits.length} habit{userHabits.length === 1 ? '' : 's'}</span></div>{userHabits.length > 0 && <div className="space-y-1.5 pt-3 border-t border-moss-50 dark:border-moss-800">{userHabits.map((h) => { const habitLogDates = logs.filter((l) => l.habit_id === h.id).map((l) => l.completed_date); const streak = currentStreak(h, new Map(habitLogDates.map(d => [d, 'completed']))); return <div key={h.id} className="flex items-center justify-between text-sm"><span className="text-moss-800 dark:text-parchment/80">{h.icon} {h.name}</span><div className="flex items-center gap-3"><span className="text-xs font-mono text-moss-400 dark:text-moss-100/50">{streak > 0 ? `${streak}d streak` : 'inactive'}</span><button onClick={() => handleDeleteHabit(h.id)} className="text-xs text-moss-400 hover:text-bloom-500 transition-colors">Delete</button></div></div>})}</div>}</div> })}</div>}</main>
    </div>
  )
}
