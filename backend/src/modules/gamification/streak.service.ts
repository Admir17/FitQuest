import { query, getClient } from '../../db/pool'

// ── Streak service ────────────────────────────────────────────
// Called on workout finish — updates streak for the user

export interface StreakResult {
  current_streak: number
  longest_streak: number
  is_new_day: boolean
}

export async function updateStreak(userId: string): Promise<StreakResult> {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    // Use DB server date to avoid timezone issues
    const todayRes = await client.query<{ today: string }>('SELECT CURRENT_DATE::text as today')
    const today = todayRes.rows[0].today

    // Get or create streak row
    const existing = await client.query<{
      current_streak: number
      longest_streak: number
      last_activity_date: string | null
    }>(
      'SELECT current_streak, longest_streak, last_activity_date FROM streaks WHERE user_id = $1',
      [userId]
    )

    let current_streak: number
    let longest_streak: number
    let is_new_day = false

    if (!existing.rows[0]) {
      // First ever workout
      current_streak = 1
      longest_streak = 1
      is_new_day = true
      await client.query(
        `INSERT INTO streaks (user_id, current_streak, longest_streak, last_activity_date)
         VALUES ($1, 1, 1, $2)`,
        [userId, today]
      )
    } else {
      const { current_streak: curr, longest_streak: longest, last_activity_date } = existing.rows[0]
      // last_activity_date from DB is already a date string like '2026-03-20'
      const lastDate = last_activity_date ? String(last_activity_date).split('T')[0] : null


      if (lastDate === today) {
        // Already trained today — no change
        current_streak = curr
        longest_streak = longest
        is_new_day = false
      } else {
        is_new_day = true
        // Check if yesterday — use DB to avoid timezone issues
        const yesterdayRes = await client.query<{ yesterday: string }>('SELECT (CURRENT_DATE - 1)::text as yesterday')
        const yesterdayStr = yesterdayRes.rows[0].yesterday

        if (lastDate === yesterdayStr) {
          // Consecutive day
          current_streak = curr + 1
          longest_streak = Math.max(longest, current_streak)
        } else {
          // Streak broken
          current_streak = 1
          longest_streak = longest
        }

        await client.query(
          `UPDATE streaks
           SET current_streak = $1, longest_streak = $2, last_activity_date = $3, updated_at = NOW()
           WHERE user_id = $4`,
          [current_streak, longest_streak, today, userId]
        )
      }
    }

    await client.query('COMMIT')
    return { current_streak, longest_streak, is_new_day }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

export async function getStreak(userId: string): Promise<StreakResult | null> {
  const result = await query<{
    current_streak: number
    longest_streak: number
  }>(
    'SELECT current_streak, longest_streak FROM streaks WHERE user_id = $1',
    [userId]
  )
  if (!result.rows[0]) return null
  return { ...result.rows[0], is_new_day: false }
}

// Called by nightly cron — resets streaks for users who missed a day
export async function resetExpiredStreaks(): Promise<number> {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  const result = await query(
    `UPDATE streaks
     SET current_streak = 0, updated_at = NOW()
     WHERE last_activity_date < $1 AND current_streak > 0`,
    [yesterdayStr]
  )
  return result.rowCount ?? 0
}
