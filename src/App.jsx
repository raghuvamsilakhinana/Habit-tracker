import { useState } from 'react'
import { useAuth } from './hooks/useAuth'
import { useProfile } from './hooks/useProfile'
import AuthForm from './components/AuthForm'
import Dashboard from './components/Dashboard'
import AdminDashboard from './components/AdminDashboard'

export default function App() {
  const { user, loading } = useAuth()
  const { profile } = useProfile(user?.id)
  const [view, setView] = useState('dashboard') // 'dashboard' | 'admin'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-parchment dark:bg-moss-950">
        <span className="text-2xl animate-pulse">🌱</span>
      </div>
    )
  }

  if (!user) return <AuthForm />

  if (view === 'admin' && profile?.is_admin) {
    return <AdminDashboard onBack={() => setView('dashboard')} />
  }

  return (
    <Dashboard
      user={user}
      isAdmin={!!profile?.is_admin}
      onOpenAdmin={() => setView('admin')}
    />
  )
}
