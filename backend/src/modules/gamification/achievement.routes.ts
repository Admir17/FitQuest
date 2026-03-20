import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import { getUserAchievements } from './achievement.service'
import { getStreak } from './streak.service'

const router = Router()

/** GET /api/achievements — all achievements with unlock status */
router.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const achievements = await getUserAchievements(req.user!.id)
    res.json({ data: achievements })
  } catch (err) { next(err) }
})

/** GET /api/achievements/streak — current streak */
router.get('/streak', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const streak = await getStreak(req.user!.id)
    res.json({ data: streak })
  } catch (err) { next(err) }
})

export default router
