import { useEffect, useState, useCallback, useMemo } from 'react'
import { supabase } from '../lib/supabaseClient'
import { currentStreak, todayKey } from '../lib/dates'
import ThemeToggle from './ThemeToggle'

const QUICK_MESSAGES = [
  { label: 'Keep going', title: 'A small win today', message: 'You are building momentum one small action at a time. Keep going — today still counts. 🌱' },
  { label: 'Strong streak', title: 'Protect your streak', message: 'Your consistency is showing. Keep protecting the streak you are building — you are doing great. 🔥' },
  { label: 'Fresh start', title: 'A fresh start', message: 'One missed day does not erase your progress. Pick one habit and make today your next small win. 🌱' },
  { label: 'Celebrate', title: 'You are doing great', message: 'Your recent progress is worth celebrating. Keep showing up and let the small wins compound. ✨' },
]

function getDateKey(offset) {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

function userMetrics(user, habits, logs) {
  const userHabits = habits.filter((habit) => habit.user_id === user.id)
  const userHabitIds = new Set(userHabits.map((habit) => habit.id))
  const userLogs = logs.filter((log) => userHabitIds.has(log.habit_id))
  const byHabit = new Map()
  userLogs.forEach((log) => {
    if (!byHabit.has(log.habit_id)) byHabit.set(log.habit_id, new Map())
    byHabit.get(log.habit_id).set(log.completed_date, log.status || 'completed')
  })
  const today = todayKey()
  const completedToday = userHabits.filter((habit) => byHabit.get(habit.id)?.get(today) === 'completed').length
  const partialToday = userHabits.filter((habit) => byHabit.get(habit.id)?.get(today) === 'partial').length
  const todayPercent = userHabits.length ? Math.round(((completedToday + partialToday * 0.5) / userHabits.length) * 100) : 0
  let totalWeight = 0
  let possible = 0
  for (let offset = -6; offset <= 0; offset += 1) {
    const date = getDateKey(offset)
    userHabits.forEach((habit) => {
      possible += 1
      const status = byHabit.get(habit.id)?.get(date)
      totalWeight += status === 'completed' ? 1 : status === 'partial' ? 0.5 : 0
    })
  }
  const weekPercent = possible ? Math.round((totalWeight / possible) * 100) : 0
  const streaks = userHabits.map((habit) => currentStreak(habit, byHabit.get(habit.id) || new Map())).filter(Boolean)
  const streak = streaks.length ? Math.max(...streaks) : 0
  const totalLogs = userLogs.length
  return { userHabits, completedToday, partialToday, todayPercent, weekPercent, streak, totalLogs, byHabit }
}

export default function AdminDashboard({ onBack }) {
  const [users, setUsers] = useState([])
  const [habits, setHabits] = useState([])
  const [logs, setLogs] = useState([])
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [messageOpen, setMessageOpen] = useState(false)
  const [messageTarget, setMessageTarget] = useState('')
  const [messageTitle, setMessageTitle] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [messageCategory, setMessageCategory] = useState('motivation')
  const [sending, setSending] = useState(false)
  const [sendStatus, setSendStatus] = useState('')
  const [expandedUser, setExpandedUser] = useState(null)

  const loadAll = useCallback(async () => {
    setError('')
    const [usersRes, habitsRes, logsRes, notificationsRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: true }),
      supabase.from('habits').select('*'),
      supabase.from('habit_logs').select('habit_id, completed_date, status'),
      supabase.from('notifications').select('id, recipient_user_id, title, message, created_at').order('created_at', { ascending: false }).limit(100),
    ])
    if (usersRes.error) setError(usersRes.error.message); else setUsers(usersRes.data || [])
    if (habitsRes.error) setError(habitsRes.error.message); else setHabits(habitsRes.data || [])
    if (logsRes.error) setError(logsRes.error.message); else setLogs(logsRes.data || [])
    if (notificationsRes.error) {
      if (!(notificationsRes.error.code === '42P01' || notificationsRes.error.code === 'PGRST205' || notificationsRes.error.message?.includes('notifications'))) setError(notificationsRes.error.message)
      setNotifications([])
    } else setNotifications(notificationsRes.data || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadAll() }, [loadAll])

  async function handleDeleteHabit(habitId) {
    const { error } = await supabase.from('habits').delete().eq('id', habitId)
    if (error) { setError(error.message); return }
    setHabits((prev) => prev.filter((h) => h.id !== habitId))
  }

  function openMessage(userId = 'all') {
    setMessageTarget(userId)
    setMessageTitle('')
    setMessageBody('')
    setMessageCategory('motivation')
    setSendStatus('')
    setMessageOpen(true)
  }

  function chooseQuickMessage(item) {
    setMessageTitle(item.title)
    setMessageBody(item.message)
    if (item.label === 'Celebrate') setMessageCategory('celebration')
    else if (item.label === 'Keep going' || item.label === 'Fresh start') setMessageCategory('progress')
    else setMessageCategory('motivation')
  }

  async function handleSendMessage() {
    if (!messageBody.trim()) { setSendStatus('Write a message first.'); return }
    setSending(true)
    setSendStatus('')
    const recipients = messageTarget === 'all' ? users.filter((u) => !u.is_admin) : users.filter((u) => u.id === messageTarget)
    if (!recipients.length) { setSending(false); setSendStatus('No matching recipients.'); return }
    const payload = recipients.map((recipient) => ({
      recipient_user_id: recipient.id,
      sender_user_id: null,
      title: messageTitle.trim() || 'A note from Sprout',
      message: messageBody.trim(),
      category: messageCategory,
    }))
    const { error } = await supabase.from('notifications').insert(payload)
    if (error) {
      setSendStatus(error.message)
      setSending(false)
      return
    }
    setSending(false)
    setSendStatus(`Sent to ${recipients.length} user${recipients.length === 1 ? '' : 's'}.`)
    setNotifications((prev) => [
      ...payload.map((item) => ({ ...item, id: `local-${Math.random()}`, created_at: new Date().toISOString() })),
      ...prev,
    ].slice(0, 100))
    setMessageBody('')
  }

  const metricsByUser = useMemo(() => {
    const map = new Map()
    users.forEach((u) => map.set(u.id, userMetrics(u, habits, logs)))
    return map
  }, [users, habits, logs])

  const filteredUsers = users.filter((u) => u.email?.toLowerCase().includes(search.trim().toLowerCase()))
  const totalCheckIns = logs.length
  const nonAdminUsers = users.filter((u) => !u.is_admin)
  const unreadishCount = notifications.length

  return (
    <div className="min-h-screen bg-parchment dark:bg-moss-950 transition-colors duration-300">
      <header className="max-w-6xl mx-auto px-5 sm:px-6 pt-8 pb-4 flex items-center justify-between gap-4">
        <div>
          <p className="section-kicker">Coach view</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold text-moss-900 dark:text-parchment mt-1">Admin console</h1>
          <p className="text-sm text-moss-600 dark:text-moss-100/60 mt-1">{nonAdminUsers.length} users · {habits.length} habits · {totalCheckIns} check-ins · {unreadishCount} recent notes</p>
        </div>
        <div className="flex items-center gap-3"><ThemeToggle /><button onClick={onBack} className="top-link">Back to my habits</button></div>
      </header>

      <main className="max-w-6xl mx-auto px-5 sm:px-6 pb-16">
        {error && <div className="mb-4 rounded-lg bg-bloom-500/10 text-bloom-600 dark:text-bloom-400 text-sm px-4 py-3">{error}</div>}

        <section className="admin-toolbar mb-5">
          <div className="admin-search-wrap">
            <span>⌕</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users by email…" className="admin-search" />
          </div>
          <button type="button" className="primary-btn" onClick={() => openMessage('all')}>Send to all users</button>
        </section>

        {loading ? <div className="space-y-3">{[1,2,3].map((i) => <div key={i} className="h-28 rounded-xl2 bg-moss-100/40 dark:bg-moss-900/40 animate-pulse" />)}</div> : <div className="grid lg:grid-cols-2 gap-4">
          {filteredUsers.map((u) => {
            const metrics = metricsByUser.get(u.id)
            const userNotifications = notifications.filter((item) => item.recipient_user_id === u.id).length
            const expanded = expandedUser === u.id
            return <div key={u.id} className="admin-user-card">
              <button type="button" className="admin-user-summary" onClick={() => setExpandedUser(expanded ? null : u.id)}>
                <span className="admin-avatar">{(u.email?.[0] || '?').toUpperCase()}</span>
                <span className="admin-user-main">
                  <strong>{u.email}{u.is_admin && <span className="ml-2 text-[10px] uppercase tracking-wide bg-bloom-500/15 text-bloom-600 dark:text-bloom-400 px-2 py-0.5 rounded-full">Admin</span>}</strong>
                  <small>Joined {new Date(u.created_at).toLocaleDateString()}</small>
                </span>
                <span className="admin-user-score"><b>{metrics?.todayPercent || 0}%</b><small>today</small></span>
                <span className="admin-chevron">{expanded ? '⌃' : '⌄'}</span>
              </button>

              <div className="admin-user-metrics">
                <div><span>Today</span><strong>{metrics?.completedToday || 0}/{metrics?.userHabits.length || 0}</strong></div>
                <div><span>7-day</span><strong>{metrics?.weekPercent || 0}%</strong></div>
                <div><span>Streak</span><strong>{metrics?.streak ? `${metrics.streak}d` : '—'}</strong></div>
                <div><span>Notes</span><strong>{userNotifications}</strong></div>
              </div>

              <div className="admin-user-actions">
                <button type="button" className="secondary-btn" onClick={() => openMessage(u.id)}>Send motivation</button>
                <button type="button" className="secondary-btn" onClick={() => setExpandedUser(expanded ? null : u.id)}>{expanded ? 'Hide details' : 'View details'}</button>
              </div>

              <div className={`admin-user-details ${expanded ? 'is-open' : ''}`}>
                <div className="admin-detail-grid">
                  <div><p className="section-kicker">Today's progress</p><div className="admin-progress"><span style={{ width: `${metrics?.todayPercent || 0}%` }} /></div><p className="admin-detail-value">{metrics?.completedToday || 0} completed · {metrics?.partialToday || 0} partial · {metrics?.userHabits.length ? Math.max(metrics.userHabits.length - metrics.completedToday - metrics.partialToday, 0) : 0} left</p></div>
                  <div><p className="section-kicker">This week</p><div className="admin-progress"><span className="blue" style={{ width: `${metrics?.weekPercent || 0}%` }} /></div><p className="admin-detail-value">{metrics?.weekPercent || 0}% weighted consistency</p></div>
                </div>
                {metrics?.userHabits?.length > 0 && <div className="admin-habit-list">{metrics.userHabits.map((h) => {
                  const streak = currentStreak(h, metrics.byHabit.get(h.id) || new Map())
                  return <div key={h.id} className="admin-habit-row"><span>{h.icon} {h.name}</span><span>{streak ? `${streak}d streak` : 'inactive'}</span><button type="button" onClick={() => handleDeleteHabit(h.id)}>Delete</button></div>
                })}</div>}
              </div>
            </div>
          })}
        </div>}

        {!loading && filteredUsers.length === 0 && <div className="empty-state mt-4"><p className="font-display text-xl text-moss-800 dark:text-parchment">No users found</p><p className="text-sm text-moss-400 dark:text-moss-100/55 mt-1">Try a different email search.</p></div>}
      </main>

      {messageOpen && <div className="modal-backdrop">
        <button type="button" className="modal-backdrop-button" aria-label="Close" onClick={() => setMessageOpen(false)} />
        <section className="modal-card rounded-xl2 max-w-2xl animate-fade-in">
          <div className="modal-header">
            <div><p className="section-kicker">In-app only</p><h2 className="font-display text-2xl font-semibold text-moss-900 dark:text-parchment mt-1">Send motivation</h2><p className="text-xs text-moss-400 dark:text-moss-100/55 mt-1">This creates a Sprout note inside the recipient's notification center. No email or browser push is sent.</p></div>
            <button type="button" className="modal-close" onClick={() => setMessageOpen(false)}>×</button>
          </div>
          <div className="modal-body space-y-4">
            <div className="message-target-card">
              <div><p className="section-kicker">Recipient</p><p className="font-medium text-moss-900 dark:text-parchment">{messageTarget === 'all' ? `All users (${nonAdminUsers.length})` : users.find((u) => u.id === messageTarget)?.email}</p></div>
              {messageTarget !== 'all' && <button type="button" className="notification-mini-btn" onClick={() => setMessageTarget('all')}>Change</button>}
            </div>

            <div><label className="field-label">Quick start</label><div className="flex flex-wrap gap-2">{QUICK_MESSAGES.map((item) => <button key={item.label} type="button" className="quick-message-chip" onClick={() => chooseQuickMessage(item)}>{item.label}</button>)}</div></div>
            <div><label className="field-label">Category</label><div className="admin-category-row">{[['motivation','🌱 Motivation'],['progress','📈 Progress'],['celebration','✨ Celebration']].map(([value, label]) => <button type="button" key={value} className={`admin-category-btn ${messageCategory === value ? 'active' : ''}`} onClick={() => setMessageCategory(value)}>{label}</button>)}</div></div>
            <div><label className="field-label">Title</label><input value={messageTitle} onChange={(e) => setMessageTitle(e.target.value)} placeholder="A small win today" className="field-input" /></div>
            <div><label className="field-label">Message</label><textarea value={messageBody} onChange={(e) => setMessageBody(e.target.value)} rows={6} placeholder="Write something encouraging…" className="field-input resize-none" /></div>
            {sendStatus && <div className={`auth-message ${sendStatus.startsWith('Sent') ? 'auth-success' : 'auth-error'}`}>{sendStatus}</div>}
          </div>
          <div className="modal-footer"><button type="button" className="secondary-btn" onClick={() => setMessageOpen(false)}>Cancel</button><button type="button" className="primary-btn" disabled={sending || !messageBody.trim()} onClick={handleSendMessage}>{sending ? 'Sending…' : `Send to ${messageTarget === 'all' ? 'all users' : 'user'}`}</button></div>
        </section>
      </div>}
    </div>
  )
}
