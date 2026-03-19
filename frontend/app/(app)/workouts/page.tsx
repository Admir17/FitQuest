'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAtom, useAtomValue } from 'jotai'
import { accessTokenWithStorageAtom, workoutFinishedAtom } from '../../../store/atoms'
import { workoutApi } from '../../../lib/api'
import { useWorkout } from '../../../hooks/useWorkout'

interface Session {
  id: string
  name: string
  started_at: string
  finished_at: string | null
  xp_earned: number
}

export default function WorkoutsPage() {
  const router = useRouter()
  const token  = useAtomValue(accessTokenWithStorageAtom)

  const [sessions, setSessions]           = useState<Session[]>([])
  const [loading, setLoading]             = useState(true)
  const [deleteId, setDeleteId]           = useState<string | null>(null)
  const [starting, setStarting]           = useState(false)
  const { startSession }                  = useWorkout()
  const [workoutFinished, setWorkoutFinished] = useAtom(workoutFinishedAtom)
  const [showToast, setShowToast]         = useState(false)

  async function load() {
    if (!token) return
    try {
      const res = await workoutApi.list(token) as { data: Session[] }
      setSessions(res.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  // Show toast when arriving from finished workout
  useEffect(() => {
    if (!workoutFinished) return
    setShowToast(true)
    const t = setTimeout(() => {
      setShowToast(false)
      setTimeout(() => setWorkoutFinished(null), 400)
    }, 3000)
    return () => clearTimeout(t)
  }, [workoutFinished])

  async function handleDelete(id: string) {
    if (!token) return
    await workoutApi.remove(token, id)
    setDeleteId(null)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workout-Verlauf</h1>
        <button
          onClick={async () => {
            setStarting(true)
            try {
              const session = await startSession('Neues Workout')
              router.push(`/workouts/${session.id}`)
            } finally {
              setStarting(false)
            }
          }}
          disabled={starting}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {starting ? 'Startet…' : '+ Neues Workout'}
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-400 py-16">Laden…</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">Noch keine Workouts.</p>
          <p className="text-gray-400 text-sm mt-1">Starte dein erstes Workout vom Dashboard!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <div key={session.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 cursor-pointer" onClick={() => router.push(`/workouts/${session.id}`)}>
                  <p className="font-medium text-gray-900">{session.name}</p>
                  <p className="text-sm text-gray-400 mt-0.5">
                    {new Date(session.started_at).toLocaleDateString('de-DE', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                    {session.finished_at ? '' : ' · Läuft'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-indigo-600 mr-1">{session.xp_earned} XP</span>
                  <button
                    onClick={() => router.push(`/workouts/${session.id}`)}
                    className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-100"
                  >
                    Bearbeiten
                  </button>
                  <button
                    onClick={() => setDeleteId(session.id)}
                    className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50"
                  >
                    Löschen
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h2 className="font-semibold text-gray-900 mb-2">Workout löschen?</h2>
            <p className="text-sm text-gray-500 mb-6">
              Alle Sets und XP dieses Workouts werden unwiderruflich gelöscht.
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

      {/* XP / Level Up toast */}
      {workoutFinished && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-400 ${
          showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'
        }`}>
          <div className="bg-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden min-w-[260px]">
            {workoutFinished.levelUp ? (
              <div className="px-6 py-5">
                <div className="flex items-center gap-4 mb-3">
                  <span className="text-4xl">🎉</span>
                  <div>
                    <p className="font-bold text-lg leading-tight">Level Up!</p>
                    <p className="text-indigo-300 text-sm">Du bist jetzt Level {workoutFinished.levelUp}</p>
                  </div>
                </div>
                <div className="bg-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                  <span className="text-yellow-400">⚡</span>
                  <p className="text-sm text-gray-300">+{workoutFinished.xp} XP verdient</p>
                </div>
              </div>
            ) : (
              <div className="px-6 py-4 flex items-center gap-4">
                <span className="text-3xl">⚡</span>
                <div>
                  <p className="font-bold text-lg">+{workoutFinished.xp} XP</p>
                  <p className="text-gray-400 text-sm">Workout abgeschlossen!</p>
                </div>
              </div>
            )}
            {/* Progress bar */}
            <div className="h-1 bg-white/10">
              <div
                className={`h-full bg-indigo-500 transition-all ease-linear ${
                  showToast ? 'w-0' : 'w-full'
                }`}
                style={{ transitionDuration: showToast ? '3000ms' : '0ms' }}
              />
            </div>
            <button
              onClick={() => { setShowToast(false); setTimeout(() => setWorkoutFinished(null), 400) }}
              className="absolute top-3 right-3 text-gray-500 hover:text-white text-sm"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
