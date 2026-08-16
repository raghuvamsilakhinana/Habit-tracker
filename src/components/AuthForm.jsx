import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ThemeToggle from './ThemeToggle'

export default function AuthForm() {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    } else {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else setMessage('Check your inbox to confirm your email, then log in.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-orb auth-orb-one" />
      <div className="auth-orb auth-orb-two" />
      <div className="absolute top-5 right-5 sm:top-7 sm:right-7"><ThemeToggle /></div>

      <div className="w-full max-w-md px-4 animate-pop-in">
        <div className="auth-brand">
          <span className="brand-mark auth-brand-mark">🌱</span>
          <div>
            <h1 className="font-display text-3xl font-semibold text-moss-900 dark:text-parchment">Sprout</h1>
            <p className="text-sm text-moss-400 dark:text-moss-100/55 mt-1">Small habits, tended daily.</p>
          </div>
        </div>

        <div className="auth-card">
          <div className="auth-intro">
            <p className="section-kicker">A calmer way to be consistent</p>
            <h2 className="font-display text-2xl font-semibold text-moss-900 dark:text-parchment mt-1">{mode === 'login' ? 'Welcome back.' : 'Start growing.'}</h2>
            <p className="text-sm text-moss-400 dark:text-moss-100/50 mt-1">{mode === 'login' ? 'Pick up where you left off.' : 'Build a few small wins into every week.'}</p>
          </div>

          <div className="auth-tabs">
            {['login', 'signup'].map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(''); setMessage('') }} className={`auth-tab ${mode === m ? 'active' : ''}`}>
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="field-label">Email</label>
              <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field-input" placeholder="you@example.com" />
            </div>
            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <input id="password" type="password" required minLength={6} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={(e) => setPassword(e.target.value)} className="field-input" placeholder="At least 6 characters" />
            </div>
            {error && <p className="auth-message auth-error">{error}</p>}
            {message && <p className="auth-message auth-success">{message}</p>}
            <button type="submit" disabled={loading} className="auth-submit">{loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}<span>→</span></button>
          </form>
        </div>

        <p className="auth-footnote">Your habits stay private to your account.</p>
      </div>
    </div>
  )
}
