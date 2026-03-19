import { Router } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import { ownsWorkout, ownsWorkoutSet } from '../../middleware/ownership.middleware'
import * as workoutController from './workout.controller'

const router = Router()

// All workout routes require authentication
router.use(requireAuth)

router.get('/',    workoutController.list)
router.post('/',   workoutController.start)
router.get('/:id',           ownsWorkout, workoutController.get)
router.put('/:id',           ownsWorkout, workoutController.rename)
router.put('/:id/finish',    ownsWorkout, workoutController.finish)
router.delete('/:id',        ownsWorkout, workoutController.remove)
router.post('/:id/sets',     ownsWorkout, workoutController.addSet)
router.delete('/:id/sets/:setId', ownsWorkout, ownsWorkoutSet, workoutController.removeSet)

export default router
