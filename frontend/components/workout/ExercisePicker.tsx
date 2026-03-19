'use client'

import { useState, useMemo } from 'react'
import { useAtomValue } from 'jotai'
import { accessTokenWithStorageAtom } from '../../store/atoms'
import { exerciseApi } from '../../lib/api'
import type { Exercise } from '../../hooks/useWorkout'
import { translateMuscleGroups } from '../../lib/translations'

interface ExercisePickerProps {
  exercises: Exercise[]
  onSelect: (exercise: Exercise) => void
  onClose: () => void
  onExerciseCreated: () => void
}

const CATEGORIES = ['alle', 'strength', 'cardio', 'core', 'flexibility']
const CATEGORY_LABELS: Record<string, string> = {
  alle: 'Alle', strength: 'Kraft', cardio: 'Cardio', core: 'Core', flexibility: 'Dehnung', sport: 'Sport', custom: 'Sonstiges'
}

export default function ExercisePicker({ exercises, onSelect, onClose, onExerciseCreated }: ExercisePickerProps) {
  const token = useAtomValue(accessTokenWithStorageAtom)
  const [search, setSearch]         = useState('')
  const [category, setCategory]     = useState('alle')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName]       = useState('')
  const [newCat, setNewCat]         = useState<Exercise['category']>('strength')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const filtered = useMemo(() => exercises.filter((ex) =>
    ex.name.toLowerCase().includes(search.toLowerCase()) &&
    (category === 'alle' || ex.category === category)
  ), [exercises, search, category])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !token) return
    setSaving(true); setError(null)
    try {
      await exerciseApi.create(token, { name: newName.trim(), category: newCat, muscle_groups: [newCat] })
      onExerciseCreated()
      setNewName(''); setShowCreate(false)
    } catch {
      setError('Name bereits vergeben oder ungültig.')
    } finally { setSaving(false) }
  }

  const overlayBg = 'rgba(0,0,0,0.7)'
  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)' }
  const inputStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as any

  return (
    <div className="fixed inset-0 flex items-end sm:items-center justify-center z-50 p-4" style={{ background: overlayBg }}>
      <div className="w-full max-w-md flex flex-col rounded-2xl overflow-hidden" style={{ ...cardStyle, height: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
          {showCreate ? (
            <button onClick={() => setShowCreate(false)} className="flex items-center gap-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              ← Zurück
            </button>
          ) : (
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Übung auswählen</p>
          )}
          <button onClick={onClose} className="text-xl leading-none" style={{ color: 'var(--text-muted)' }}>×</button>
        </div>

        {!showCreate ? (
          <>
            {/* Search */}
            <div className="px-3 py-2 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <input autoFocus type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Übungen suchen…" className="w-full rounded-xl px-4 py-2.5 text-sm outline-none" style={inputStyle} />
            </div>

            {/* Category filter */}
            <div className="flex gap-2 px-3 py-2 overflow-x-auto shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              {CATEGORIES.map((cat) => (
                <button key={cat} onClick={() => setCategory(cat)}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap transition-all"
                  style={{
                    background: category === cat ? 'var(--accent)' : 'var(--bg-secondary)',
                    color: category === cat ? 'white' : 'var(--text-secondary)',
                  }}>
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <div className="text-center py-8 space-y-3">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Keine Übungen gefunden</p>
                  <button onClick={() => { setNewName(search); setShowCreate(true) }}
                    className="text-sm font-medium" style={{ color: 'var(--accent)' }}>
                    + "{search || 'Neue Übung'}" erstellen
                  </button>
                </div>
              ) : (
                filtered.map((ex) => (
                  <button key={ex.id} onClick={() => onSelect(ex)}
                    className="w-full text-left px-4 py-3 transition-all"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 mr-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ex.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{translateMuscleGroups(ex.muscle_groups)}</p>
                      </div>
                      <span className="text-xs font-medium shrink-0" style={{ color: 'var(--accent)' }}>{ex.xp_per_set} XP</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
              <button onClick={() => setShowCreate(true)}
                className="w-full py-2.5 text-sm font-medium rounded-xl transition-all"
                style={{ color: 'var(--accent)', background: 'var(--accent-light)' }}>
                + Eigene Übung erstellen
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>Neue Übung</p>
            {error && (
              <div className="rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>{error}</div>
            )}
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Name</label>
                <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. Farmers Walk" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Kategorie</label>
                <select value={newCat} onChange={(e) => setNewCat(e.target.value as Exercise['category'])}
                  className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle}>
                  <option value="strength">Kraft</option>
                  <option value="cardio">Cardio</option>
                  <option value="core">Core</option>
                  <option value="flexibility">Dehnung</option>
                  <option value="sport">Sport</option>
                  <option value="custom">Sonstiges</option>
                </select>
              </div>
              <button type="submit" disabled={saving || !newName.trim()}
                className="w-full rounded-xl py-3 text-sm font-semibold transition-all"
                style={{ background: 'var(--accent)', color: 'white', opacity: (saving || !newName.trim()) ? 0.5 : 1 }}>
                {saving ? 'Erstellen…' : 'Übung erstellen'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
