import { SignJWT, jwtVerify } from 'jose'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { pool } from './db'

/**
 * Local auth (replaces Supabase Auth) for the Neon migration.
 *
 * - Passwords are bcrypt-hashed and stored in `auth_users.password_hash`.
 * - Sessions are stateless JWTs stored in an httpOnly cookie.
 * - `getServerUser()` reads and verifies the cookie on the server.
 */

export const SESSION_COOKIE = 'aj_session'
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days

function getSecret(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET
  if (!secret) {
    throw new Error('[auth] Missing AUTH_SECRET env var (used to sign sessions)')
  }
  return new TextEncoder().encode(secret)
}

export interface SessionUser {
  id: string
  email: string
  user_metadata?: Record<string, any>
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({
    email: user.email,
    user_metadata: user.user_metadata ?? {},
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecret())
}

export async function verifySession(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    if (!payload.sub) return null
    return {
      id: payload.sub,
      email: (payload as any).email,
      user_metadata: (payload as any).user_metadata ?? {},
    }
  } catch {
    return null
  }
}

/** Read + verify the session cookie on the server. */
export async function getServerUser(): Promise<SessionUser | null> {
  const store = await cookies()
  const token = store.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifySession(token)
}

/** Authenticate an email/password pair against auth_users. */
export async function authenticate(
  email: string,
  password: string
): Promise<{ user: SessionUser | null; error: string | null }> {
  const res = await pool.query(
    'SELECT id, email, password_hash, user_metadata FROM auth_users WHERE lower(email) = lower($1) LIMIT 1',
    [email]
  )
  const row = res.rows[0]
  if (!row) return { user: null, error: 'Invalid login credentials' }

  const ok = await verifyPassword(password, row.password_hash)
  if (!ok) return { user: null, error: 'Invalid login credentials' }

  await pool.query('UPDATE auth_users SET last_login = NOW() WHERE id = $1', [
    row.id,
  ])

  return {
    user: {
      id: row.id,
      email: row.email,
      user_metadata: row.user_metadata ?? {},
    },
    error: null,
  }
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS
