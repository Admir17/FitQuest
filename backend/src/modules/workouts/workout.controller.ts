import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as workoutService from './workout.service'

// ── Validation schemas ────────────────────────────────────────

const startSchema = z.object({
  name:        z.string().min(1).max(100),
  template_id: z.string().uuid().optional(),
})

const addSetSchema = z.object({
  exercise_id:  z.string().uuid('Invalid exercise ID'),
  set_number:   z.number().int().min(1),
  reps:         z.number().int().min(1).optional(),
  weight_kg:    z.number().min(0).optional(),
  duration_sec: z.number().int().min(1).optional(),
}).refine(
  (d) => d.reps !== undefined || d.duration_sec !== undefined,
  { message: 'Either reps or duration_sec must be provided' }
)

// ── Handlers ─────────────────────────────────────────────────

/** GET /api/workouts */
export async function list(req: Request, res: Response, next: NextFunction) {
  try {
    const sessions = await workoutService.listSessions(req.user!.id)
    res.json({ data: sessions })
  } catch (err) {
    next(err)
  }
}

/** GET /api/workouts/:id */
export async function get(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await workoutService.getSession(req.params.id, req.user!.id)
    if (!session) return res.status(404).json({ error: 'Workout not found.' })
    res.json({ data: session })
  } catch (err) {
    next(err)
  }
}

/** POST /api/workouts */
export async function start(req: Request, res: Response, next: NextFunction) {
  try {
    const body = startSchema.safeParse(req.body)
    if (!body.success) {
      const details = Object.fromEntries(
        body.error.errors.map((e) => [e.path.join('.'), e.message])
      )
      return res.status(400).json({ error: 'Validation failed', details })
    }

    const session = await workoutService.startSession(req.user!.id, body.data)
    res.status(201).json({ data: session })
  } catch (err) {
    next(err)
  }
}

/** PUT /api/workouts/:id */
export async function rename(req: Request, res: Response, next: NextFunction) {
  try {
    const { name } = req.body
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name is required.' })
    }
    const session = await workoutService.renameSession(req.params.id, name.trim())
    res.json({ data: session })
  } catch (err) {
    next(err)
  }
}

/** PUT /api/workouts/:id/finish */
export async function finish(req: Request, res: Response, next: NextFunction) {
  try {
    const { session, events } = await workoutService.finishSession(req.params.id)
    res.json({ data: session, events })
  } catch (err) {
    next(err)
  }
}

/** DELETE /api/workouts/:id */
export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await workoutService.deleteSession(req.params.id)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

/** POST /api/workouts/:id/sets */
export async function addSet(req: Request, res: Response, next: NextFunction) {
  try {
    const body = addSetSchema.safeParse(req.body)
    if (!body.success) {
      const details = Object.fromEntries(
        body.error.errors.map((e) => [e.path.join('.'), e.message])
      )
      return res.status(400).json({ error: 'Validation failed', details })
    }

    const result = await workoutService.addSet(
      req.params.id,
      req.user!.id,
      body.data
    )

    res.status(201).json({
      data: { set: result.set },
      xp_awarded: result.xp_awarded,
      events: result.events,
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'EXERCISE_NOT_FOUND') {
      return res.status(404).json({ error: 'Exercise not found.' })
    }
    next(err)
  }
}

/** DELETE /api/workouts/:id/sets/:setId */
export async function removeSet(req: Request, res: Response, next: NextFunction) {
  try {
    await workoutService.deleteSet(req.params.setId)
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
