import { atom } from 'jotai'

// ── Auth ─────────────────────────────────────────────────────

/** Short-lived JWT access token — kept in memory only, never in localStorage */
export const accessTokenAtom = atom<string | null>(null)

export const currentUserAtom = atom<{
  id: string
  username: string
  email: string
  avatar_url: string | null
  xp_total: number
  level: number
} | null>(null)

// ── Streak ───────────────────────────────────────────────────

export const streakAtom = atom<{
  current_streak: number
  longest_streak: number
} | null>(null)

// ── Active workout ───────────────────────────────────────────

/** Populated while a workout session is in progress */
export const activeWorkoutAtom = atom<{
  id: string
  name: string
  started_at: string
  sets: Array<{
    id: string
    exercise_id: string
    exercise_name: string
    set_number: number
    reps: number | null
    weight_kg: number | null
    xp_awarded: number
  }>
} | null>(null)

// ── Game events ──────────────────────────────────────────────

/**
 * Events returned by the API (e.g. XP_GAINED, LEVEL_UP) that still need
 * to be shown as animations/toasts. The UI dequeues them one by one.
 */
export const pendingEventsAtom = atom<Array<{
  type: 'XP_GAINED' | 'LEVEL_UP' | 'ACHIEVEMENT_UNLOCKED' | 'STREAK_UPDATED'
  payload: Record<string, unknown>
}>>([])
