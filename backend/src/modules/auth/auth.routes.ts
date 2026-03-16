import { Router } from 'express'
import { rateLimit } from 'express-rate-limit'
import * as authController from './auth.controller'

const router = Router()

// ── Strict rate limit for login and register ──────────────────
// Prevents brute-force and credential stuffing attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again in 15 minutes.' },
  skipSuccessfulRequests: true, // only count failed requests against the limit
})

// ── Routes ────────────────────────────────────────────────────

router.post('/register', authLimiter, authController.register)
router.post('/login',    authLimiter, authController.login)
router.post('/refresh',              authController.refresh)
router.post('/logout',               authController.logout)

export default router
