import { describe, it, expect, beforeEach, vi } from 'vitest'
import { hashPassword, verifyPassword, verifySession } from '@/lib/auth'

const SECRET = 'test-secret-for-unit-tests-only'

describe('hashPassword / verifyPassword', () => {
  it('hashes a password and verifies it correctly', async () => {
    const hash = await hashPassword('correct-horse')
    expect(hash).not.toBe('correct-horse')
    expect(await verifyPassword('correct-horse', hash)).toBe(true)
    expect(await verifyPassword('wrong-horse', hash)).toBe(false)
  })
})

describe('verifySession', () => {
  it('returns null for an invalid token', async () => {
    const result = await verifySession('not-a-valid-jwt')
    expect(result).toBeNull()
  })

  it('returns null for a token with no sub claim', async () => {
    const { SignJWT } = await import('jose')
    const token = await new SignJWT({ email: 'test@example.com' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(SECRET))
    const result = await verifySession(token)
    expect(result).toBeNull()
  })

  it('returns a SessionUser for a valid token', async () => {
    const { SignJWT } = await import('jose')
    const token = await new SignJWT({ email: 'test@example.com', user_metadata: { role: 'admin' } })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject('user-123')
      .setIssuedAt()
      .setExpirationTime('1h')
      .sign(new TextEncoder().encode(SECRET))

    const result = await verifySession(token)
    expect(result).not.toBeNull()
    expect(result!.id).toBe('user-123')
    expect(result!.email).toBe('test@example.com')
    expect(result!.user_metadata).toEqual({ role: 'admin' })
  })
})
