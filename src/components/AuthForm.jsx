import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ThemeToggle from './ThemeToggle'

export default function AuthForm() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
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
      if (error) {
        setError(error.message)
      } else {
        setMessage('Check your inbox to confirm your email, then log in.')
      }
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-parchment dark:bg-moss-950 transition-colors duration-300">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm animate-pop-in">
        <div className="text-center mb-8">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-moss-600 dark:bg-bloom-500 text-2xl mb-4">
            🌱
          </div>
          <h1 className="font-display text-3xl font-semibold text-moss-900 dark:text-parchment">
            Sprout
          </h1>
          <p className="text-moss-600 dark:text-moss-100/70 mt-1 text-sm">
            Small habits, tended daily.
          </p>
        </div>

        <div className="bg-white dark:bg-moss-900 rounded-xl2 shadow-card dark:shadow-cardDark p-6 sm:p-8">
          <div className="flex mb-6 rounded-full bg-moss-50 dark:bg-moss-950 p-1">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m)
                  setError('')
                  setMessage('')
                }}
                className={`flex-1 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                  mode === m
                    ? 'bg-moss-600 text-white shadow-sm'
                    : 'text-moss-600 dark:text-moss-100/60'
                }`}
              >
                {m === 'login' ? 'Log in' : 'Sign up'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1.5 text-moss-800 dark:text-parchment/90">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-moss-100 dark:border-moss-800 bg-parchment/50 dark:bg-moss-950 px-3.5 py-2.5 text-sm outline-none focus:border-moss-400 transition-colors"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1.5 text-moss-800 dark:text-parchment/90">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-moss-100 dark:border-moss-800 bg-parchment/50 dark:bg-moss-950 px-3.5 py-2.5 text-sm outline-none focus:border-moss-400 transition-colors"
                placeholder="At least 6 characters"
              />
            </div>

            {error && (
              <p className="text-sm text-bloom-600 dark:text-bloom-400 animate-fade-in">{error}</p>
            )}
            {message && (
              <p className="text-sm text-moss-600 dark:text-moss-100/80 animate-fade-in">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-moss-600 hover:bg-moss-800 disabled:opacity-60 text-white font-medium py-2.5 text-sm transition-colors duration-200"
            >
              {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
