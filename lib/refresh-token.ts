import 'server-only'
import { cookies } from 'next/headers'
import { pool } from '@/lib/db'
import { SESSION_COOKIE, SessionUser, signSession, SESSION_MAX_AGE } from '@/lib/auth'
import { NextResponse } from 'next/server'

const REFRESH_COOKIE = 'refresh_token'
const REFRESH_TTL_MS = SESSION_MAX_AGE * 1000 * 30 / 7

export async function issueRefreshToken(userId: string): Promise<string> {
  const { randomBytes } = await import('crypto')
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + REFRESH_TTL_MS)

  await pool.query(
    `INSERT INTO refresh_tokens (token, auth_user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expiresAt]
  )
  return token
}

export async function consumeRefreshToken(
  token: string
): Promise<{ user: SessionUser | null; error: string | null }> {
  const res = await pool.query(
    `SELECT rt.token, rt.auth_user_id, rt.expires_at,
            au.id, au.email, au.user_metadata
     FROM refresh_tokens rt
     JOIN auth_users au ON au.id = rt.auth_user_id
     WHERE rt.token = $1`,
    [token]
  )

  const row = res.rows[0]
  if (!row) return { user: null, error: 'Invalid refresh token' }

  if (new Date(row.expires_at) < new Date()) {
    return { user: null, error: 'Refresh token expired' }
  }

  await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token])

  return {
    user: { id: row.id, email: row.email, user_metadata: row.user_metadata ?? {} },
    error: null,
  }
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await pool.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token])
}

export async function refreshSession(): Promise<NextResponse> {
  const store = await cookies()
  const refreshToken = store.get(REFRESH_COOKIE)?.value

  if (!refreshToken) {
    return NextResponse.json({ error: 'No refresh token' }, { status: 401 })
  }

  const { user, error } = await consumeRefreshToken(refreshToken)
  if (error || !user) {
    return NextResponse.json({ error }, { status: 401 })
  }

  const newToken = await signSession(user)
  const newRefreshId = await issueRefreshToken(user.id)

  const res = NextResponse.json({ user })
  res.cookies.set(SESSION_COOKIE, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  res.cookies.set(REFRESH_COOKIE, newRefreshId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: SESSION_MAX_AGE * 30 / 7,
  })
  return res
}
