import { useState, useCallback } from 'react'
import { useAtomValue } from 'jotai'
import { accessTokenAtom } from '../store/atoms'
import { workoutApi, exerciseApi } from '../lib/api'

export interface Exercise {
  id: string
  name: string
  category: string
  muscle_groups: string[]
  xp_per_set: number
  is_system: boolean
}

export interface WorkoutSet {
  id: string
  exercise_id: string
  exercise_name?: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  xp_awarded: number
}

export interface WorkoutSession {
  id: string
  name: string
  started_at: string
  finished_at: string | null
  xp_earned: number
  sets?: WorkoutSet[]
}

export interface GameEvent {
  type: 'XP_GAINED' | 'LEVEL_UP' | 'ACHIEVEMENT_UNLOCKED'
  payload: Record<string, unknown>
}

export function useWorkout() {
  const token = useAtomValue(accessTokenAtom)

  const [sessions, setSessions]   = useState<WorkoutSession[]>([])
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState<string | null>(null)

  // ── Load all sessions ─────────────────────────────────────

  const loadSessions = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await workoutApi.list(token) as { data: WorkoutSession[] }
      setSessions(res.data)
    } catch {
      setError('Failed to load workouts.')
    } finally {
      setLoading(false)
    }
  }, [token])

  // ── Load exercises ────────────────────────────────────────

  const loadExercises = useCallback(async () => {
    if (!token) return
    try {
      const res = await exerciseApi.list(token) as { data: Exercise[] }
      setExercises(res.data)
    } catch {
      setError('Failed to load exercises.')
    }
  }, [token])

  // ── Start session ─────────────────────────────────────────

  const startSession = useCallback(async (name: string): Promise<WorkoutSession> => {
    const res = await workoutApi.start(token!, { name }) as { data: WorkoutSession }
    return res.data
  }, [token])

  // ── Add set ───────────────────────────────────────────────

  const addSet = useCallback(async (
    workoutId: string,
    data: { exercise_id: string; set_number: number; reps?: number; weight_kg?: number }
  ): Promise<{ set: WorkoutSet; xp_awarded: number; events: GameEvent[] }> => {
    const res = await workoutApi.addSet(token!, workoutId, data) as {
      data: { set: WorkoutSet }
      xp_awarded: number
      events: GameEvent[]
    }
    return { set: res.data.set, xp_awarded: res.xp_awarded, events: res.events }
  }, [token])

  // ── Finish session ────────────────────────────────────────

  const finishSession = useCallback(async (id: string): Promise<{ data: WorkoutSession; events: any[] }> => {
    const res = await workoutApi.finish(token!, id) as { data: WorkoutSession; events: any[] }
    return res
  }, [token])

  return {
    sessions, exercises, loading, error,
    loadSessions, loadExercises, startSession, addSet, finishSession,
  }
}
