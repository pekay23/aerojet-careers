import { NextRequest, NextResponse } from 'next/server'
import { authenticate, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'
import { issueRefreshToken } from '@/lib/refresh-token'
import { checkLoginRateLimit } from '@/lib/rate-limit'
import { sanitizeErrorMessage } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const { success } = await checkLoginRateLimit(email)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const { user, error } = await authenticate(email, password)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Invalid login credentials' }, { status: 401 })
    }

    const token = await signSession(user)
    const refreshId = await issueRefreshToken(user.id)

    const res = NextResponse.json({ user })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
    res.cookies.set('refresh_token', refreshId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: SESSION_MAX_AGE * 30 / 7,
    })
    return res
  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 })
  }
}
