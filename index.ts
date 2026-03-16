// ============================================================
// FitQuest — Shared TypeScript types
// ============================================================

// ── Enums ────────────────────────────────────────────────────

export type ExerciseCategory =
  | 'strength' | 'cardio' | 'core'
  | 'flexibility' | 'sport' | 'custom'

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced'

export type XpSourceType = 'workout_set' | 'achievement' | 'streak_bonus'

export type AchievementConditionType =
  | 'workouts_total'
  | 'streak_days'
  | 'xp_total'
  | 'unique_exercises'
  | 'custom_exercise_created'

// ── Database entities ────────────────────────────────────────

export interface User {
  id: string
  email: string
  username: string
  password_hash: string
  avatar_url: string | null
  xp_total: number
  level: number
  created_at: Date
  updated_at: Date
}

/** User shape safe to return in API responses (no password hash) */
export type PublicUser = Omit<User, 'password_hash'>

export interface Exercise {
  id: string
  name: string
  category: ExerciseCategory
  muscle_groups: string[]
  is_system: boolean
  created_by: string | null
  xp_per_set: number
  created_at: Date
}

export interface WorkoutTemplate {
  id: string
  name: string
  description: string | null
  difficulty: DifficultyLevel
  estimated_min: number | null
  tags: string[]
  is_active: boolean
  created_at: Date
}

export interface TemplateExercise {
  id: string
  template_id: string
  exercise_id: string
  order_index: number
  target_sets: number | null
  target_reps: number | null
  target_weight_kg: number | null
}

export interface WorkoutSession {
  id: string
  user_id: string
  template_id: string | null
  name: string
  started_at: Date
  finished_at: Date | null   // null = session still in progress
  xp_earned: number
  notes: string | null
  created_at: Date
}

export interface WorkoutSet {
  id: string
  session_id: string
  exercise_id: string
  set_number: number
  reps: number | null
  weight_kg: number | null
  duration_sec: number | null   // for time-based exercises
  xp_awarded: number
  created_at: Date
}

export interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition_type: AchievementConditionType
  condition_value: number
  xp_reward: number
  created_at: Date
}

export interface UserAchievement {
  id: string
  user_id: string
  achievement_id: string
  unlocked_at: Date
}

export interface Streak {
  id: string
  user_id: string
  current_streak: number
  longest_streak: number
  last_activity_date: Date | null
  updated_at: Date
}

export interface XpLog {
  id: string
  user_id: string
  source_id: string | null
  source_type: XpSourceType
  xp_amount: number
  reason: string
  created_at: Date
}

export interface RefreshToken {
  id: string
  user_id: string
  token_hash: string
  expires_at: Date
  created_at: Date
}

// ── API response types ───────────────────────────────────────

/** Events returned alongside a response to drive frontend animations */
export type GameEventType =
  | 'XP_GAINED'
  | 'LEVEL_UP'
  | 'ACHIEVEMENT_UNLOCKED'
  | 'STREAK_UPDATED'

export interface GameEvent {
  type: GameEventType
  payload: Record<string, unknown>
}

export interface ApiResponse<T> {
  data: T
  events?: GameEvent[]
}

export interface ApiError {
  error: string
  details?: Record<string, string>
}
