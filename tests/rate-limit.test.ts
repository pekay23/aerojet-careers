import { describe, it, expect } from 'vitest'
import { checkLoginRateLimit } from '@/lib/rate-limit'

describe('checkLoginRateLimit', () => {
  it('returns success=true when Upstash is not configured (memory fallback)', async () => {
    const { success, remaining } = await checkLoginRateLimit('test@example.com')
    expect(success).toBe(true)
    expect(remaining).toBe(4)
  })

  it('blocks after 5 attempts (memory mode)', async () => {
    for (let i = 0; i < 5; i++) {
      await checkLoginRateLimit('blocked@example.com')
    }
    const result = await checkLoginRateLimit('blocked@example.com')
    expect(result.success).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it('normalizes identifier to lowercase', async () => {
    const r1 = await checkLoginRateLimit('User@Example.com')
    await checkLoginRateLimit('user@example.com')
    expect(r1.success).toBe(true)
  })
})
