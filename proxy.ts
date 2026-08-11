import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Edge middleware — protects /admin and /api/admin routes.
 *
 * Verifies the JWT session cookie directly (edge-safe, no pg / no next/headers).
 * Mirrors lib/auth.ts session config.
 */

const SESSION_COOKIE = 'aj_session'

function getSecret(): Uint8Array | null {
  const secret =
    process.env.AUTH_SECRET ||
    process.env.JWT_SECRET ||
    process.env.NEXTAUTH_SECRET
  if (!secret) return null
  return new TextEncoder().encode(secret)
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminPath = pathname.startsWith('/admin')
  const isAdminApi = pathname.startsWith('/api/admin')

  // Skip guard for login page
  if (pathname === '/login') {
    return NextResponse.next()
  }

  if (!isAdminPath && !isAdminApi) {
    return NextResponse.next()
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value
  const secret = getSecret()

  let valid = false
  if (token && secret) {
    try {
      await jwtVerify(token, secret)
      valid = true
    } catch {
      valid = false
    }
  }

  if (!valid) {
    if (isAdminApi) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const url = new URL('/login', request.url)
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
}
