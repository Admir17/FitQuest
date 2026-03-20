import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as exerciseService from './exercise.service'
import { checkAndAwardAchievements } from '../gamification/achievement.service'

// ── Validation schemas ────────────────────────────────────────

const createSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  category: z.enum(['strength', 'cardio', 'core', 'flexibility', 'sport', 'custom']),
  muscle_groups: z.array(z.string()).min(1, 'At least one muscle group is required'),
})

const updateSchema = createSchema.partial()

// ── Handlers ─────────────────────────────────────────────────

/** GET /api/exercises */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const exercises = await exerciseService.listExercises(req.user!.id)
    res.json({ data: exercises })
  } catch (err) {
    next(err)
  }
}

/** POST /api/exercises */
export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const body = createSchema.safeParse(req.body)
    if (!body.success) {
      const details = Object.fromEntries(
        body.error.errors.map((e) => [e.path.join('.'), e.message])
      )
      return res.status(400).json({ error: 'Validation failed', details })
    }

    const exercise = await exerciseService.createExercise(req.user!.id, body.data)
    // Check for custom_exercise_created achievement
    const events = await checkAndAwardAchievements(req.user!.id).catch(() => [])
    return res.status(201).json({ data: exercise, events })
  } catch (err) {
    if (err instanceof Error && err.message === 'EXERCISE_NAME_TAKEN') {
      return res.status(409).json({ error: 'You already have an exercise with this name.' })
    }
    next(err)
  }
}

/** PUT /api/exercises/:id */
export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const body = updateSchema.safeParse(req.body)
    if (!body.success) {
      const details = Object.fromEntries(
        body.error.errors.map((e) => [e.path.join('.'), e.message])
      )
      return res.status(400).json({ error: 'Validation failed', details })
    }

    const exercise = await exerciseService.updateExercise(req.params.id, body.data)
    res.json({ data: exercise })
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/exercises/:id */
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await exerciseService.deleteExercise(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
