'use client'

import { useState, useMemo } from 'react'
import { useAtomValue } from 'jotai'
import { accessTokenWithStorageAtom } from '../../store/atoms'
import { exerciseApi } from '../../lib/api'
import type { Exercise } from '../../hooks/useWorkout'

interface ExercisePickerProps {
  exercises: Exercise[]
  onSelect: (exercise: Exercise) => void
  onClose: () => void
  onExerciseCreated: () => void
}

const CATEGORIES = ['alle', 'strength', 'cardio', 'core', 'flexibility']
const CATEGORY_LABELS: Record<string, string> = {
  alle: 'Alle', strength: 'Kraft', cardio: 'Cardio', core: 'Core', flexibility: 'Dehnung'
}

export default function ExercisePicker({ exercises, onSelect, onClose, onExerciseCreated }: ExercisePickerProps) {
  const token = useAtomValue(accessTokenWithStorageAtom)

  const [search, setSearch]       = useState('')
  const [category, setCategory]   = useState('alle')
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName]     = useState('')
  const [newCat, setNewCat]       = useState<Exercise['category']>('strength')
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)

  const filtered = useMemo(() => {
    return exercises.filter((ex) => {
      const matchesSearch   = ex.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = category === 'alle' || ex.category === category
      return matchesSearch && matchesCategory
    })
  }, [exercises, search, category])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !token) return
    setSaving(true)
    setError(null)
    try {
    await exerciseApi.create(token, {
      name: newName.trim(),
      category: newCat,
      muscle_groups: [newCat],  // use category as default muscle group
    })
      onExerciseCreated()
      setNewName('')
      setShowCreate(false)
    } catch {
      setError('Name bereits vergeben oder ungültig.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-900">Übung auswählen</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        {!showCreate ? (
          <>
            {/* Search */}
            <div className="p-3 border-b border-gray-100 shrink-0">
              <input
                autoFocus type="text" value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Übungen suchen…"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Category filter */}
            <div className="flex gap-2 px-3 py-2 border-b border-gray-100 overflow-x-auto shrink-0 min-h-[44px] items-center">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat} onClick={() => setCategory(cat)}
                  className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
                    category === cat ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Exercise list */}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm mb-3">Keine Übungen gefunden</p>
                  <button
                    onClick={() => { setNewName(search); setShowCreate(true) }}
                    className="text-indigo-600 text-sm font-medium hover:underline"
                  >
                    + „{search || 'Neue Übung'}" erstellen
                  </button>
                </div>
              ) : (
                filtered.map((ex) => (
                  <button
                    key={ex.id} onClick={() => onSelect(ex)}
                    className="w-full text-left px-4 py-3 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{ex.muscle_groups.slice(0, 3).join(', ')}</p>
                      </div>
                      <span className="text-xs text-indigo-600 font-medium">{ex.xp_per_set} XP</span>
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Footer: create button */}
            <div className="p-3 border-t border-gray-100 shrink-0">
              <button
                onClick={() => setShowCreate(true)}
                className="w-full text-sm text-indigo-600 font-medium py-2 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                + Eigene Übung erstellen
              </button>
            </div>
          </>
        ) : (
          /* Create form */
          <div className="flex flex-col flex-1 p-4">
            <button
              onClick={() => setShowCreate(false)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
            >
              ← Zurück
            </button>
            <h3 className="font-semibold text-gray-900 mb-4">Neue Übung erstellen</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Name</label>
                <input
                  autoFocus type="text" value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="z.B. Farmers Walk"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Kategorie</label>
                <select
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value as Exercise['category'])}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="strength">Kraft</option>
                  <option value="cardio">Cardio</option>
                  <option value="core">Core</option>
                  <option value="flexibility">Dehnung</option>
                  <option value="sport">Sport</option>
                  <option value="custom">Sonstiges</option>
                </select>
              </div>
              <button
                type="submit" disabled={saving || !newName.trim()}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
              >
                {saving ? 'Erstellen…' : 'Übung erstellen'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
