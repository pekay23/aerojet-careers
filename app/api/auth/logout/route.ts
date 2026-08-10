import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE } from '@/lib/auth'
import { revokeRefreshToken } from '@/lib/refresh-token'

export async function POST() {
  const store = await cookies()
  const refreshToken = store.get('refresh_token')?.value

  if (refreshToken) {
    await revokeRefreshToken(refreshToken)
  }

  const res = NextResponse.json({ success: true })
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
  res.cookies.set('refresh_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/refresh',
    maxAge: 0,
  })
  return res
}
