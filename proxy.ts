import { NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

/**
 * Edge middleware — protects /admin and /api/admin routes.
 *
 * Verifies the JWT session cookie directly (edge-safe, no pg / no next/headers).
 * Mirrors lib/auth.ts session config.
 *
 * Also blocks direct requests to sensitive paths (source, config, lockfile)
 * by returning 404 so they are not exposed to the public.
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

  // Block sensitive files/config from being fetched directly.
  if (isSensitivePath(pathname)) {
    return new NextResponse(null, { status: 404 })
  }

  // Segment-boundary check: /admin and /admin/... only.
  // Prevents a future /admin-public route from being caught by the
  // catch-all matcher and misclassified as admin.
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAdminApi = pathname.startsWith('/api/admin/')

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

const SENSITIVE_PATHS: string[] = [
  '/.env',
  '/.env.',
  '/.git/',
  '/.next/',
  '/node_modules/',
  '/package.json',
  '/package-lock.json',
  '/bun.lock',
  '/bun.lockb',
  '/tsconfig.json',
  '/next.config.js',
  '/next.config.ts',
  '/next.config.mjs',
  '/proxy.ts',
  '/proxy.js',
  '/middleware.ts',
  '/middleware.js',
  '/eslint.config.js',
  '/eslint.config.ts',
  '/eslint.config.mjs',
  '/postcss.config.js',
  '/postcss.config.ts',
  '/tailwind.config.js',
  '/tailwind.config.ts',
  '/tailwind.config.mjs',
  '/vitest.config.ts',
  '/vitest.config.js',
  '/playwright.config.ts',
  '/playwright.config.js',
  '/vercel.json',
  '/renovate.json',
  '/scripts/',
  '/src/',
  '/db/',
  '/lib/',
  '/types/',
  '/public/.well-known/',
  '/.github/',
  '/.kilo/',
  '/.bunfig.toml',
  '/.gitignore',
  '/AGENTS.md',
  '/CLAUDE.md',
  '/AUDIT_REPORT.md',
]

function isSensitivePath(path: string): boolean {
  for (const prefix of SENSITIVE_PATHS) {
    if (path === prefix || path.startsWith(prefix)) return true
  }
  return false
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/development (Turbopack dev-mode HMR & page chunks)
     * - favicon.ico (favicon file)
     *
     * This lets the proxy block sensitive paths (/.env, /package.json, etc.)
     * across all non-API, non-static routes.
     */
    '/((?!api|_next/static|_next/image|_next/development|favicon.ico).*)',
  ],
}