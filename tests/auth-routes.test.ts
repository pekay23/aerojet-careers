import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/auth', () => ({
  authenticate: vi.fn(),
  SESSION_COOKIE: 'session',
  SESSION_MAX_AGE: 604800,
  signSession: vi.fn(),
}))
vi.mock('@/lib/refresh-token', () => ({
  issueRefreshToken: vi.fn().mockResolvedValue('refresh-token-id'),
}))

describe('POST /api/auth/login', () => {
  it('returns 429 when rate limited', async () => {
    vi.doMock('@/lib/rate-limit', () => ({
      checkLoginRateLimit: vi.fn().mockResolvedValue({ success: false, remaining: 0 }),
    }))

    const { POST } = await import('@/app/api/auth/login/route')
    const req = {
      json: () => Promise.resolve({ email: 'user@example.com', password: 'pass' }),
    } as any

    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it('issues session and refresh cookies on success', async () => {
    vi.doMock('@/lib/rate-limit', () => ({
      checkLoginRateLimit: vi.fn().mockResolvedValue({ success: true, remaining: 3 }),
    }))

    const { authenticate, signSession } = require('@/lib/auth')
    authenticate.mockResolvedValue({
      user: { id: 'auth-1', email: 'user@example.com', user_metadata: {} },
      error: null,
    })
    signSession.mockResolvedValue('jwt-token')

    const { POST } = await import('@/app/api/auth/login/route')
    const req = {
      json: () => Promise.resolve({ email: 'user@example.com', password: 'pass' }),
    } as any

    const res = await POST(req)
    expect(res.status).toBe(200)
  })
})
