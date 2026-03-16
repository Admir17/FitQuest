import type { Request, Response, NextFunction } from 'express'
import { query } from '../db/pool'

/**
 * Verifies that the authenticated user owns the requested resource.
 * Must be used after requireAuth middleware.
 *
 * Usage: router.delete('/:id', requireAuth, ownsWorkout, handler)
 */

/** Check that req.user owns the workout session */
export async function ownsWorkout(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params
  const userId = req.user!.id

  const result = await query(
    'SELECT id FROM workout_sessions WHERE id = $1 AND user_id = $2',
    [id, userId]
  )

  if (!result.rowCount) {
    return res.status(404).json({ error: 'Workout not found.' })
  }

  next()
}

/** Check that req.user owns the exercise (must not be a system exercise) */
export async function ownsExercise(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id } = req.params
  const userId = req.user!.id

  const result = await query(
    'SELECT id FROM exercises WHERE id = $1 AND created_by = $2 AND is_system = FALSE',
    [id, userId]
  )

  if (!result.rowCount) {
    return res.status(404).json({ error: 'Exercise not found.' })
  }

  next()
}

/** Check that a workout set belongs to a session owned by req.user */
export async function ownsWorkoutSet(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const { id, setId } = req.params
  const userId = req.user!.id

  const result = await query(
    `SELECT ws.id FROM workout_sets ws
     JOIN workout_sessions s ON s.id = ws.session_id
     WHERE ws.id = $1 AND s.id = $2 AND s.user_id = $3`,
    [setId, id, userId]
  )

  if (!result.rowCount) {
    return res.status(404).json({ error: 'Set not found.' })
  }

  next()
}
