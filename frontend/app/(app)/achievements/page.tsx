'use client'

import { useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { accessTokenWithStorageAtom } from '../../../store/atoms'
import { achievementApi } from '../../../lib/api'

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition_type: string
  condition_value: number
  xp_reward: number
  unlocked_at: string | null
}

const CONDITION_LABELS: Record<string, string> = {
  workouts_total:          'Workouts abgeschlossen',
  xp_total:                'XP gesammelt',
  unique_exercises:        'verschiedene Übungen',
  streak_days:             'Tage Streak',
  custom_exercise_created: 'eigene Übung erstellt',
}

export default function AchievementsPage() {
  const token = useAtomValue(accessTokenWithStorageAtom)
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [loading, setLoading]           = useState(true)
  const [filter, setFilter]             = useState<'alle' | 'freigeschaltet' | 'gesperrt'>('alle')

  useEffect(() => {
    if (!token) return
    achievementApi.list(token)
      .then((res: any) => setAchievements(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const unlocked = achievements.filter(a => a.unlocked_at)
  const locked   = achievements.filter(a => !a.unlocked_at)
  const filtered = filter === 'alle' ? achievements : filter === 'freigeschaltet' ? unlocked : locked

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)' }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Achievements</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {unlocked.length}/{achievements.length} freigeschaltet
          </p>
        </div>
        <div className="text-3xl">🏆</div>
      </div>

      {/* Progress bar */}
      <div className="rounded-2xl p-4" style={cardStyle}>
        <div className="flex justify-between text-xs mb-2" style={{ color: 'var(--text-muted)' }}>
          <span>Fortschritt</span>
          <span>{unlocked.length} von {achievements.length}</span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${achievements.length ? (unlocked.length / achievements.length) * 100 : 0}%`, background: '#f59e0b' }} />
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {(['alle', 'freigeschaltet', 'gesperrt'] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className="text-xs font-medium px-3 py-2 rounded-xl capitalize transition-all"
            style={{
              background: filter === f ? 'var(--accent)' : 'var(--bg-card)',
              color: filter === f ? 'white' : 'var(--text-secondary)',
              border: '1px solid var(--border)',
            }}>
            {f === 'alle' ? `Alle (${achievements.length})` : f === 'freigeschaltet' ? `Freigeschaltet (${unlocked.length})` : `Gesperrt (${locked.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm" style={{ color: 'var(--text-muted)' }}>Laden…</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ach) => (
            <div key={ach.id} className="hover-card rounded-2xl p-4 flex items-center gap-4"
              style={{ ...cardStyle, opacity: ach.unlocked_at ? 1 : 0.5 }}>
              <div className="text-3xl shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ background: ach.unlocked_at ? 'rgba(245,158,11,0.15)' : 'var(--bg-secondary)' }}>
                {ach.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                    {ach.name}
                  </p>
                  {ach.unlocked_at && (
                    <span className="text-xs px-1.5 py-0.5 rounded-md shrink-0"
                      style={{ background: 'rgba(245,158,11,0.15)', color: '#f59e0b' }}>
                      ✓
                    </span>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ach.description}</p>
                {ach.unlocked_at && (
                  <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {new Date(ach.unlocked_at).toLocaleDateString('de-CH', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-semibold" style={{ color: '#f59e0b' }}>+{ach.xp_reward}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>XP</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
