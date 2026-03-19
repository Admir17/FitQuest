import { query, getClient } from '../../db/pool'
import type { WorkoutSession, WorkoutSet } from '../../types'
import type { GameEvent } from '../../types'
import { calculateSetXp, levelForXp } from '../../utils/xp.calculator'

// ── List sessions ─────────────────────────────────────────────

export async function listSessions(userId: string): Promise<WorkoutSession[]> {
  // Clean up empty unfinished sessions older than 1 hour before listing
  await query(
    `DELETE FROM workout_sessions
     WHERE user_id = $1
       AND finished_at IS NULL
       AND started_at < NOW() - INTERVAL '1 hour'
       AND id NOT IN (SELECT session_id FROM workout_sets)`,
    [userId]
  )

  const result = await query<WorkoutSession>(
    `SELECT * FROM workout_sessions
     WHERE user_id = $1
     ORDER BY started_at DESC`,
    [userId]
  )
  return result.rows
}

// ── Get session with sets ─────────────────────────────────────

export async function getSession(
  id: string,
  userId: string
): Promise<(WorkoutSession & { sets: WorkoutSet[] }) | null> {
  const sessionResult = await query<WorkoutSession>(
    'SELECT * FROM workout_sessions WHERE id = $1 AND user_id = $2',
    [id, userId]
  )
  const session = sessionResult.rows[0]
  if (!session) return null

  const setsResult = await query<WorkoutSet>(
    `SELECT ws.*, e.name as exercise_name
     FROM workout_sets ws
     JOIN exercises e ON e.id = ws.exercise_id
     WHERE ws.session_id = $1
     ORDER BY ws.created_at ASC`,
    [id]
  )

  return { ...session, sets: setsResult.rows }
}

// ── Start session ─────────────────────────────────────────────

export async function startSession(
  userId: string,
  data: { name: string; template_id?: string }
): Promise<WorkoutSession> {
  const result = await query<WorkoutSession>(
    `INSERT INTO workout_sessions (user_id, template_id, name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [userId, data.template_id ?? null, data.name]
  )
  return result.rows[0]
}

// ── Finish session ────────────────────────────────────────────

export async function finishSession(id: string): Promise<WorkoutSession> {
  const result = await query<WorkoutSession>(
    `UPDATE workout_sessions
     SET finished_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id]
  )
  return result.rows[0]
}

// ── Delete session ────────────────────────────────────────────

export async function deleteSession(id: string): Promise<void> {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    // Get total XP earned in this session before deleting
    const sessionResult = await client.query<{ user_id: string; xp_earned: number }>(
      'SELECT user_id, xp_earned FROM workout_sessions WHERE id = $1',
      [id]
    )
    const session = sessionResult.rows[0]
    if (!session) { await client.query('ROLLBACK'); return }

    // Deduct XP from user and remove related XP logs
    if (session.xp_earned > 0) {
      // Deduct XP and recalculate level
      const updatedUser = await client.query<{ xp_total: number }>(
        'UPDATE users SET xp_total = GREATEST(0, xp_total - $1) WHERE id = $2 RETURNING xp_total',
        [session.xp_earned, session.user_id]
      )
      const newXp = updatedUser.rows[0].xp_total
      const newLevel = levelForXp(newXp)
      await client.query('UPDATE users SET level = $1 WHERE id = $2', [newLevel, session.user_id])
      await client.query(
        `DELETE FROM xp_logs WHERE source_id IN (
           SELECT id FROM workout_sets WHERE session_id = $1
         )`,
        [id]
      )
    }

    // Delete session — cascades to workout_sets
    await client.query('DELETE FROM workout_sessions WHERE id = $1', [id])

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── Add set (synchronous XP award) ───────────────────────────

export interface AddSetResult {
  set: WorkoutSet
  xp_awarded: number
  events: GameEvent[]
}

export async function addSet(
  sessionId: string,
  userId: string,
  data: {
    exercise_id: string
    set_number: number
    reps?: number
    weight_kg?: number
    duration_sec?: number
  }
): Promise<AddSetResult> {
  const client = await getClient()
  const events: GameEvent[] = []

  try {
    await client.query('BEGIN')

    // Get exercise xp_per_set
    const exerciseResult = await client.query<{ xp_per_set: number }>(
      'SELECT xp_per_set FROM exercises WHERE id = $1',
      [data.exercise_id]
    )
    if (!exerciseResult.rowCount) throw new Error('EXERCISE_NOT_FOUND')
    const { xp_per_set } = exerciseResult.rows[0]

    // Get current streak for multiplier
    const streakResult = await client.query<{ current_streak: number }>(
      'SELECT current_streak FROM streaks WHERE user_id = $1',
      [userId]
    )
    const streak_days = streakResult.rows[0]?.current_streak ?? 0

    // Calculate XP
    const xp_awarded = calculateSetXp({
      xp_per_set,
      reps: data.reps,
      weight_kg: data.weight_kg,
      streak_days,
    })

    // Insert the set
    const setResult = await client.query<WorkoutSet>(
      `INSERT INTO workout_sets
         (session_id, exercise_id, set_number, reps, weight_kg, duration_sec, xp_awarded)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        sessionId,
        data.exercise_id,
        data.set_number,
        data.reps ?? null,
        data.weight_kg ?? null,
        data.duration_sec ?? null,
        xp_awarded,
      ]
    )
    const set = setResult.rows[0]

    // Write XP log entry
    await client.query(
      `INSERT INTO xp_logs (user_id, source_id, source_type, xp_amount, reason)
       VALUES ($1, $2, 'workout_set', $3, $4)`,
      [userId, set.id, xp_awarded, `Set ${data.set_number} — exercise ${data.exercise_id}`]
    )

    // Update user xp_total and recalculate level
    const userResult = await client.query<{ xp_total: number; level: number }>(
      `UPDATE users
       SET xp_total = xp_total + $1
       WHERE id = $2
       RETURNING xp_total, level`,
      [xp_awarded, userId]
    )
    const { xp_total, level: oldLevel } = userResult.rows[0]
    const newLevel = levelForXp(xp_total)

    events.push({ type: 'XP_GAINED', payload: { amount: xp_awarded, total: xp_total } })

    // Check for level up
    if (newLevel > oldLevel) {
      await client.query(
        'UPDATE users SET level = $1 WHERE id = $2',
        [newLevel, userId]
      )
      events.push({ type: 'LEVEL_UP', payload: { newLevel } })
    }

    // Update session xp_earned
    await client.query(
      'UPDATE workout_sessions SET xp_earned = xp_earned + $1 WHERE id = $2',
      [xp_awarded, sessionId]
    )

    await client.query('COMMIT')
    return { set, xp_awarded, events }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── Delete set ────────────────────────────────────────────────

export async function deleteSet(setId: string): Promise<void> {
  const client = await getClient()
  try {
    await client.query('BEGIN')

    // Get set XP and session info before deleting
    const setResult = await client.query<{ xp_awarded: number; session_id: string }>(
      'SELECT xp_awarded, session_id FROM workout_sets WHERE id = $1',
      [setId]
    )
    const set = setResult.rows[0]
    if (!set) { await client.query('ROLLBACK'); return }

    // Get user_id from session
    const sessionResult = await client.query<{ user_id: string }>(
      'SELECT user_id FROM workout_sessions WHERE id = $1',
      [set.session_id]
    )
    const userId = sessionResult.rows[0]?.user_id

    // Delete the set
    await client.query('DELETE FROM workout_sets WHERE id = $1', [setId])

    // Check if session has no sets left — auto delete if empty
    const remainingSets = await client.query(
      'SELECT COUNT(*) as count FROM workout_sets WHERE session_id = $1',
      [set.session_id]
    )
    if (parseInt(remainingSets.rows[0].count) === 0) {
      // Still deduct XP before deleting the session
      if (userId && set.xp_awarded > 0) {
        const updated = await client.query<{ xp_total: number }>(
          'UPDATE users SET xp_total = GREATEST(0, xp_total - $1) WHERE id = $2 RETURNING xp_total',
          [set.xp_awarded, userId]
        )
        const newXp = updated.rows[0]?.xp_total ?? 0
        await client.query('UPDATE users SET level = $1 WHERE id = $2', [levelForXp(newXp), userId])
        await client.query('DELETE FROM xp_logs WHERE source_id = $1', [setId])
      }
      await client.query('DELETE FROM workout_sessions WHERE id = $1', [set.session_id])
      await client.query('COMMIT')
      return
    }

    if (userId && set.xp_awarded > 0) {
      // Deduct XP from user and session
      const updated = await client.query<{ xp_total: number }>(
        'UPDATE users SET xp_total = GREATEST(0, xp_total - $1) WHERE id = $2 RETURNING xp_total',
        [set.xp_awarded, userId]
      )
      const newXp = updated.rows[0]?.xp_total ?? 0
      await client.query('UPDATE users SET level = $1 WHERE id = $2', [levelForXp(newXp), userId])
      await client.query(
        'UPDATE workout_sessions SET xp_earned = GREATEST(0, xp_earned - $1) WHERE id = $2',
        [set.xp_awarded, set.session_id]
      )
      await client.query('DELETE FROM xp_logs WHERE source_id = $1', [setId])
    }

    await client.query('COMMIT')
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── Rename session ────────────────────────────────────────────

export async function renameSession(id: string, name: string): Promise<WorkoutSession> {
  const result = await query<WorkoutSession>(
    'UPDATE workout_sessions SET name = $1 WHERE id = $2 RETURNING *',
    [name, id]
  )
  return result.rows[0]
}
