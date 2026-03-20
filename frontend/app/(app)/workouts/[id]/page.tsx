'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAtomValue, useSetAtom } from 'jotai'
import { accessTokenWithStorageAtom, workoutFinishedAtom, currentUserAtom } from '../../../../store/atoms'
import { workoutApi, userApi } from '../../../../lib/api'
import { useWorkout } from '../../../../hooks/useWorkout'
import type { Exercise, WorkoutSet, GameEvent } from '../../../../hooks/useWorkout'
import ExercisePicker from '../../../../components/workout/ExercisePicker'
import XPToast from '../../../../components/workout/XPToast'

const MAX_EXERCISES = 15
const MAX_SETS_PER_EXERCISE = 5
const MAX_REPS = 15
const MAX_WEIGHT_KG = 100

// Special marker for sessions not yet created in the backend
const PENDING_ID = 'pending'

// Preview XP calculation (mirrors backend logic)
function previewXp(exercise: { xp_per_set: number } | null, repsVal: string, weightVal: string): number {
  if (!exercise) return 0
  const reps = repsVal ? parseInt(repsVal) : 0
  const weight = weightVal ? parseFloat(weightVal) : 0
  return exercise.xp_per_set + Math.floor(weight / 20) * 2 + Math.floor(reps / 5)
}

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
  const setUser             = useSetAtom(currentUserAtom)

  const { exercises, loadExercises, addSet, finishSession, startSession } = useWorkout()

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
  // Real session ID once created in backend
  const [realSessionId, setRealSessionId] = useState<string | null>(id === PENDING_ID ? null : id)

  function showLimit(msg: string) {
    setLimitMsg(msg)
    setTimeout(() => setLimitMsg(null), 3000)
  }

  const loadSession = useCallback(async (sessionId: string) => {
    if (!token) return
    try {
      const res = await workoutApi.get(token, sessionId) as { data: SessionData }
      setSession(res.data)
      setNameValue(res.data.name)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    if (id === PENDING_ID) {
      // Session not yet created — show empty form with default name
      const today = new Date().toLocaleDateString('de-CH', { weekday: 'long', day: 'numeric', month: 'long' })
      setSession({
        id: PENDING_ID,
        name: 'Neues Workout',
        started_at: new Date().toISOString(),
        finished_at: null,
        xp_earned: 0,
        sets: [],
      })
      setNameValue('Neues Workout')
      setLoading(false)
    } else {
      loadSession(id)
    }
    loadExercises()
  }, [id, loadSession, loadExercises])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!nameValue.trim()) return
    // If session not yet in backend, just update local state
    if (!realSessionId) {
      setSession(prev => prev ? { ...prev, name: nameValue.trim() } : prev)
      setEditingName(false)
      return
    }
    if (!token) return
    setSavingName(true)
    try {
      await workoutApi.rename(token, realSessionId, nameValue.trim())
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
    if (!token || !realSessionId || !session) return
    await workoutApi.deleteSet(token, realSessionId, setId)
    const remaining = session.sets.filter(s => s.id !== setId)
    if (remaining.length === 0) { router.push('/workouts'); return }
    await loadSession(realSessionId)
  }

  async function handleAddSet(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedExercise || !session || !token) return

    const uniqueExercises = Object.keys(setsByExercise).length
    const hasThisExercise = !!setsByExercise[selectedExercise.id]
    if (!hasThisExercise && uniqueExercises >= MAX_EXERCISES) { showLimit(`Max. ${MAX_EXERCISES} Übungen pro Workout.`); return }
    if (nextSetNumber > MAX_SETS_PER_EXERCISE) { showLimit(`Max. ${MAX_SETS_PER_EXERCISE} Sätze pro Übung.`); return }
    if (reps && parseInt(reps) > MAX_REPS) { showLimit(`Max. ${MAX_REPS} Wiederholungen.`); return }
    if (weight && parseFloat(weight) > MAX_WEIGHT_KG) { showLimit(`Max. ${MAX_WEIGHT_KG} kg.`); return }

    setSaving(true)
    try {
      let sessionId = realSessionId

      // First set — create session in backend now
      if (!sessionId) {
        const res = await workoutApi.start(token, { name: session.name }) as any
        sessionId = res.data.id
        setRealSessionId(sessionId)
        // Update URL to real session ID without navigation
        window.history.replaceState({}, '', `/workouts/${sessionId}`)
      }

      await addSet(sessionId!, {
        exercise_id: selectedExercise.id,
        set_number: nextSetNumber,
        reps: reps ? parseInt(reps) : undefined,
        weight_kg: weight ? parseFloat(weight) : undefined,
      })
      setReps(''); setWeight('')
      await loadSession(sessionId!)
    } finally { setSaving(false) }
  }

  async function handleFinish() {
    if (!session || !token) return
    if (!realSessionId || session.sets.length === 0) {
      router.push('/workouts')
      return
    }
    setFinishing(true)
    try {
      // Calculate total XP before finishing (preview matches what backend will award)
      const totalXp = session.sets.reduce((total, set) => {
        const ex = exercises.find(e => e.id === set.exercise_id)
        return total + (ex ? previewXp(ex, String(set.reps ?? ''), String(set.weight_kg ?? '')) : 0)
      }, 0)

      const userBefore = await userApi.getMe(token) as any
      const finishRes  = await finishSession(realSessionId) as any
      const userAfter  = await userApi.getMe(token) as any
      setUser(userAfter.data)

      // Extract achievement and streak events from response
      const events = finishRes?.events ?? []
      const achievementEvents = events
        .filter((e: any) => e.type === 'ACHIEVEMENT_UNLOCKED')
        .map((e: any) => ({ name: e.payload.name, icon: e.payload.icon, xp_reward: e.payload.xp_reward }))
      const streakEvent = events.find((e: any) => e.type === 'STREAK_UPDATED')

      setWorkoutFinished({
        xp: totalXp,
        levelUp: userAfter.data.level > userBefore.data.level ? userAfter.data.level : undefined,
        achievements: achievementEvents.length > 0 ? achievementEvents : undefined,
        streak: streakEvent?.payload?.current_streak,
      })
      router.push('/workouts')
    } finally { setFinishing(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Laden…</div>
  if (!session) return <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Workout nicht gefunden.</div>

  const isFinished = !!session.finished_at
  const isPending  = !realSessionId
  const cardStyle  = { background: 'var(--bg-card)', border: '1px solid var(--border)' }
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
              {isFinished ? ' · Abgeschlossen' : isPending ? ' · Noch nicht gespeichert' : ' · Läuft'}
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>
              {session.sets.reduce((total, set) => {
                const ex = exercises.find(e => e.id === set.exercise_id)
                return total + (ex ? previewXp(ex, String(set.reps ?? ''), String(set.weight_kg ?? '')) : 0)
              }, 0)}
            </p>
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
                    <span className="text-xs font-medium" style={{ color: 'var(--accent)' }}>+{exercises.find(e => e.id === set.exercise_id) ? previewXp(exercises.find(e => e.id === set.exercise_id)!, String(set.reps ?? ''), String(set.weight_kg ?? '')) : '?'} XP</span>
                    <button onClick={() => handleDeleteSet(set.id)} className="text-xs transition-all"
                      style={{ color: 'var(--text-muted)' }}
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
                <input type="number" min="0.5" max={MAX_WEIGHT_KG} step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)}
                  placeholder="z.B. 80" className="w-full rounded-xl px-4 py-3 text-sm outline-none" style={inputStyle} />
              </div>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Satz {nextSetNumber}/{MAX_SETS_PER_EXERCISE} · {selectedExercise.xp_per_set}+ XP
              {isPending && <span style={{ color: 'var(--accent)' }}> · Wird beim ersten Satz gespeichert</span>}
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
          opacity: finishing ? 0.6 : 1,
        }}>
        {finishing ? 'Wird abgeschlossen…' : isFinished ? 'Fertig' : isPending ? 'Abbrechen' : 'Workout beenden'}
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
