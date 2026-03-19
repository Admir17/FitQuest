'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAtomValue, useSetAtom } from 'jotai'
import { accessTokenWithStorageAtom, workoutFinishedAtom } from '../../../../store/atoms'
import { workoutApi, userApi } from '../../../../lib/api'
import { useWorkout } from '../../../../hooks/useWorkout'
import type { Exercise, WorkoutSet, GameEvent } from '../../../../hooks/useWorkout'
import ExercisePicker from '../../../../components/workout/ExercisePicker'
import XPToast from '../../../../components/workout/XPToast'

const MAX_EXERCISES = 15
const MAX_SETS_PER_EXERCISE = 5
const MAX_REPS = 15
const MAX_WEIGHT_KG = 100

interface SessionData {
  id: string
  name: string
  started_at: string
  finished_at: string | null
  xp_earned: number
  sets: (WorkoutSet & { exercise_name: string })[]
}

export default function WorkoutLoggerPage() {
  const { id }  = useParams<{ id: string }>()
  const router  = useRouter()
  const token   = useAtomValue(accessTokenWithStorageAtom)
  const setWorkoutFinished = useSetAtom(workoutFinishedAtom)

  const { exercises, loadExercises, addSet, finishSession } = useWorkout()

  const [session, setSession]           = useState<SessionData | null>(null)
  const [loading, setLoading]           = useState(true)
  const [showPicker, setShowPicker]     = useState(false)
  const [selectedExercise, setSelected] = useState<Exercise | null>(null)
  const [reps, setReps]                 = useState('')
  const [weight, setWeight]             = useState('')
  const [saving, setSaving]             = useState(false)
  const [finishing, setFinishing]       = useState(false)
  const [toastEvents, setToastEvents]   = useState<GameEvent[] | null>(null)
  const [editingName, setEditingName]   = useState(false)
  const [nameValue, setNameValue]       = useState('')
  const [savingName, setSavingName]     = useState(false)
  const [limitMsg, setLimitMsg]         = useState<string | null>(null)

  function showLimit(msg: string) {
    setLimitMsg(msg)
    setTimeout(() => setLimitMsg(null), 3000)
  }

  const loadSession = useCallback(async () => {
    if (!token) return
    try {
      const res = await workoutApi.get(token, id) as { data: SessionData }
      setSession(res.data)
      setNameValue(res.data.name)
    } finally {
      setLoading(false)
    }
  }, [token, id])

  useEffect(() => { loadSession(); loadExercises() }, [loadSession, loadExercises])

  // If user navigates away without adding any sets, delete the empty session
  useEffect(() => {
    return () => {
      if (session && session.sets.length === 0 && !session.finished_at && token) {
        // Use keepalive fetch so it completes even after navigation
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/workouts/${session.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
          keepalive: true,
        }).catch(() => {})
      }
    }
  }, [session?.id, session?.sets.length, session?.finished_at, token])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!nameValue.trim() || !token) return
    setSavingName(true)
    try {
      await workoutApi.rename(token, id, nameValue.trim())
      setSession(prev => prev ? { ...prev, name: nameValue.trim() } : prev)
      setEditingName(false)
    } finally { setSavingName(false) }
  }

  const setsByExercise = session?.sets.reduce((acc, set) => {
    const key = set.exercise_id
    if (!acc[key]) acc[key] = { name: set.exercise_name, sets: [] }
    acc[key].sets.push(set)
    return acc
  }, {} as Record<string, { name: string; sets: WorkoutSet[] }>) ?? {}

  const nextSetNumber = selectedExercise ? (setsByExercise[selectedExercise.id]?.sets.length ?? 0) + 1 : 1

  async function handleDeleteSet(setId: string) {
    if (!token || !session) return
    await workoutApi.deleteSet(token, session.id, setId)
    const remaining = session.sets.filter(s => s.id !== setId)
    if (remaining.length === 0) { router.push('/workouts'); return }
    await loadSession()
  }

  async function handleAddSet(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedExercise || !session) return
    const uniqueExercises = Object.keys(setsByExercise).length
    const hasThisExercise = !!setsByExercise[selectedExercise.id]
    if (!hasThisExercise && uniqueExercises >= MAX_EXERCISES) { showLimit(`Max. ${MAX_EXERCISES} Übungen pro Workout.`); return }
    if (nextSetNumber > MAX_SETS_PER_EXERCISE) { showLimit(`Max. ${MAX_SETS_PER_EXERCISE} Sätze pro Übung.`); return }
    if (reps && parseInt(reps) > MAX_REPS) { showLimit(`Max. ${MAX_REPS} Wiederholungen.`); return }
    if (weight && parseFloat(weight) > MAX_WEIGHT_KG) { showLimit(`Max. ${MAX_WEIGHT_KG} kg.`); return }
    setSaving(true)
    try {
      await addSet(session.id, {
        exercise_id: selectedExercise.id, set_number: nextSetNumber,
        reps: reps ? parseInt(reps) : undefined,
        weight_kg: weight ? parseFloat(weight) : undefined,
      })
      setReps(''); setWeight('')
      await loadSession()
    } finally { setSaving(false) }
  }

  async function handleFinish() {
    if (!session) return
    if (session.sets.length === 0) { showLimit('Mindestens einen Satz erfassen.'); return }
    setFinishing(true)
    try {
      const userBefore = await userApi.getMe(token!) as any
      await finishSession(session.id)
      const userAfter = await userApi.getMe(token!) as any
      setWorkoutFinished({ xp: session.xp_earned, levelUp: userAfter.data.level > userBefore.data.level ? userAfter.data.level : undefined })
      router.push('/workouts')
    } finally { setFinishing(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Laden…</div>
  if (!session) return <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Workout nicht gefunden.</div>

  const isFinished = !!session.finished_at
  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)' }
  const inputStyle = { background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' } as any

  return (
    <div className="space-y-4 pb-8">

      {limitMsg && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium shadow-lg"
          style={{ background: 'var(--red)', color: 'white', maxWidth: 'calc(100vw - 32px)' }}>
          <span>⚠️</span><span className="flex-1">{limitMsg}</span>
          <button onClick={() => setLimitMsg(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="rounded-2xl p-4" style={cardStyle}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <form onSubmit={handleSaveName} className="flex gap-2 items-center">
                <input autoFocus type="text" value={nameValue} maxLength={40}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="flex-1 text-lg font-bold bg-transparent border-b-2 outline-none pb-0.5 min-w-0"
                  style={{ borderColor: 'var(--accent)', color: 'var(--text-primary)' }} />
                <button type="submit" disabled={savingName} className="text-sm font-medium shrink-0" style={{ color: 'var(--accent)' }}>
                  {savingName ? '…' : 'OK'}
                </button>
                <button type="button" onClick={() => { setEditingName(false); setNameValue(session.name) }}
                  className="text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>✕</button>
              </form>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditingName(true)}>
                <h1 className="text-lg font-bold truncate" style={{ color: 'var(--text-primary)' }}>{session.name}</h1>
                <span className="text-xs shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">✏️</span>
              </div>
            )}
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {new Date(session.started_at).toLocaleDateString('de-CH', { weekday: 'short', day: 'numeric', month: 'short' })}
              {isFinished ? ' · Abgeschlossen' : ' · Läuft'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{session.xp_earned}</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>XP</p>
          </div>
        </div>
      </div>

      {/* Sets logged */}
      {Object.keys(setsByExercise).length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          {Object.entries(setsByExercise).map(([exerciseId, { name, sets }]) => (
            <div key={exerciseId} className="border-b last:border-0" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-2" style={{ background: 'var(--bg-secondary)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{name}</p>
              </div>
              {sets.map((set) => (
                <div key={set.id} className="px-4 py-3 flex items-center justify-between">
                  <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    Satz {set.set_number}
                    {set.reps && <span style={{ color: 'var(--text-secondary)' }}> · {set.reps} Wdh.</span>}
                    {set.weight_kg && <span style={{ color: 'var(--text-secondary)' }}> @ {set.weight_kg}kg</span>}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>+{set.xp_awarded} XP</span>
                    <button onClick={() => handleDeleteSet(set.id)}
                      className="text-xs transition-all" style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={e => (e.currentTarget.style.color = 'var(--red)')}
                      onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Add set form */}
      <div className="rounded-2xl p-4" style={cardStyle}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Satz erfassen</p>
        <button onClick={() => setShowPicker(true)}
          className="w-full text-left rounded-xl px-4 py-3 text-sm mb-3 flex items-center justify-between transition-all"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: selectedExercise ? 'var(--text-primary)' : 'var(--text-muted)' }}>
          <span>{selectedExercise ? selectedExercise.name : 'Übung auswählen…'}</span>
          <span style={{ color: 'var(--text-muted)' }}>▾</span>
        </button>

        {selectedExercise && (
          <form onSubmit={handleAddSet} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Wdh. (max. {MAX_REPS})</label>
                <input type="number" min="1" max={MAX_REPS} value={reps} onChange={(e) => setReps(e.target.value)}
                  placeholder="z.B. 8" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--text-secondary)' }}>Gewicht (max. {MAX_WEIGHT_KG}kg)</label>
                <input type="number" min="0" max={MAX_WEIGHT_KG} step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)}
                  placeholder="z.B. 80" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Satz {nextSetNumber}/{MAX_SETS_PER_EXERCISE} · {selectedExercise.xp_per_set}+ XP
            </p>
            <button type="submit" disabled={saving || (!reps && !weight)}
              className="w-full rounded-xl py-3 text-sm font-semibold transition-all active:scale-95"
              style={{ background: 'var(--accent)', color: 'white', opacity: (saving || (!reps && !weight)) ? 0.5 : 1 }}>
              {saving ? 'Speichern…' : `Satz ${nextSetNumber} erfassen`}
            </button>
          </form>
        )}
      </div>

      <button onClick={isFinished ? () => router.push('/workouts') : handleFinish} disabled={finishing}
        className="w-full rounded-xl py-3 text-sm font-medium transition-all active:scale-95"
        style={{
          border: '1px solid var(--border)',
          color: isFinished ? 'var(--accent)' : 'var(--text-secondary)',
          background: isFinished ? 'var(--accent-light)' : 'transparent',
          opacity: finishing ? 0.6 : 1
        }}>
        {finishing ? 'Wird abgeschlossen…' : isFinished ? 'Fertig' : 'Workout beenden'}
      </button>

      {showPicker && (
        <ExercisePicker
          exercises={exercises}
          onSelect={(ex) => { setSelected(ex); setShowPicker(false) }}
          onClose={() => setShowPicker(false)}
          onExerciseCreated={() => loadExercises()}
        />
      )}

      {toastEvents && toastEvents.length > 0 && (
        <XPToast events={toastEvents} onDone={() => setToastEvents(null)} />
      )}
    </div>
  )
}
