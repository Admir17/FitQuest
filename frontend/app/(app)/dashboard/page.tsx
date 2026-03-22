'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import { currentUserAtom, accessTokenWithStorageAtom } from '../../../store/atoms'
import { userApi, achievementApi } from '../../../lib/api'
import { useWorkout } from '../../../hooks/useWorkout'

export default function DashboardPage() {
  const router          = useRouter()
  const [user, setUser] = useAtom(currentUserAtom)
  const [token]         = useAtom(accessTokenWithStorageAtom)
  const { startSession } = useWorkout()
  const [starting, setStarting] = useState(false)
  const [streak, setStreak]     = useState<{ current_streak: number; longest_streak: number } | null>(null)

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    userApi.getMe(token).then((res: any) => setUser(res.data)).catch(() => router.push('/login'))
    achievementApi.streak(token).then((res: any) => setStreak(res.data)).catch(() => {})
  }, [token, router, setUser])

  async function handleStart() {
    setStarting(true)
    try {
      const session = await startSession('Neues Workout')
      router.push(`/workouts/${session.id}`)
    } finally {
      setStarting(false)
    }
  }

  if (!user) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Laden…</div>
    </div>
  )

  // Calculate cumulative XP needed for current and next level
  const xpForLevel  = (lvl: number) => Math.round(100 * Math.pow(lvl, 1.6))
  let xpAtCurrentLevel = 0
  for (let i = 1; i < user.level; i++) xpAtCurrentLevel += xpForLevel(i)
  const xpForNext   = xpForLevel(user.level)
  const xpIntoLevel = user.xp_total - xpAtCurrentLevel
  const xpProgress  = Math.min(xpIntoLevel / xpForNext * 100, 100)

  return (
    <div className="space-y-4">
      {/* User card */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Hallo, {user.username}!
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Level {user.level} · {user.xp_total} XP gesamt
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{ background: 'rgba(99,102,241,0.15)', color: 'var(--accent)' }}>
            {user.level}
          </div>
        </div>

        {/* XP progress */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Fortschritt zu Level {user.level + 1}</span>
            <span style={{ color: 'var(--text-secondary)' }}>
              {xpIntoLevel} / {xpForNext} XP
            </span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%`, background: 'var(--accent)' }} />
          </div>
        </div>
      </div>

      {/* Streak card */}
      {streak && streak.current_streak > 0 && (
        <div className="hover-card rounded-2xl p-4 flex items-center gap-4"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="text-3xl">🔥</div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
              {streak.current_streak} Tage Streak!
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Bester Streak: {streak.longest_streak} Tage
            </p>
          </div>
          {streak.current_streak >= 7 && (
            <span className="text-xs font-medium px-2 py-1 rounded-lg"
              style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>
              🔥 On fire!
            </span>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleStart} disabled={starting}
          className="hover-card rounded-2xl p-5 text-left cursor-pointer"
          style={{ background: 'var(--accent)', opacity: starting ? 0.7 : 1 }}>
          <span className="text-2xl block mb-2">💪</span>
          <p className="font-semibold text-white text-sm">{starting ? 'Startet…' : 'Workout starten'}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>XP verdienen</p>
        </button>

        <button onClick={() => router.push('/workouts')}
          className="hover-card rounded-2xl p-5 text-left cursor-pointer"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <span className="text-2xl block mb-2">📋</span>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Verlauf</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Vergangene Workouts</p>
        </button>

        <button onClick={() => router.push('/achievements')}
          className="hover-card rounded-2xl p-4 text-left cursor-pointer col-span-2"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏆</span>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Erfolge</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Deine Fortschritte ansehen</p>
            </div>
          </div>
        </button>
      </div>
    </div>
  )
}
