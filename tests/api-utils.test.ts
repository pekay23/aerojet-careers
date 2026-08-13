import { describe, it, expect, beforeEach, vi } from 'vitest'
import { verifyRole } from '@/lib/api-utils'
import { ALLOWED_UPDATE_KEYS, sanitizeJobUpdate, validatePathTraversal } from '@/lib/api-utils'

vi.mock('@/lib/supabase-server', () => ({
  createSupabaseServer: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'auth-1', email: 'admin@aerojet.com' } } }) },
  })),
}))
vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { id: 'admin-1', role: 'super_admin' },
      }),
    })),
  },
}))

describe('verifyRole', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns user, role, and adminUserId for a valid super_admin token', async () => {
    const result = await verifyRole(null)
    expect(result).not.toBeNull()
    if (result) {
      expect(result.role).toBe('super_admin')
      expect(result.adminUserId).toBe('admin-1')
    }
  })

  it('throws for a missing token', async () => {
    vi.doMock('@/lib/supabase-server', () => ({
      createSupabaseServer: vi.fn(() => ({
        auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null } }) },
      })),
    }))

    await expect(verifyRole(null)).rejects.toThrow('Unauthorized')
  })
})

describe('sanitizeJobUpdate', () => {
  it('strips disallowed keys from a job update payload', () => {
    const raw = { title: 'Updated', status: 'live', created_by: 'evil', ref_code: 'HACK' }
    const safe = sanitizeJobUpdate(raw)
    expect(safe).toHaveProperty('title', 'Updated')
    expect(safe).toHaveProperty('status', 'live')
    expect(safe).not.toHaveProperty('created_by')
    expect(safe).not.toHaveProperty('ref_code')
  })

  it('returns empty object when all keys are disallowed', () => {
    const raw = { created_by: 'x', id: 'y', application_id: 'z' }
    const safe = sanitizeJobUpdate(raw)
    expect(Object.keys(safe)).toHaveLength(0)
  })
})

describe('validatePathTraversal', () => {
  it('blocks ../ sequences in docType', () => {
    const result = validatePathTraversal('../../etc/passwd', '123')
    expect(result).toBe('Invalid document type')
  })

  it('blocks non-UUID application ids', () => {
    const result = validatePathTraversal('cv', 'not-a-uuid')
    expect(result).toBe('Invalid application ID')
  })

  it('allows valid docType and UUID', () => {
    const result = validatePathTraversal('cv', '550e8400-e29b-41d4-a716-446655440000')
    expect(result).toBeNull()
  })
})

describe('ALLOWED_UPDATE_KEYS', () => {
  it('includes all fields an admin should be able to edit', () => {
    expect(ALLOWED_UPDATE_KEYS).toContain('title')
    expect(ALLOWED_UPDATE_KEYS).toContain('status')
    expect(ALLOWED_UPDATE_KEYS).toContain('department')
    expect(ALLOWED_UPDATE_KEYS).toContain('target_count')
    expect(ALLOWED_UPDATE_KEYS).toContain('closes_at')
    expect(ALLOWED_UPDATE_KEYS).toContain('published_at')
    expect(ALLOWED_UPDATE_KEYS).toContain('indefinite_deadline')
    expect(ALLOWED_UPDATE_KEYS).toContain('open_positions')
  })

  it('does NOT include created_by or id', () => {
    expect(ALLOWED_UPDATE_KEYS).not.toContain('created_by')
    expect(ALLOWED_UPDATE_KEYS).not.toContain('id')
  })
})
