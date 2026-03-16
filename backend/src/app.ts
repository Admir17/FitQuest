import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import { rateLimit } from 'express-rate-limit'
import authRoutes     from './modules/auth/auth.routes'
import exerciseRoutes from './modules/exercises/exercise.routes'
import workoutRoutes  from './modules/workouts/workout.routes'
import templateRoutes from './modules/templates/template.routes'

const app = express()

// ── Security middleware ────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,
}))

// ── Body & cookie parsers ──────────────────────────────────
app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

// ── Global rate limiting ───────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}))

// ── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── API routes ─────────────────────────────────────────────
app.use('/api/auth',      authRoutes)
app.use('/api/exercises', exerciseRoutes)
app.use('/api/workouts',  workoutRoutes)
app.use('/api/templates', templateRoutes)
// app.use('/api/users',         userRoutes)        — M4
// app.use('/api/achievements',  achievementRoutes) — M3

// ── 404 handler ───────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' })
})

// ── Global error handler ───────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message,
  })
})

export default app
