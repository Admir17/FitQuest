import { atom } from 'jotai'

const getStoredToken = () => {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('fq_token')
}

export const accessTokenAtom = atom<string | null>(null)

export const accessTokenWithStorageAtom = atom(
  (get) => get(accessTokenAtom) ?? getStoredToken(),
  (_get, set, token: string | null) => {
    set(accessTokenAtom, token)
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('fq_token', token)
      } else {
        localStorage.removeItem('fq_token')
      }
    }
  }
)

export const currentUserAtom = atom<{
  id: string
  username: string
  email: string
  avatar_url: string | null
  xp_total: number
  level: number
} | null>(null)

export const streakAtom = atom<{
  current_streak: number
  longest_streak: number
} | null>(null)

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

export const workoutFinishedAtom = atom<{ xp: number; levelUp?: number } | null>(null)

export const pendingEventsAtom = atom<Array<{
  type: 'XP_GAINED' | 'LEVEL_UP' | 'ACHIEVEMENT_UNLOCKED' | 'STREAK_UPDATED'
  payload: Record<string, unknown>
}>>([])
