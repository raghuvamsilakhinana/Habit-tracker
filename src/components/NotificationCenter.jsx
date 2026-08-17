import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function NotificationCenter({ userId }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(false)
  const [unread, setUnread] = useState(0)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!userId) return
    setLoading(true)
    setError('')
    const { data, error } = await supabase
      .from('notifications')
      .select('id, title, message, category, created_at, read_at')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      // Keep the dashboard usable if the notification migration has not been run yet.
      if (!(error.code === '42P01' || error.code === 'PGRST205' || error.message?.includes('notifications'))) {
        setError(error.message)
      }
      setNotifications([])
      setUnread(0)
    } else {
      setNotifications(data ?? [])
      setUnread((data ?? []).filter((item) => !item.read_at).length)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => { load() }, [load])

  async function markRead(id) {
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      .eq('recipient_user_id', userId)
    if (error) return
    setNotifications((prev) => prev.map((item) => item.id === id ? { ...item, read_at: new Date().toISOString() } : item))
    setUnread((value) => Math.max(0, value - 1))
  }

  async function markAllRead() {
    if (!unread) return
    const now = new Date().toISOString()
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: now })
      .eq('recipient_user_id', userId)
      .is('read_at', null)
    if (error) return
    setNotifications((prev) => prev.map((item) => ({ ...item, read_at: item.read_at ?? now })))
    setUnread(0)
  }

  return (
    <div className="notification-wrap">
      <button
        type="button"
        className={`notification-trigger ${unread > 0 ? 'has-unread' : ''}`}
        onClick={() => { setOpen((value) => !value); if (!open) load() }}
        aria-label={unread ? `${unread} unread notifications` : 'Notifications'}
        aria-expanded={open}
      >
        <span className="notification-bell">🔔</span>
        {unread > 0 && <span className="notification-badge">{unread > 9 ? '9+' : unread}</span>}
      </button>

      {open && (
        <>
          <button type="button" className="notification-dismiss" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <section className="notification-popover" role="dialog" aria-label="Sprout notifications">
            <div className="notification-popover-head">
              <div>
                <p className="section-kicker">Sprout notes</p>
                <h2 className="font-display text-lg font-semibold text-moss-900 dark:text-parchment mt-0.5">Notifications</h2>
              </div>
              <div className="flex items-center gap-2">
                {unread > 0 && <button type="button" className="notification-mini-btn" onClick={markAllRead}>Mark all read</button>}
                <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Close">×</button>
              </div>
            </div>

            {error && <div className="notification-error">{error}</div>}
            {loading ? (
              <div className="notification-empty">Loading your notes…</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">
                <span className="text-2xl">🌱</span>
                <p className="font-medium text-moss-800 dark:text-parchment mt-2">Nothing new yet.</p>
                <p className="text-xs text-moss-400 dark:text-moss-100/55 mt-1">When Sprout has something to tell you, it will appear here.</p>
              </div>
            ) : (
              <div className="notification-list">
                {notifications.map((item) => (
                  <button key={item.id} type="button" className={`notification-item ${!item.read_at ? 'is-unread' : ''}`} onClick={() => markRead(item.id)}>
                    <span className={`notification-item-icon category-${item.category || 'motivation'}`}>{item.category === 'progress' ? '📈' : item.category === 'celebration' ? '✨' : '🌱'}</span>
                    <span className="notification-item-copy">
                      <strong>{item.title}</strong>
                      <span>{item.message}</span>
                      <small>{new Date(item.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</small>
                    </span>
                    {!item.read_at && <span className="notification-unread-dot" />}
                  </button>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  )
}
