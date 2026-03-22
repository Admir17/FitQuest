import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import { query } from '../../db/pool'

const router = Router()

/** GET /api/users/me */
router.get('/me', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: req.user })
  } catch (err) { next(err) }
})

/** GET /api/users/me/stats */
router.get('/me/stats', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id

    const [workoutsRes, volumeRes, weekRes, exercisesRes, prsRes] = await Promise.all([
      // Total finished workouts
      query<{ total: string }>(
        `SELECT COUNT(*) as total FROM workout_sessions
         WHERE user_id = $1 AND finished_at IS NOT NULL`,
        [userId]
      ),
      // Total volume (kg lifted)
      query<{ total_volume: string }>(
        `SELECT COALESCE(SUM(ws.weight_kg * ws.reps), 0) as total_volume
         FROM workout_sets ws
         JOIN workout_sessions s ON ws.session_id = s.id
         WHERE s.user_id = $1 AND s.finished_at IS NOT NULL`,
        [userId]
      ),
      // Workouts per week (last 8 weeks)
      query<{ week: string; count: string }>(
        `SELECT
           to_char(date_trunc('week', started_at), 'YYYY-MM-DD') as week,
           COUNT(*) as count
         FROM workout_sessions
         WHERE user_id = $1 AND finished_at IS NOT NULL
           AND started_at > NOW() - INTERVAL '8 weeks'
         GROUP BY week ORDER BY week`,
        [userId]
      ),
      // Most used exercises
      query<{ exercise_id: string; name: string; set_count: string }>(
        `SELECT ws.exercise_id, e.name, COUNT(*) as set_count
         FROM workout_sets ws
         JOIN workout_sessions s ON ws.session_id = s.id
         JOIN exercises e ON ws.exercise_id = e.id
         WHERE s.user_id = $1 AND s.finished_at IS NOT NULL
         GROUP BY ws.exercise_id, e.name
         ORDER BY set_count DESC LIMIT 5`,
        [userId]
      ),
      // Personal records (max weight per exercise)
      query<{ exercise_id: string; name: string; max_weight: string; max_reps: string }>(
        `SELECT ws.exercise_id, e.name,
           MAX(ws.weight_kg) as max_weight,
           MAX(ws.reps) as max_reps
         FROM workout_sets ws
         JOIN workout_sessions s ON ws.session_id = s.id
         JOIN exercises e ON ws.exercise_id = e.id
         WHERE s.user_id = $1 AND s.finished_at IS NOT NULL
           AND ws.weight_kg IS NOT NULL
         GROUP BY ws.exercise_id, e.name
         ORDER BY max_weight DESC LIMIT 10`,
        [userId]
      ),
    ])

    res.json({
      data: {
        workouts_total:  parseInt(workoutsRes.rows[0]?.total ?? '0'),
        total_volume_kg: Math.round(parseFloat(volumeRes.rows[0]?.total_volume ?? '0')),
        workouts_per_week: weekRes.rows.map(r => ({ week: r.week, count: parseInt(r.count) })),
        top_exercises:   exercisesRes.rows.map(r => ({ ...r, set_count: parseInt(r.set_count) })),
        personal_records: prsRes.rows.map(r => ({
          ...r,
          max_weight: parseFloat(r.max_weight),
          max_reps:   parseInt(r.max_reps),
        })),
      }
    })
  } catch (err) { next(err) }
})

/** GET /api/users/leaderboard */
router.get('/leaderboard', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query<{
      id: string; username: string; level: number; xp_total: number
      workout_count: string; current_streak: number
    }>(
      `SELECT u.id, u.username, u.level, u.xp_total,
         COUNT(DISTINCT s.id) as workout_count,
         COALESCE(st.current_streak, 0) as current_streak
       FROM users u
       LEFT JOIN workout_sessions s ON s.user_id = u.id AND s.finished_at IS NOT NULL
       LEFT JOIN streaks st ON st.user_id = u.id
       GROUP BY u.id, u.username, u.level, u.xp_total, st.current_streak
       ORDER BY u.xp_total DESC
       LIMIT 10`,
      []
    )
    res.json({ data: result.rows.map((r, i) => ({ ...r, rank: i + 1, workout_count: parseInt(r.workout_count) })) })
  } catch (err) { next(err) }
})

export default router
