'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAtom } from 'jotai'
import { currentUserAtom, accessTokenWithStorageAtom } from '../../../store/atoms'
import { userApi } from '../../../lib/api'
import { useWorkout } from '../../../hooks/useWorkout'

export default function DashboardPage() {
  const router          = useRouter()
  const [user, setUser] = useAtom(currentUserAtom)
  const [token]         = useAtom(accessTokenWithStorageAtom)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!token) { router.push('/login'); return }
    userApi.getMe(token).then((res: any) => setUser(res.data)).catch(() => router.push('/login'))
  }, [token, router, setUser])

  async function handleStart() {
    setStarting(true)
    try {
      router.push('/workouts/pending')
    } finally {
      setStarting(false)
    }
  }

  if (!user) return (
    <div className="flex items-center justify-center py-20">
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>Laden…</div>
    </div>
  )

  const xpForNext = Math.round(100 * Math.pow(user.level, 1.6))
  const xpProgress = Math.min((user.xp_total % xpForNext) / xpForNext * 100, 100)

  return (
    <div className="space-y-4">
      {/* User card */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Hallo, {user.username}!
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Level {user.level} · {user.xp_total} XP gesamt</p>
          </div>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold"
            style={{ background: 'var(--accent-light)', color: 'var(--accent)' }}>
            {user.level}
          </div>
        </div>
        {/* XP progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs" style={{ color: 'var(--text-muted)' }}>
            <span>Fortschritt zu Level {user.level + 1}</span>
            <span>{Math.round(xpProgress)}%</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${xpProgress}%`, background: 'var(--accent)' }} />
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleStart} disabled={starting}
          className="rounded-2xl p-5 text-left transition-all active:scale-95"
          style={{ background: 'var(--accent)', opacity: starting ? 0.7 : 1 }}>
          <span className="text-2xl block mb-2">💪</span>
          <p className="font-semibold text-white text-sm">{starting ? 'Startet…' : 'Workout starten'}</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>XP verdienen</p>
        </button>

        <button onClick={() => router.push('/workouts')}
          className="rounded-2xl p-5 text-left transition-all active:scale-95"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <span className="text-2xl block mb-2">📋</span>
          <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>Verlauf</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Vergangene Workouts</p>
        </button>
      </div>
    </div>
  )
}
