import { Router } from 'express'
import type { Request, Response, NextFunction } from 'express'
import * as templateService from './template.service'

const router = Router()

// Templates are public — no auth required to browse

/** GET /api/templates */
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await templateService.listTemplates()
    res.json({ data: templates })
  } catch (err) {
    next(err)
  }
})

/** GET /api/templates/:id */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const template = await templateService.getTemplate(req.params.id)
    if (!template) return res.status(404).json({ error: 'Template not found.' })
    res.json({ data: template })
  } catch (err) {
    next(err)
  }
})

export default router
