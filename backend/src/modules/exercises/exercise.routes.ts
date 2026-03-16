import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import { ownsExercise } from '../../middleware/ownership.middleware'
import * as exerciseController from './exercise.controller'

const router = Router()

// All exercise routes require authentication
router.use(requireAuth)

router.get('/',    exerciseController.list)
router.post('/',   exerciseController.create)
router.put('/:id', ownsExercise, exerciseController.update)
router.delete('/:id', ownsExercise, exerciseController.remove)

export default router
