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

  function toggleRestDay(index) { setRestDays((prev) => prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]) }
  async function handleSubmit(e) { e.preventDefault(); if (!name.trim()) return; setSaving(true); await onCreate({ name: name.trim(), color, icon, restDays }); setSaving(false) }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="modal-card max-w-md animate-pop-in">
        <div className="modal-header">
          <div><p className="section-kicker">Daily practice</p><h2 className="font-display text-xl font-semibold text-moss-900 dark:text-parchment mt-1">Plant a new habit</h2><p className="text-xs text-moss-400 dark:text-moss-100/45 mt-1">Keep it specific enough to complete.</p></div>
          <button onClick={onClose} className="modal-close" aria-label="Close">×</button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body space-y-5">
          <div><label htmlFor="habit-name" className="field-label">Name</label><input id="habit-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Drink water" className="field-input" /></div>
          <div><span className="field-label">Icon</span><div className="flex flex-wrap gap-2">{ICONS.map((i) => <button type="button" key={i} aria-label={`Choose ${i}`} onClick={() => setIcon(i)} className={`picker-icon ${icon === i ? 'selected' : ''}`}>{i}</button>)}</div></div>
          <div><span className="field-label">Color</span><div className="flex flex-wrap gap-3">{COLORS.map((c) => <button type="button" key={c} onClick={() => setColor(c)} style={{ backgroundColor: c }} className={`color-swatch ${color === c ? 'selected' : ''}`} aria-label={`Choose color ${c}`} />)}</div></div>
          <div><span className="field-label">Rest days <span className="font-normal text-moss-400">optional</span></span><p className="text-xs text-moss-400 dark:text-moss-100/45 mb-2">They won't break the streak or count against progress.</p><div className="flex gap-2">{DAY_LABELS.map((label, index) => <button type="button" key={index} onClick={() => toggleRestDay(index)} className={`rest-day-btn ${restDays.includes(index) ? 'selected' : ''}`}>{label}</button>)}</div></div>
        </form>
        <div className="modal-footer"><button type="button" onClick={onClose} className="secondary-btn">Cancel</button><button type="button" onClick={() => document.getElementById('habit-name')?.form?.requestSubmit()} disabled={saving || !name.trim()} className="primary-btn flex-1">{saving ? 'Adding…' : 'Add habit'}</button></div>
      </div>
    </div>
  )
}
