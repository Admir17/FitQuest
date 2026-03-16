import type { Request, Response, NextFunction } from 'express'
import { verifyAccessToken } from '../modules/auth/auth.service'
import { query } from '../db/pool'
import type { PublicUser } from '../types'

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      user?: PublicUser
    }
  }
}

/**
 * Verifies the JWT access token from the Authorization header.
 * Attaches the user to req.user on success.
 *
 * Usage: router.get('/protected', requireAuth, handler)
 */
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' })
  }

  const token = authHeader.slice(7)

  try {
    const payload = verifyAccessToken(token)

    // Fetch fresh user data — catches deleted/banned accounts
    const result = await query<PublicUser>(
      `SELECT id, email, username, avatar_url, xp_total, level, created_at, updated_at
       FROM users WHERE id = $1`,
      [payload.sub]
    )

    if (!result.rows[0]) {
      return res.status(401).json({ error: 'User no longer exists.' })
    }

    req.user = result.rows[0]
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' })
  }
}
