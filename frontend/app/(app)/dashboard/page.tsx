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
  const { startSession } = useWorkout()
  const [starting, setStarting] = useState(false)

  // Always reload user on dashboard visit to get fresh XP/level
  useEffect(() => {
    if (!token) { router.push('/login'); return }
    userApi.getMe(token)
      .then((res: any) => setUser(res.data))
      .catch(() => router.push('/login'))
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

  if (!user) {
    return <div className="flex items-center justify-center py-16"><div className="text-gray-400 text-sm">Laden…</div></div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Willkommen zurück, {user.username}!</h1>
      <p className="text-gray-400 text-sm mb-8">Level {user.level} · {user.xp_total} XP gesamt</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={handleStart} disabled={starting}
          className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-2xl p-6 transition-colors text-left"
        >
          <p className="text-2xl mb-2">💪</p>
          <p className="font-semibold">{starting ? 'Startet…' : 'Workout starten'}</p>
          <p className="text-indigo-200 text-sm mt-1">Sets loggen und XP verdienen</p>
        </button>

        <button
          onClick={() => router.push('/workouts')}
          className="bg-white border border-gray-200 hover:border-indigo-300 rounded-2xl p-6 transition-colors text-left"
        >
          <p className="text-2xl mb-2">📋</p>
          <p className="font-semibold text-gray-900">Workout-Verlauf</p>
          <p className="text-gray-400 text-sm mt-1">Vergangene Workouts ansehen</p>
        </button>
      </div>
    </div>
  )
}
