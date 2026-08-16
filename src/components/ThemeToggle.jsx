import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'))
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    localStorage.setItem('sprout-theme', isDark ? 'dark' : 'light')
  }, [isDark])
  return (
    <button onClick={() => setIsDark((d) => !d)} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} className="theme-toggle">
      <span className={`theme-toggle-thumb ${isDark ? 'dark' : ''}`}>{isDark ? '🌙' : '☀️'}</span>
    </button>
  )
}
