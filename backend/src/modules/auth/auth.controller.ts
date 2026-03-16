import type { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import * as authService from './auth.service'

// ── Validation schemas ────────────────────────────────────────

const registerSchema = z.object({
  email:    z.string().email('Invalid email address'),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be at most 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain letters, numbers, and underscores'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),  // bcrypt limit
})

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ── Cookie config ─────────────────────────────────────────────

const REFRESH_COOKIE = 'fq_refresh'

const refreshCookieOptions = {
  httpOnly: true,                                    // not accessible via JS
  secure:   process.env.NODE_ENV === 'production',   // HTTPS only in production
  sameSite: 'strict' as const,
  maxAge:   7 * 24 * 60 * 60 * 1000,                // 7 days in ms
  path:     '/api/auth',                             // only sent to auth endpoints
}

// ── Handlers ──────────────────────────────────────────────────

/** POST /api/auth/register */
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const body = registerSchema.safeParse(req.body)
    if (!body.success) {
      const details = Object.fromEntries(
        body.error.errors.map((e) => [e.path.join('.'), e.message])
      )
      return res.status(400).json({ error: 'Validation failed', details })
    }

    const { user, tokens } = await authService.register(
      body.data.email,
      body.data.username,
      body.data.password
    )

    res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions)

    return res.status(201).json({
      data: { user, accessToken: tokens.accessToken },
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_OR_USERNAME_TAKEN') {
      return res.status(409).json({ error: 'Email or username is already taken.' })
    }
    next(err)
  }
}

/** POST /api/auth/login */
export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const body = loginSchema.safeParse(req.body)
    if (!body.success) {
      return res.status(400).json({ error: 'Email and password are required.' })
    }

    const { user, tokens } = await authService.login(
      body.data.email,
      body.data.password
    )

    res.cookie(REFRESH_COOKIE, tokens.refreshToken, refreshCookieOptions)

    return res.status(200).json({
      data: { user, accessToken: tokens.accessToken },
    })
  } catch (err) {
    if (err instanceof Error && err.message === 'INVALID_CREDENTIALS') {
      // Generic message — don't reveal whether email or password was wrong
      return res.status(401).json({ error: 'Invalid email or password.' })
    }
    next(err)
  }
}

/** POST /api/auth/refresh */
export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE]
    if (!rawToken) {
      return res.status(401).json({ error: 'No refresh token provided.' })
    }

    const { accessToken } = await authService.refreshAccessToken(rawToken)
    return res.status(200).json({ data: { accessToken } })
  } catch (err) {
    if (err instanceof Error) {
      if (err.message === 'INVALID_REFRESH_TOKEN') {
        return res.status(401).json({ error: 'Invalid refresh token.' })
      }
      if (err.message === 'REFRESH_TOKEN_EXPIRED') {
        res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
        return res.status(401).json({ error: 'Session expired, please log in again.' })
      }
    }
    next(err)
  }
}

/** POST /api/auth/logout */
export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    const rawToken = req.cookies?.[REFRESH_COOKIE]
    if (rawToken) {
      await authService.logout(rawToken)
    }

    res.clearCookie(REFRESH_COOKIE, { path: '/api/auth' })
    return res.status(200).json({ data: { message: 'Logged out successfully.' } })
  } catch (err) {
    next(err)
  }
}
