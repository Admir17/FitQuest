import { query } from '../../db/pool'
import type { Exercise, ExerciseCategory } from '../../types'

// ── List exercises ────────────────────────────────────────────

/**
 * Returns all system exercises plus any custom exercises
 * created by the requesting user.
 */
export async function listExercises(userId: string): Promise<Exercise[]> {
  const result = await query<Exercise>(
    `SELECT * FROM exercises
     WHERE is_system = TRUE OR created_by = $1
     ORDER BY is_system DESC, name ASC`,
    [userId]
  )
  return result.rows
}

// ── Get single exercise ───────────────────────────────────────

export async function getExercise(
  id: string,
  userId: string
): Promise<Exercise | null> {
  const result = await query<Exercise>(
    `SELECT * FROM exercises
     WHERE id = $1 AND (is_system = TRUE OR created_by = $2)`,
    [id, userId]
  )
  return result.rows[0] ?? null
}

// ── Create custom exercise ────────────────────────────────────

export async function createExercise(
  userId: string,
  data: {
    name: string
    category: ExerciseCategory
    muscle_groups: string[]
  }
): Promise<Exercise> {
  // Check for duplicate name for this user
  const existing = await query(
    `SELECT id FROM exercises
     WHERE name = $1 AND created_by = $2`,
    [data.name, userId]
  )
  if (existing.rowCount && existing.rowCount > 0) {
    throw new Error('EXERCISE_NAME_TAKEN')
  }

  const result = await query<Exercise>(
    `INSERT INTO exercises (name, category, muscle_groups, is_system, created_by, xp_per_set)
     VALUES ($1, $2, $3, FALSE, $4, 10)
     RETURNING *`,
    [data.name, data.category, data.muscle_groups, userId]
  )

  return result.rows[0]
}

// ── Update custom exercise ────────────────────────────────────

export async function updateExercise(
  id: string,
  data: Partial<{
    name: string
    category: ExerciseCategory
    muscle_groups: string[]
  }>
): Promise<Exercise> {
  const result = await query<Exercise>(
    `UPDATE exercises
     SET
       name          = COALESCE($1, name),
       category      = COALESCE($2, category),
       muscle_groups = COALESCE($3, muscle_groups)
     WHERE id = $4
     RETURNING *`,
    [data.name ?? null, data.category ?? null, data.muscle_groups ?? null, id]
  )
  return result.rows[0]
}

// ── Delete custom exercise ────────────────────────────────────

export async function deleteExercise(id: string): Promise<void> {
  await query('DELETE FROM exercises WHERE id = $1', [id])
}
