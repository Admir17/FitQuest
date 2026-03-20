'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAtom, useAtomValue, useSetAtom } from 'jotai'
import { accessTokenWithStorageAtom, workoutFinishedAtom, currentUserAtom } from '../../../store/atoms'
import { workoutApi, userApi } from '../../../lib/api'
import { playAchievementSound, playLevelUpSound } from '../../../lib/sounds'
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
  const [sessions, setSessions]               = useState<Session[]>([])
  const [loading, setLoading]                 = useState(true)
  const [deleteId, setDeleteId]               = useState<string | null>(null)
  const [starting, setStarting]               = useState(false)
  const [workoutFinished, setWorkoutFinished] = useAtom(workoutFinishedAtom)
  const [showToast, setShowToast]             = useState(false)
  
  async function load() {
    if (!token) return
    try {
      const res = await workoutApi.list(token) as { data: Session[] }
      // Hide empty unfinished sessions (being cleaned up)
      setSessions(res.data.filter(s => s.xp_earned > 0 || s.finished_at !== null))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [token])

  useEffect(() => {
    if (!workoutFinished) return
    setShowToast(true)
    // Play sound based on event type
    if (workoutFinished.levelUp) {
      playLevelUpSound()
    } else if (workoutFinished.achievements && workoutFinished.achievements.length > 0) {
      playAchievementSound()
    }
    const t = setTimeout(() => {
      setShowToast(false)
      setTimeout(() => setWorkoutFinished(null), 400)
    }, 3000)
    return () => clearTimeout(t)
  }, [workoutFinished])

  async function handleNewWorkout() {
    setStarting(true)
    try {
      router.push('/workouts/pending')
    } finally {
      setStarting(false)
    }
  }

  async function handleDelete(id: string) {
    if (!token) return
    await workoutApi.remove(token, id)
    setDeleteId(null)
    load()
    // Refresh user XP in nav
    userApi.getMe(token).then((res: any) => setUser(res.data)).catch(() => {})
  }

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)' }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Workout-Verlauf</h1>
        <button onClick={handleNewWorkout} disabled={starting}
          className="text-sm font-medium px-4 py-2 rounded-xl transition-all active:scale-95"
          style={{ background: 'var(--accent)', color: 'white', opacity: starting ? 0.7 : 1 }}>
          {starting ? 'Startet…' : '+ Neu'}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>Laden…</div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <p className="text-3xl">🏋️</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Noch keine Workouts.</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Starte dein erstes Workout!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <div key={session.id} className="rounded-2xl p-4" style={cardStyle}>
              <div className="flex items-center justify-between">
                <div className="flex-1 cursor-pointer min-w-0 mr-3" onClick={() => router.push(`/workouts/${session.id}`)}>
                  <p className="font-medium text-sm truncate" style={{ color: 'var(--text-primary)' }}>{session.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(session.started_at).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })}
                    {session.finished_at ? '' : ' · Läuft'}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold px-2 py-1 rounded-lg" style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
                    {session.xp_earned} XP
                  </span>
                  <button onClick={() => router.push(`/workouts/${session.id}`)}
                    className="text-xs px-2 py-1 rounded-lg transition-all"
                    style={{ color: 'var(--text-secondary)', background: 'var(--bg-secondary)' }}>
                    Bearbeiten
                  </button>
                  <button onClick={() => setDeleteId(session.id)}
                    className="text-xs px-2 py-1 rounded-lg transition-all"
                    style={{ color: 'var(--red)', background: 'var(--red-light)' }}>
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
        <div className="fixed inset-0 flex items-center justify-center z-50 p-4 pb-28 sm:pb-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={cardStyle}>
            <h2 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Workout löschen?</h2>
            <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Alle Sets und XP werden unwiderruflich gelöscht.</p>
            <div className="flex gap-2">
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 rounded-xl py-3 text-sm font-semibold transition-all"
                style={{ background: 'var(--red)', color: 'white' }}>
                Ja, löschen
              </button>
              <button onClick={() => setDeleteId(null)}
                className="flex-1 rounded-xl py-3 text-sm font-medium transition-all"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
                Abbrechen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* XP / Level Up / Achievement toast */}
      {workoutFinished && (
        <div className={`fixed bottom-24 sm:bottom-10 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 w-72 ${showToast ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
          <div className="rounded-2xl shadow-2xl overflow-hidden relative" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <button onClick={() => { setShowToast(false); setTimeout(() => setWorkoutFinished(null), 400) }}
              className="absolute top-3 right-3 text-sm z-10" style={{ color: 'var(--text-muted)' }}>✕</button>

            {/* XP / Level Up */}
            {workoutFinished.levelUp ? (
              <div className="px-5 py-4">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-3xl">🎉</span>
                  <div>
                    <p className="font-bold" style={{ color: 'var(--text-primary)' }}>Level Up!</p>
                    <p className="text-sm" style={{ color: 'var(--accent)' }}>Du bist jetzt Level {workoutFinished.levelUp}</p>
                  </div>
                </div>
                <div className="rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: 'var(--accent-light)' }}>
                  <span>⚡</span>
                  <p className="text-sm" style={{ color: 'var(--accent)' }}>+{workoutFinished.xp} XP verdient</p>
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>+{workoutFinished.xp} XP</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Workout abgeschlossen!</p>
                </div>
              </div>
            )}

            {/* Streak */}
            {workoutFinished.streak && workoutFinished.streak > 1 && (
              <div className="px-5 py-3 flex items-center gap-2" style={{ borderTop: '1px solid var(--border)' }}>
                <span>🔥</span>
                <p className="text-sm font-medium" style={{ color: '#ef4444' }}>
                  {workoutFinished.streak} Tage Streak!
                </p>
              </div>
            )}

            {/* Achievements */}
            {workoutFinished.achievements && workoutFinished.achievements.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)' }}>
                {workoutFinished.achievements.map((ach, i) => (
                  <div key={i} className="px-5 py-3 flex items-center gap-3">
                    <span className="text-xl">{ach.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold" style={{ color: '#f59e0b' }}>Achievement freigeschaltet!</p>
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ach.name}</p>
                    </div>
                    <span className="text-xs font-medium shrink-0" style={{ color: '#f59e0b' }}>+{ach.xp_reward} XP</span>
                  </div>
                ))}
              </div>
            )}

            <div className="h-0.5" style={{ background: 'var(--border)' }}>
              <div className="h-full transition-all ease-linear" style={{ background: 'var(--accent)', width: showToast ? '0%' : '100%', transitionDuration: showToast ? '3000ms' : '0ms' }} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
