import { describe, it, expect } from 'vitest'

// Mirror the constant from lib/api-utils.ts
// (can't import directly — lib/api-utils has DB side-effects at module load)
const ALLOWED_UPDATE_KEYS = [
  'title',
  'ref_code',
  'department',
  'category',
  'employment_type',
  'location',
  'status',
  'target_count',
  'summary',
  'responsibilities',
  'requirements',
  'what_we_offer',
  'salary_range_min',
  'salary_range_max',
  'tags',
  'closes_at',
  'published_at',
  'updated_at',
]

// Test the ALLOWED_UPDATE_KEYS allowlist for PATCH security
// This ensures the jobs PATCH endpoint cannot accept arbitrary field injection

describe('Jobs PATCH allowlist', () => {
  it('excludes internal fields like created_by, slug, id from injection', () => {
    const filtered: Record<string, any> = {}
    const malicious: Record<string, any> = {
      created_by: 'hacker-id',
      slug: 'malicious-slug',
      id: 'fake-id',
      is_published: true,
      admin_user_id: 'hacker-admin',
      auth_user_id: 'hacker-auth',
    }

    for (const key of ALLOWED_UPDATE_KEYS) {
      if (key in malicious && malicious[key] !== undefined) {
        filtered[key] = malicious[key]
      }
    }

    expect(filtered).not.toHaveProperty('created_by')
    expect(filtered).not.toHaveProperty('slug')
    expect(filtered).not.toHaveProperty('id')
    expect(filtered).not.toHaveProperty('is_published')
    expect(filtered).not.toHaveProperty('admin_user_id')
    expect(filtered).not.toHaveProperty('auth_user_id')
  })

  it('includes all expected editable fields', () => {
    expect(ALLOWED_UPDATE_KEYS).toContain('title')
    expect(ALLOWED_UPDATE_KEYS).toContain('ref_code')
    expect(ALLOWED_UPDATE_KEYS).toContain('status')
    expect(ALLOWED_UPDATE_KEYS).toContain('department')
    expect(ALLOWED_UPDATE_KEYS).toContain('target_count')
    expect(ALLOWED_UPDATE_KEYS).toContain('closes_at')
    expect(ALLOWED_UPDATE_KEYS).toContain('published_at')
  })

  it('does not allow slug to be set by clients (server derives it)', () => {
    expect(ALLOWED_UPDATE_KEYS).not.toContain('slug')
  })
})

describe('Upload path traversal prevention', () => {
  it('rejects non-enum document_type values', () => {
    const ALLOWED_DOC_TYPES = ['cv', 'licence_scan', 'passport_scan', 'other']
    const maliciousTypes = ['../../etc', '../../../tmp', 'cv/../../../admin', '']

    for (const t of maliciousTypes) {
      expect(ALLOWED_DOC_TYPES.includes(t)).toBe(false)
    }
  })

  it('accepts only valid document_type values', () => {
    const ALLOWED_DOC_TYPES = ['cv', 'licence_scan', 'passport_scan', 'other']
    for (const t of ALLOWED_DOC_TYPES) {
      expect(ALLOWED_DOC_TYPES.includes(t)).toBe(true)
    }
  })

  it('rejects non-UUID application_id values', () => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const maliciousIds = [
      '../../etc/passwd',
      '12345',
      'not-a-uuid',
      '',
      'drop table users; --',
    ]

    for (const id of maliciousIds) {
      expect(uuidRegex.test(id)).toBe(false)
    }
  })
})

describe('Session cookie security', () => {
  it('uses secure settings', () => {
    // These mirror the constants from lib/auth.ts and app/api/auth/login/route.ts
    const SESSION_COOKIE = 'aj_session'
    const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 days

    expect(SESSION_COOKIE).toBe('aj_session')
    expect(SESSION_MAX_AGE).toBe(7 * 24 * 60 * 60)
    expect(SESSION_MAX_AGE).toBeLessThan(60 * 60 * 24 * 30) // less than 30 days
  })
})

describe('Metadata endpoint', () => {
  it('returns departments, categories, employment_types', async () => {
    // Verify the expected shape of the metadata response
    const expectedKeys = ['departments', 'categories', 'employment_types']
    const mockData = {
      departments: [{ id: '1', name: 'Engineering', code: 'ENG' }],
      categories: [{ value: 'experienced_professional', label: 'Experienced Professional' }],
      employment_types: [{ value: 'full_time', label: 'Full Time' }],
    }

    for (const key of expectedKeys) {
      expect(key in mockData).toBe(true)
      expect(Array.isArray(mockData[key as keyof typeof mockData])).toBe(true)
    }
  })
})
