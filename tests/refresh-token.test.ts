import { describe, it, expect, beforeEach, vi } from 'vitest'
import { consumeRefreshToken, issueRefreshToken, revokeRefreshToken } from '@/lib/refresh-token'

vi.mock('@/lib/db', () => ({
  pool: {
    query: vi.fn(),
  },
}))

describe('refresh-token', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  describe('issueRefreshToken', () => {
    it('creates a token and stores it with a future expiry', async () => {
      const { pool } = require('@/lib/db')
      pool.query.mockResolvedValue({ rows: [] })

      const token = await issueRefreshToken('auth-1')
      expect(typeof token).toBe('string')
      expect(token.length).toBe(64)

      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO refresh_tokens'),
        [token, 'auth-1', expect.any(Date)]
      )
    })

    it('sets expiry ~30 days ahead', async () => {
      const { pool } = require('@/lib/db')
      pool.query.mockResolvedValue({ rows: [] })

      const before = new Date()
      await issueRefreshToken('auth-1')
      const after = new Date()

      const queryCall = pool.query.mock.calls[0]
      const expiresAt = queryCall[1][2]

      expect(expiresAt.getTime()).toBeGreaterThan(before.getTime() + 29 * 24 * 60 * 60 * 1000)
      expect(expiresAt.getTime()).toBeLessThan(after.getTime() + 31 * 24 * 60 * 60 * 1000)
    })
  })

  describe('consumeRefreshToken', () => {
    it('returns error for unknown token', async () => {
      const { pool } = require('@/lib/db')
      pool.query.mockResolvedValueOnce({ rows: [] })

      const { user, error } = await consumeRefreshToken('unknown-token')
      expect(error).toBe('Invalid refresh token')
      expect(user).toBeNull()
    })

    it('returns error for expired token', async () => {
      const { pool } = require('@/lib/db')
      const past = new Date(Date.now() - 1000)
      pool.query.mockResolvedValueOnce({
        rows: [{
          token: 'expired',
          auth_user_id: 'auth-1',
          expires_at: past.toISOString(),
          id: 'auth-1',
          email: 'user@example.com',
          user_metadata: {},
        }],
      })

      const { user, error } = await consumeRefreshToken('expired')
      expect(error).toBe('Refresh token expired')
      expect(user).toBeNull()
    })

    it('returns user and deletes token on success', async () => {
      const { pool } = require('@/lib/db')
      const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      pool.query
        .mockResolvedValueOnce({
          rows: [{
            token: 'valid',
            auth_user_id: 'auth-1',
            expires_at: future.toISOString(),
            id: 'auth-1',
            email: 'user@example.com',
            user_metadata: { role: 'admin' },
          }],
        })
        .mockResolvedValueOnce({ rows: [] })

      const { user, error } = await consumeRefreshToken('valid')
      expect(error).toBeNull()
      expect(user).toMatchObject({ id: 'auth-1', email: 'user@example.com' })
    })
  })

  describe('revokeRefreshToken', () => {
    it('deletes the token from the database', async () => {
      const { pool } = require('@/lib/db')
      pool.query.mockResolvedValue({ rowCount: 1 })

      await revokeRefreshToken('some-token')
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM refresh_tokens WHERE token = $1',
        ['some-token']
      )
    })
  })
})
