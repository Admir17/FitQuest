'use client'

import { useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { accessTokenWithStorageAtom, currentUserAtom } from '../../../store/atoms'
import { userApi } from '../../../lib/api'

interface LeaderboardEntry {
  id: string
  username: string
  level: number
  xp_total: number
  workout_count: number
  current_streak: number
  rank: number
}

export default function LeaderboardPage() {
  const token   = useAtomValue(accessTokenWithStorageAtom)
  const user    = useAtomValue(currentUserAtom)
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    userApi.getLeaderboard(token)
      .then((res: any) => setEntries(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)' }

  const rankEmoji = (rank: number) => {
    if (rank === 1) return '🥇'
    if (rank === 2) return '🥈'
    if (rank === 3) return '🥉'
    return `#${rank}`
  }

  if (loading) return <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Laden…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Rangliste</h1>
        <span className="text-2xl">👑</span>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-16" style={{ color: 'var(--text-muted)' }}>
          <p className="text-3xl mb-2">🏋️</p>
          <p className="text-sm">Noch keine Einträge.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const isMe = entry.id === user?.id
            return (
              <div key={entry.id} className="hover-card rounded-2xl p-4 flex items-center gap-4"
                style={{
                  ...cardStyle,
                  border: isMe ? '1px solid var(--accent)' : '1px solid var(--border)',
                  background: isMe ? 'var(--accent-light)' : 'var(--bg-card)',
                }}>
                <div className="text-xl font-bold w-8 text-center shrink-0">
                  {typeof rankEmoji(entry.rank) === 'string' && entry.rank > 3 ? (
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>#{entry.rank}</span>
                  ) : (
                    <span>{rankEmoji(entry.rank)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {entry.username}
                    </p>
                    {isMe && (
                      <span className="text-xs px-1.5 py-0.5 rounded-md shrink-0"
                        style={{ background: 'var(--accent)', color: 'white' }}>Du</span>
                    )}
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    Level {entry.level} · {entry.workout_count} Workouts
                    {entry.current_streak > 0 && ` · 🔥 ${entry.current_streak}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{entry.xp_total.toLocaleString('de-CH')}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>XP</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
