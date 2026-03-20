import { query, getClient } from '../../db/pool'
import { levelForXp } from '../../utils/xp.calculator'
import type { GameEvent } from '../../types/index'

// ── Achievement service ───────────────────────────────────────
// Checks all unlocked achievements after a workout is finished

interface Achievement {
  id: string
  name: string
  description: string
  icon: string
  condition_type: string
  condition_value: number
  xp_reward: number
}

interface UserStats {
  xp_total: number
  workouts_total: number
  unique_exercises: number
  custom_exercise_created: boolean
  streak_days: number
}

async function getUserStats(userId: string): Promise<UserStats> {
  const [xpRes, workoutsRes, exercisesRes, customRes, streakRes] = await Promise.all([
    query<{ xp_total: number }>('SELECT xp_total FROM users WHERE id = $1', [userId]),
    query<{ count: string }>(
      'SELECT COUNT(*) as count FROM workout_sessions WHERE user_id = $1 AND finished_at IS NOT NULL',
      [userId]
    ),
    query<{ count: string }>(
      `SELECT COUNT(DISTINCT ws.exercise_id) as count
       FROM workout_sets ws
       JOIN workout_sessions s ON ws.session_id = s.id
       WHERE s.user_id = $1 AND s.finished_at IS NOT NULL`,
      [userId]
    ),
    query<{ count: string }>(
      'SELECT COUNT(*) as count FROM exercises WHERE created_by = $1 AND is_system = FALSE',
      [userId]
    ),
    query<{ current_streak: number }>(
      'SELECT current_streak FROM streaks WHERE user_id = $1',
      [userId]
    ),
  ])

  return {
    xp_total:               xpRes.rows[0]?.xp_total ?? 0,
    workouts_total:         parseInt(workoutsRes.rows[0]?.count ?? '0'),
    unique_exercises:       parseInt(exercisesRes.rows[0]?.count ?? '0'),
    custom_exercise_created: parseInt(customRes.rows[0]?.count ?? '0') > 0,
    streak_days:            streakRes.rows[0]?.current_streak ?? 0,
  }
}

function meetsCondition(achievement: Achievement, stats: UserStats): boolean {
  switch (achievement.condition_type) {
    case 'workouts_total':          return stats.workouts_total >= achievement.condition_value
    case 'xp_total':                return stats.xp_total >= achievement.condition_value
    case 'unique_exercises':        return stats.unique_exercises >= achievement.condition_value
    case 'streak_days':             return stats.streak_days >= achievement.condition_value
    case 'custom_exercise_created': return stats.custom_exercise_created
    default:                        return false
  }
}

export async function checkAndAwardAchievements(userId: string): Promise<GameEvent[]> {
  const client = await getClient()
  const events: GameEvent[] = []

  try {
    await client.query('BEGIN')

    // Get all achievements not yet unlocked by this user
    const achievementsRes = await client.query<Achievement>(
      `SELECT a.* FROM achievements a
       WHERE a.id NOT IN (
         SELECT achievement_id FROM user_achievements WHERE user_id = $1
       )`,
      [userId]
    )

    if (achievementsRes.rows.length === 0) {
      await client.query('COMMIT')
      return events
    }

    const stats = await getUserStats(userId)

    for (const achievement of achievementsRes.rows) {
      if (!meetsCondition(achievement, stats)) continue

      // Unlock achievement
      await client.query(
        'INSERT INTO user_achievements (user_id, achievement_id) VALUES ($1, $2)',
        [userId, achievement.id]
      )

      // Award XP bonus and recalculate level
      if (achievement.xp_reward > 0) {
        const updatedUser = await client.query<{ xp_total: number }>(
          'UPDATE users SET xp_total = xp_total + $1 WHERE id = $2 RETURNING xp_total',
          [achievement.xp_reward, userId]
        )
        const newXp = updatedUser.rows[0]?.xp_total ?? 0
        await client.query('UPDATE users SET level = $1 WHERE id = $2', [levelForXp(newXp), userId])
        await client.query(
          `INSERT INTO xp_logs (user_id, source_id, source_type, xp_amount, reason)
           VALUES ($1, $2, 'achievement', $3, $4)`,
          [userId, achievement.id, achievement.xp_reward, `Achievement: ${achievement.name}`]
        )
      }

      events.push({
        type: 'ACHIEVEMENT_UNLOCKED',
        payload: {
          id:          achievement.id,
          name:        achievement.name,
          description: achievement.description,
          icon:        achievement.icon,
          xp_reward:   achievement.xp_reward,
        },
      })
    }

    await client.query('COMMIT')
    return events
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getUserAchievements(userId: string) {
  const result = await query<Achievement & { unlocked_at: string | null }>(
    `SELECT a.*, ua.unlocked_at
     FROM achievements a
     LEFT JOIN user_achievements ua ON a.id = ua.achievement_id AND ua.user_id = $1
     ORDER BY ua.unlocked_at DESC NULLS LAST, a.condition_value ASC`,
    [userId]
  )
  return result.rows
}
