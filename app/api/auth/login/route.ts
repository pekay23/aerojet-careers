import { NextRequest, NextResponse } from 'next/server'
import { authenticate, signSession, SESSION_COOKIE, SESSION_MAX_AGE } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const { user, error } = await authenticate(email, password)
    if (error || !user) {
      return NextResponse.json({ error: error || 'Invalid login credentials' }, { status: 401 })
    }

    const token = await signSession(user)
    const res = NextResponse.json({ user })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE,
    })
    return res
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed' }, { status: 500 })
  }
}
