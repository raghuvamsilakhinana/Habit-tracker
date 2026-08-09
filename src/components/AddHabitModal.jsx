import { useState } from 'react'

const COLORS = ['#4a5f43', '#e8735c', '#7c9473', '#c9a24b', '#5b7d99', '#a05b8c']
const ICONS = ['🌿', '💧', '🏃', '📚', '🧘', '😴', '✍️', '🥗']
const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S']

export default function AddHabitModal({ onClose, onCreate }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState(COLORS[0])
  const [icon, setIcon] = useState(ICONS[0])
  const [restDays, setRestDays] = useState([])
  const [saving, setSaving] = useState(false)

  function toggleRestDay(index) {
    setRestDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    await onCreate({ name: name.trim(), color, icon, restDays })
    setSaving(false)
  }

  return (
    <div
      className="fixed inset-0 bg-ink/40 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center px-4 z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white dark:bg-moss-900 rounded-xl2 shadow-card dark:shadow-cardDark p-6 animate-pop-in max-h-[90vh] overflow-y-auto"
      >
        <h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mb-4">
          New habit
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="habit-name" className="block text-sm font-medium mb-1.5 text-moss-800 dark:text-parchment/90">
              Name
            </label>
            <input
              id="habit-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Drink water"
              className="w-full rounded-lg border border-moss-100 dark:border-moss-800 bg-parchment/50 dark:bg-moss-950 px-3.5 py-2.5 text-sm outline-none focus:border-moss-400 transition-colors"
            />
          </div>

          <div>
            <span className="block text-sm font-medium mb-1.5 text-moss-800 dark:text-parchment/90">Icon</span>
            <div className="flex flex-wrap gap-2">
              {ICONS.map((i) => (
                <button
                  type="button"
                  key={i}
                  onClick={() => setIcon(i)}
                  className={`h-9 w-9 rounded-lg flex items-center justify-center text-lg transition-all duration-150 ${
                    icon === i ? 'bg-moss-100 dark:bg-moss-800 ring-2 ring-moss-400' : 'bg-parchment dark:bg-moss-950'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium mb-1.5 text-moss-800 dark:text-parchment/90">Color</span>
            <div className="flex flex-wrap gap-2">
              {COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-8 w-8 rounded-full transition-transform duration-150 ${
                    color === c ? 'scale-110 ring-2 ring-offset-2 ring-moss-400 dark:ring-offset-moss-900' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-medium mb-1.5 text-moss-800 dark:text-parchment/90">
              Rest days <span className="font-normal text-moss-400">(optional)</span>
            </span>
            <p className="text-xs text-moss-500 dark:text-moss-100/50 mb-2">
              Days you don't plan to do this habit — they won't break your streak.
            </p>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((label, index) => {
                const isRest = restDays.includes(index)
                return (
                  <button
                    type="button"
                    key={index}
                    onClick={() => toggleRestDay(index)}
                    className={`h-8 w-8 rounded-full text-xs font-medium transition-colors duration-150 ${
                      isRest
                        ? 'bg-moss-600 text-white'
                        : 'bg-parchment dark:bg-moss-950 text-moss-500 dark:text-moss-100/50'
                    }`}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-moss-100 dark:border-moss-800 text-moss-700 dark:text-parchment/80 font-medium py-2.5 text-sm hover:bg-moss-50 dark:hover:bg-moss-950 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="flex-1 rounded-lg bg-moss-600 hover:bg-moss-800 disabled:opacity-50 text-white font-medium py-2.5 text-sm transition-colors"
            >
              {saving ? 'Adding…' : 'Add habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
