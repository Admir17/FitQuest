import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'

const router = Router()

/** GET /api/users/me — returns the authenticated user */
router.get('/me', requireAuth, (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ data: req.user })
  } catch (err) {
    next(err)
  }
})

export default router
