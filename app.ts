import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { rateLimit } from 'express-rate-limit'

const app = express()

// ── Security middleware ────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  credentials: true,   // required for httpOnly refresh token cookie
}))

// ── Body parser ────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }))

// ── Global rate limiting ───────────────────────────────────
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
}))

// ── Health check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── API routes (added incrementally per milestone) ────────
// app.use('/api/auth',         authRoutes)
// app.use('/api/users',        userRoutes)
// app.use('/api/workouts',     workoutRoutes)
// app.use('/api/exercises',    exerciseRoutes)
// app.use('/api/templates',    templateRoutes)
// app.use('/api/achievements', achievementRoutes)

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
