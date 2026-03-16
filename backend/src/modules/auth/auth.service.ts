import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { query, getClient } from '../../db/pool'
import type { User, PublicUser } from '../../types'

// ── Token config ─────────────────────────────────────────────

const ACCESS_SECRET  = process.env.JWT_SECRET!
const ACCESS_EXPIRY  = process.env.JWT_ACCESS_EXPIRES_IN  ?? '15m'
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d'
const BCRYPT_ROUNDS  = 12

export interface TokenPair {
  accessToken: string
  refreshToken: string
}

export interface AuthPayload {
  user: PublicUser
  tokens: TokenPair
}

// ── Helpers ───────────────────────────────────────────────────

/** Sign a short-lived JWT access token */
function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId }, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY })
}

/** Generate a cryptographically secure refresh token and its SHA-256 hash */
function generateRefreshToken(): { raw: string; hash: string } {
  const raw  = crypto.randomBytes(64).toString('hex')
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  return { raw, hash }
}

/** Strip password_hash before returning user data to callers */
function toPublicUser(user: User): PublicUser {
  const { password_hash: _, ...publicUser } = user
  return publicUser
}

// ── Register ─────────────────────────────────────────────────

export async function register(
  email: string,
  username: string,
  password: string
): Promise<AuthPayload> {
  // Check for existing email or username
  const existing = await query<{ id: string }>(
    'SELECT id FROM users WHERE email = $1 OR username = $2 LIMIT 1',
    [email.toLowerCase(), username]
  )
  if (existing.rowCount && existing.rowCount > 0) {
    throw new Error('EMAIL_OR_USERNAME_TAKEN')
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS)

  // Use a transaction: create user + streak record atomically
  const client = await getClient()
  try {
    await client.query('BEGIN')

    const userResult = await client.query<User>(
      `INSERT INTO users (email, username, password_hash)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [email.toLowerCase(), username, password_hash]
    )
    const user = userResult.rows[0]

    // Every user gets a streak record on registration
    await client.query(
      'INSERT INTO streaks (user_id) VALUES ($1)',
      [user.id]
    )

    await client.query('COMMIT')

    const tokens = await createTokenPair(user.id, client)
    return { user: toPublicUser(user), tokens }
  } catch (err) {
    await client.query('ROLLBACK')
    throw err
  } finally {
    client.release()
  }
}

// ── Login ─────────────────────────────────────────────────────

export async function login(
  email: string,
  password: string
): Promise<AuthPayload> {
  const result = await query<User>(
    'SELECT * FROM users WHERE email = $1',
    [email.toLowerCase()]
  )

  const user = result.rows[0]

  // Always run bcrypt compare to prevent timing attacks,
  // even if the user doesn't exist
  const dummyHash = '$2a$12$invalidhashfortimingattackprevention000000000000000000'
  const isValid = await bcrypt.compare(password, user?.password_hash ?? dummyHash)

  if (!user || !isValid) {
    throw new Error('INVALID_CREDENTIALS')
  }

  const tokens = await createTokenPair(user.id)
  return { user: toPublicUser(user), tokens }
}

// ── Refresh ───────────────────────────────────────────────────

export async function refreshAccessToken(
  rawRefreshToken: string
): Promise<{ accessToken: string }> {
  const hash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex')

  const result = await query<{ user_id: string; expires_at: Date }>(
    `SELECT user_id, expires_at FROM refresh_tokens
     WHERE token_hash = $1`,
    [hash]
  )

  const record = result.rows[0]
  if (!record) throw new Error('INVALID_REFRESH_TOKEN')
  if (new Date() > new Date(record.expires_at)) {
    // Clean up the expired token
    await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [hash])
    throw new Error('REFRESH_TOKEN_EXPIRED')
  }

  return { accessToken: signAccessToken(record.user_id) }
}

// ── Logout ────────────────────────────────────────────────────

export async function logout(rawRefreshToken: string): Promise<void> {
  const hash = crypto.createHash('sha256').update(rawRefreshToken).digest('hex')
  await query('DELETE FROM refresh_tokens WHERE token_hash = $1', [hash])
}

/** Revoke all refresh tokens for a user (e.g. "log out all devices") */
export async function logoutAll(userId: string): Promise<void> {
  await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId])
}

// ── Verify JWT (used by auth middleware) ─────────────────────

export function verifyAccessToken(token: string): { sub: string } {
  return jwt.verify(token, ACCESS_SECRET) as { sub: string }
}

// ── Internal: create and persist a token pair ────────────────

async function createTokenPair(
  userId: string,
  client?: Awaited<ReturnType<typeof getClient>>
): Promise<TokenPair> {
  const accessToken  = signAccessToken(userId)
  const { raw, hash } = generateRefreshToken()

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  const run = client ?? { query: (text: string, params: unknown[]) => query(text, params) }

  await run.query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, hash, expiresAt]
  )

  // Limit to 5 active refresh tokens per user (sliding window)
  await run.query(
    `DELETE FROM refresh_tokens
     WHERE user_id = $1
       AND id NOT IN (
         SELECT id FROM refresh_tokens
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT 5
       )`,
    [userId]
  )

  return { accessToken, refreshToken: raw }
}
