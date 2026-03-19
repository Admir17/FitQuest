'use client'

import { useEffect, useState } from 'react'
import { useWorkout } from '../../../hooks/useWorkout'
import type { Exercise } from '../../../hooks/useWorkout'
import { exerciseApi } from '../../../lib/api'
import { useAtomValue } from 'jotai'
import { accessTokenWithStorageAtom } from '../../../store/atoms'

const CATEGORIES = ['alle', 'strength', 'cardio', 'core', 'flexibility']
const CATEGORY_LABELS: Record<string, string> = {
  alle: 'Alle', strength: 'Kraft', cardio: 'Cardio', core: 'Core', flexibility: 'Dehnung'
}

export default function ExercisesPage() {
  const token = useAtomValue(accessTokenWithStorageAtom)
  const { exercises, loading, loadExercises } = useWorkout()

  const [category, setCategory]   = useState('alle')
  const [search, setSearch]       = useState('')
  const [showForm, setShowForm]   = useState(false)
  const [newName, setNewName]     = useState('')
  const [newCat, setNewCat]       = useState<Exercise['category']>('strength')
  const [saving, setSaving]       = useState(false)
  const [deleteId, setDeleteId]   = useState<string | null>(null)

  useEffect(() => { loadExercises() }, [loadExercises])

  const filtered = exercises.filter((ex) => {
    const matchCat    = category === 'alle' || ex.category === category
    const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !token) return
    setSaving(true)
    try {
      await exerciseApi.create(token, { name: newName.trim(), category: newCat, muscle_groups: [newCat] })
      setNewName('')
      setShowForm(false)
      loadExercises()
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!token) return
    await exerciseApi.delete(token, id)
    setDeleteId(null)
    loadExercises()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Übungen</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          + Eigene Übung
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-xl p-4 mb-6 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Neue eigene Übung</h2>
          <input
            autoFocus type="text" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Name der Übung"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
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
          <div className="flex gap-2">
            <button
              type="submit" disabled={saving || !newName.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium py-2 rounded-lg transition-colors"
            >
              {saving ? 'Speichern…' : 'Erstellen'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 text-sm text-gray-500 hover:text-gray-700">
              Abbrechen
            </button>
          </div>
        </form>
      )}

      <input
        type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Übungen suchen…"
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      />

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat} onClick={() => setCategory(cat)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
              category === cat
                ? 'bg-indigo-600 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Laden…</div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {filtered.map((ex, i) => (
            <div
              key={ex.id}
              className={`px-4 py-3 flex items-center justify-between ${
                i < filtered.length - 1 ? 'border-b border-gray-100' : ''
              }`}
            >
              <div>
                <p className="text-sm font-medium text-gray-900">{ex.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {CATEGORY_LABELS[ex.category] ?? ex.category}
                  {ex.muscle_groups.length > 0 && ` · ${ex.muscle_groups.slice(0, 3).join(', ')}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {!ex.is_system && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">Eigene</span>
                )}
                <span className="text-xs text-indigo-600 font-medium">{ex.xp_per_set} XP</span>
                {!ex.is_system && (
                  <button
                    onClick={() => setDeleteId(ex.id)}
                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Löschen
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Keine Übungen gefunden</p>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Übung löschen?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Diese eigene Übung wird unwiderruflich gelöscht.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
              >
                Ja, löschen
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-gray-200 text-gray-600 font-medium rounded-lg py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
