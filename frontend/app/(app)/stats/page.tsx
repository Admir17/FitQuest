'use client'

import { useEffect, useState } from 'react'
import { useAtomValue } from 'jotai'
import { accessTokenWithStorageAtom } from '../../../store/atoms'
import { userApi } from '../../../lib/api'

interface Stats {
  workouts_total: number
  total_volume_kg: number
  workouts_per_week: Array<{ week: string; count: number }>
  top_exercises: Array<{ exercise_id: string; name: string; set_count: number }>
  personal_records: Array<{ exercise_id: string; name: string; max_weight: number; max_reps: number }>
}

export default function StatsPage() {
  const token = useAtomValue(accessTokenWithStorageAtom)
  const [stats, setStats]   = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    userApi.getStats(token)
      .then((res: any) => setStats(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)' }
  const maxCount = stats ? Math.max(...stats.workouts_per_week.map(w => w.count), 1) : 1

  if (loading) return <div className="flex items-center justify-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Laden…</div>
  if (!stats) return <div className="text-center py-20 text-sm" style={{ color: 'var(--text-muted)' }}>Keine Daten verfügbar.</div>

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Statistiken</h1>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl p-4 text-center" style={cardStyle}>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{stats.workouts_total}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Workouts gesamt</p>
        </div>
        <div className="rounded-2xl p-4 text-center" style={cardStyle}>
          <p className="text-3xl font-bold" style={{ color: 'var(--accent)' }}>{stats.total_volume_kg.toLocaleString('de-CH')}</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>kg Volumen gesamt</p>
        </div>
      </div>

      {/* Workouts per week chart */}
      <div className="rounded-2xl p-4" style={cardStyle}>
        <p className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Workouts pro Woche</p>
        {stats.workouts_per_week.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>Noch keine Daten</p>
        ) : (
          <div className="flex items-end gap-2 h-32">
            {stats.workouts_per_week.map((w) => (
              <div key={w.week} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-xs font-medium" style={{ color: 'var(--accent)' }}>{w.count}</p>
                <div className="w-full rounded-t-lg transition-all duration-500"
                  style={{
                    height: `${(w.count / maxCount) * 100}px`,
                    background: 'var(--accent)',
                    opacity: 0.8,
                    minHeight: '4px',
                  }} />
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {new Date(w.week).toLocaleDateString('de-CH', { day: 'numeric', month: 'short' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Personal Records */}
      {stats.personal_records.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>🏆 Personal Records</p>
          </div>
          {stats.personal_records.map((pr, i) => (
            <div key={pr.exercise_id} className="list-row px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: i < stats.personal_records.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{pr.name}</p>
              <div className="flex gap-3 text-xs" style={{ color: 'var(--text-secondary)' }}>
                {pr.max_weight && <span className="font-semibold" style={{ color: 'var(--accent)' }}>{pr.max_weight} kg</span>}
                {pr.max_reps && <span>{pr.max_reps} Wdh.</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top exercises */}
      {stats.top_exercises.length > 0 && (
        <div className="rounded-2xl overflow-hidden" style={cardStyle}>
          <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>💪 Meistgenutzte Übungen</p>
          </div>
          {stats.top_exercises.map((ex, i) => (
            <div key={ex.exercise_id} className="list-row px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: i < stats.top_exercises.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold w-5 text-center" style={{ color: 'var(--text-muted)' }}>{i + 1}</span>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{ex.name}</p>
              </div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{ex.set_count} Sätze</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
