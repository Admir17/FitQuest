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

  useEffect(() => {
    loadSession()
    loadExercises()
  }, [loadSession, loadExercises])

  async function handleSaveName(e: React.FormEvent) {
    e.preventDefault()
    if (!nameValue.trim() || !token) return
    setSavingName(true)
    try {
      await workoutApi.rename(token, id, nameValue.trim())
      setSession(prev => prev ? { ...prev, name: nameValue.trim() } : prev)
      setEditingName(false)
    } finally {
      setSavingName(false)
    }
  }

  const setsByExercise = session?.sets.reduce((acc, set) => {
    const key = set.exercise_id
    if (!acc[key]) acc[key] = { name: set.exercise_name, sets: [] }
    acc[key].sets.push(set)
    return acc
  }, {} as Record<string, { name: string; sets: WorkoutSet[] }>) ?? {}

  const nextSetNumber = selectedExercise
    ? (setsByExercise[selectedExercise.id]?.sets.length ?? 0) + 1
    : 1

  async function handleDeleteSet(setId: string) {
    if (!token || !session) return
    await workoutApi.deleteSet(token, session.id, setId)
    // If this was the last set, session is auto-deleted — go back to history
    const remaining = session.sets.filter(s => s.id !== setId)
    if (remaining.length === 0) {
      router.push('/workouts')
      return
    }
    await loadSession()
  }

  async function handleAddSet(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedExercise || !session) return

    const uniqueExercises = Object.keys(setsByExercise).length
    const hasThisExercise = !!setsByExercise[selectedExercise.id]

    if (!hasThisExercise && uniqueExercises >= MAX_EXERCISES) {
      showLimit(`Maximal ${MAX_EXERCISES} Übungen pro Workout erlaubt.`)
      return
    }
    if (nextSetNumber > MAX_SETS_PER_EXERCISE) {
      showLimit(`Maximal ${MAX_SETS_PER_EXERCISE} Sätze pro Übung erlaubt.`)
      return
    }
    if (reps && parseInt(reps) > MAX_REPS) {
      showLimit(`Maximal ${MAX_REPS} Wiederholungen pro Satz erlaubt.`)
      return
    }
    if (weight && parseFloat(weight) > MAX_WEIGHT_KG) {
      showLimit(`Maximal ${MAX_WEIGHT_KG} kg pro Satz erlaubt.`)
      return
    }

    setSaving(true)
    try {
      await addSet(session.id, {
        exercise_id: selectedExercise.id,
        set_number: nextSetNumber,
        reps: reps ? parseInt(reps) : undefined,
        weight_kg: weight ? parseFloat(weight) : undefined,
      })
      setReps('')
      setWeight('')
      await loadSession()
    } finally {
      setSaving(false)
    }
  }

  async function handleFinish() {
    if (!session) return
    if (session.sets.length === 0) {
      showLimit('Das Workout muss mindestens einen Satz enthalten.')
      return
    }
    setFinishing(true)
    try {
      // Get user level before finishing
      const userBefore = await userApi.getMe(token!) as any
      const levelBefore = userBefore.data.level

      await finishSession(session.id)

      // Get user level after finishing to detect level up
      const userAfter = await userApi.getMe(token!) as any
      const levelAfter = userAfter.data.level

      setWorkoutFinished({
        xp: session.xp_earned,
        levelUp: levelAfter > levelBefore ? levelAfter : undefined,
      })
      router.push('/workouts')
    } finally {
      setFinishing(false)
    }
  }

  if (loading) return <div className="text-center text-gray-400 py-16">Laden…</div>
  if (!session) return <div className="text-center text-gray-400 py-16">Workout nicht gefunden.</div>

  const isFinished = !!session.finished_at

  return (
    <div className="max-w-xl mx-auto">

      {/* Limit message */}
      {limitMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white rounded-xl px-5 py-3 shadow-lg text-sm font-medium flex items-center gap-3">
          <span>⚠️</span>
          <span>{limitMsg}</span>
          <button onClick={() => setLimitMsg(null)} className="text-red-200 hover:text-white ml-1">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex-1 mr-4">
          {editingName ? (
            <form onSubmit={handleSaveName} className="flex gap-2 items-center">
              <input
                autoFocus type="text" value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                className="flex-1 text-xl font-bold border-b-2 border-indigo-500 focus:outline-none bg-transparent pb-0.5"
              />
              <button type="submit" disabled={savingName} className="text-indigo-600 text-sm font-medium disabled:opacity-60">
                {savingName ? '…' : 'OK'}
              </button>
              <button type="button" onClick={() => { setEditingName(false); setNameValue(session.name) }} className="text-gray-400 text-sm">✕</button>
            </form>
          ) : (
            <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setEditingName(true)}>
              <h1 className="text-2xl font-bold text-gray-900">{session.name}</h1>
              <span className="text-gray-300 group-hover:text-gray-500 transition-colors">✏️</span>
            </div>
          )}
          <p className="text-sm text-gray-400 mt-1">
            {new Date(session.started_at).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
            {isFinished ? ' · Abgeschlossen' : ' · Läuft'}
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-indigo-600">{session.xp_earned}</p>
          <p className="text-xs text-gray-400">XP verdient</p>
        </div>
      </div>

      {/* Sets logged */}
      {Object.keys(setsByExercise).length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl mb-6 overflow-hidden">
          {Object.entries(setsByExercise).map(([exerciseId, { name, sets }]) => (
            <div key={exerciseId} className="border-b border-gray-100 last:border-0">
              <div className="px-4 py-2 bg-gray-50">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{name}</p>
              </div>
              {sets.map((set) => (
                <div key={set.id} className="px-4 py-2.5 flex items-center justify-between">
                  <p className="text-sm text-gray-700">
                    Satz {set.set_number}
                    {set.reps && ` · ${set.reps} Wdh.`}
                    {set.weight_kg && ` @ ${set.weight_kg}kg`}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-indigo-600 font-medium">+{set.xp_awarded} XP</span>
                    <button
                      onClick={() => handleDeleteSet(set.id)}
                      className="text-gray-300 hover:text-red-400 text-xs transition-colors"
                      title="Satz entfernen"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Add set form */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Satz erfassen</h2>
        <button
          onClick={() => setShowPicker(true)}
          className="w-full text-left border border-gray-200 rounded-lg px-3 py-2.5 text-sm mb-3 flex items-center justify-between hover:border-indigo-300 transition-colors"
        >
          <span className={selectedExercise ? 'text-gray-900' : 'text-gray-400'}>
            {selectedExercise ? selectedExercise.name : 'Übung auswählen…'}
          </span>
          <span className="text-gray-400 text-xs">▾</span>
        </button>

        {selectedExercise && (
          <form onSubmit={handleAddSet} className="space-y-3">
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Wdh. (max. {MAX_REPS})</label>
                <input
                  type="number" min="1" max={MAX_REPS} value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder="z.B. 8"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Gewicht (max. {MAX_WEIGHT_KG}kg)</label>
                <input
                  type="number" min="0" max={MAX_WEIGHT_KG} step="0.5" value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="z.B. 80"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <p className="text-xs text-gray-400">Satz {nextSetNumber}/{MAX_SETS_PER_EXERCISE} · {selectedExercise.xp_per_set}+ XP</p>
            <button
              type="submit" disabled={saving || (!reps && !weight)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg py-2.5 text-sm transition-colors"
            >
              {saving ? 'Speichern…' : `Satz ${nextSetNumber} erfassen`}
            </button>
          </form>
        )}
      </div>

      {!isFinished && (
        <button
          onClick={handleFinish} disabled={finishing}
          className="w-full border-2 border-gray-200 hover:border-gray-300 text-gray-600 font-medium rounded-xl py-3 text-sm transition-colors"
        >
          {finishing ? 'Wird abgeschlossen…' : 'Workout beenden'}
        </button>
      )}

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
