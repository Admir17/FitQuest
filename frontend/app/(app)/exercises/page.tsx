'use client'

import { useEffect, useState } from 'react'
import { useWorkout } from '../../../hooks/useWorkout'
import type { Exercise } from '../../../hooks/useWorkout'
import { exerciseApi } from '../../../lib/api'
import { useAtomValue } from 'jotai'
import { accessTokenWithStorageAtom } from '../../../store/atoms'
import { translateMuscleGroups, CATEGORY_LABELS as CAT } from '../../../lib/translations'
import { playAchievementSound } from '../../../lib/sounds'

const CATEGORIES = ['alle', 'strength', 'cardio', 'core', 'flexibility']
const CATEGORY_LABELS = CAT

export default function ExercisesPage() {
  const token = useAtomValue(accessTokenWithStorageAtom)
  const { exercises, loading, loadExercises } = useWorkout()
  const [category, setCategory]       = useState('alle')
  const [search, setSearch]           = useState('')
  const [showForm, setShowForm]       = useState(false)
  const [newName, setNewName]         = useState('')
  const [newCat, setNewCat]           = useState<Exercise['category']>('strength')
  const [saving, setSaving]           = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [deleteId, setDeleteId]       = useState<string | null>(null)
  const [toastAchievements, setToastAchievements] = useState<Array<{ name: string; icon: string; xp_reward: number }> | null>(null)
  const [toastVisible, setToastVisible] = useState(false)
  const [barStarted, setBarStarted]       = useState(false)
  const [barRunning, setBarRunning] = useState(false)

  useEffect(() => { loadExercises() }, [loadExercises])

  const filtered = exercises.filter((ex) =>
    (category === 'alle' || ex.category === category) &&
    ex.name.toLowerCase().includes(search.toLowerCase())
  )

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newName.trim() || !token) return
    setSaving(true)
    setCreateError(null)
    try {
      const res = await exerciseApi.create(token, { name: newName.trim(), category: newCat, muscle_groups: [newCat] }) as any
      setNewName(''); setShowForm(false); loadExercises()
      const events = res?.events ?? []
      const achievements = events
        .filter((e: any) => e.type === 'ACHIEVEMENT_UNLOCKED')
        .map((e: any) => ({ name: e.payload.name, icon: e.payload.icon, xp_reward: e.payload.xp_reward }))
      if (achievements.length > 0) {
        playAchievementSound()
        setToastAchievements(achievements)
        setBarRunning(false)
        setToastVisible(true)
        // Small delay so browser renders width:100% before starting transition
        setTimeout(() => setBarRunning(true), 50)
        setTimeout(() => {
          setToastVisible(false)
          setTimeout(() => { setToastAchievements(null); setBarRunning(false) }, 400)
        }, 3000)
      }
    } catch (err: any) {
      setCreateError(err.message ?? 'Fehler beim Erstellen.')
    } finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!token) return
    await exerciseApi.delete(token, id)
    setDeleteId(null); loadExercises()
  }

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)' }
  const inputStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as any

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Übungen</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="text-sm font-medium px-4 py-2 rounded-xl transition-all"
          style={{ background: 'var(--accent)', color: 'white' }}>
          + Eigene
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl p-4 space-y-3" style={cardStyle}>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Neue Übung</p>
          <form onSubmit={handleCreate} className="space-y-3">
            {createError && (
              <div className="rounded-xl px-3 py-2 text-sm" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>
                {createError}
              </div>
            )}
            <input autoFocus type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
              placeholder="Name der Übung" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
            <select value={newCat} onChange={(e) => setNewCat(e.target.value as Exercise['category'])}
              className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle}>
              <option value="strength">Kraft</option>
              <option value="cardio">Cardio</option>
              <option value="core">Core</option>
              <option value="flexibility">Dehnung</option>
              <option value="sport">Sport</option>
              <option value="custom">Sonstiges</option>
            </select>
            <div className="flex gap-2">
              <button type="submit" disabled={saving || !newName.trim()}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all"
                style={{ background: 'var(--accent)', color: 'white', opacity: (saving || !newName.trim()) ? 0.5 : 1 }}>
                {saving ? 'Erstellen…' : 'Erstellen'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setCreateError(null) }}
                className="px-4 text-sm rounded-xl" style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      )}

      <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
        placeholder="Übungen suchen…"
        className="w-full rounded-xl px-4 py-3 text-sm outline-none"
        style={{ ...inputStyle, border: '1px solid var(--border)' }} />

      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className="text-xs font-medium px-3 py-2 rounded-xl whitespace-nowrap transition-all"
            style={{
              background: category === cat ? 'var(--accent)' : 'var(--bg-card)',
              color: category === cat ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}>
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>Laden…</div>
      ) : (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          {filtered.map((ex, i) => (
            <div key={ex.id} className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: i < filtered.length - 1 ? `1px solid var(--border)` : 'none' }}>
              <div className="min-w-0 mr-3">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ex.name}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {CATEGORY_LABELS[ex.category] ?? ex.category}
                  {ex.muscle_groups.length > 0 && ` · ${translateMuscleGroups(ex.muscle_groups)}`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!ex.is_system && (
                  <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>Eigene</span>
                )}
                <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{ex.xp_per_set} XP</span>
                {!ex.is_system && (
                  <button onClick={() => setDeleteId(ex.id)}
                    className="text-xs px-2 py-1 rounded-lg transition-all"
                    style={{ color: 'var(--red)', background: 'var(--red-light)' }}>
                    Löschen
                  </button>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Übungen gefunden</p>
          )}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pb-28 sm:pb-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={cardStyle}>
            <h2 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Übung löschen?</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Diese eigene Übung wird unwiderruflich gelöscht.</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold" style={{ background: 'var(--red)', color: 'white' }}>
                Ja, löschen
              </button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl py-3 text-sm font-medium"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Achievement toast */}
      {toastAchievements && (
        <div className={`fixed bottom-24 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-72 ${toastVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div className="rounded-2xl shadow-2xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {toastAchievements.map((ach, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-3">
                <span className="text-2xl">{ach.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Achievement freigeschaltet!</p>
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ach.name}</p>
                </div>
                <span className="text-xs font-medium shrink-0" style={{ color: '#f59e0b' }}>+{ach.xp_reward} XP</span>
              </div>
            ))}
            <div className="h-1" style={{ background: 'var(--bg-secondary)' }}>
              <div className="h-full transition-all ease-linear" style={{ background: '#f59e0b', width: barRunning ? '0%' : '100%', transitionDuration: barRunning ? '2950ms' : '0ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
