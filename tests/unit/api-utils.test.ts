import { describe, it, expect, vi } from 'vitest'
import { validateOrigin, sanitizeErrorMessage, sanitizeSearch, cleanInput, sanitizeJobUpdate, validatePathTraversal } from '@/lib/api-utils'
import { NextRequest } from 'next/server'

vi.mock('@/lib/rate-limit', () => ({
  checkPublicRateLimit: vi.fn().mockResolvedValue({ success: false }),
}))

describe('validateOrigin', () => {
  it('returns false when no host header', () => {
    const req = { headers: new Headers() } as unknown as NextRequest
    expect(validateOrigin(req)).toBe(false)
  })

  it('returns true when origin matches app origin', () => {
    const req = {
      headers: new Headers({ origin: 'https://careers.aerojet-aviation.com', host: 'careers.aerojet-aviation.com' }),
    } as unknown as NextRequest
    expect(validateOrigin(req)).toBe(true)
  })

  it('returns false when origin does not match in production', () => {
    const req = {
      headers: new Headers({ origin: 'https://evil.com', host: 'careers.aerojet-aviation.com' }),
    } as unknown as NextRequest
    expect(validateOrigin(req)).toBe(false)
  })

  it('returns true when referer starts with app origin', () => {
    const req = {
      headers: new Headers({ referer: 'https://careers.aerojet-aviation.com/jobs', host: 'careers.aerojet-aviation.com' }),
    } as unknown as NextRequest
    expect(validateOrigin(req)).toBe(true)
  })

  it('returns false when referer is from a different origin in production', () => {
    const req = {
      headers: new Headers({ referer: 'https://evil.com/attack', host: 'careers.aerojet-aviation.com' }),
    } as unknown as NextRequest
    expect(validateOrigin(req)).toBe(false)
  })

  it('allows same hostname origin in development', () => {
    const req = {
      headers: new Headers({ origin: 'http://192.168.8.202:3001', host: '192.168.8.202:3001' }),
    } as unknown as NextRequest
    expect(validateOrigin(req)).toBe(true)
  })

  it('allows same hostname referer in development', () => {
    const req = {
      headers: new Headers({ referer: 'http://192.168.8.202:3001/apply/test', host: '192.168.8.202:3001' }),
    } as unknown as NextRequest
    expect(validateOrigin(req)).toBe(true)
  })
})

describe('sanitizeErrorMessage', () => {
  it('returns the error message for Error instances', () => {
    const result = sanitizeErrorMessage(new Error('secret details'))
    expect(result).toBe('secret details')
  })

  it('returns the message for non-Error values', () => {
    const result = sanitizeErrorMessage('some string error')
    expect(result).toBe('some string error')
  })
})

describe('sanitizeSearch', () => {
  it('strips special PostgREST characters', () => {
    expect(sanitizeSearch('hello%world')).toBe('helloworld')
    expect(sanitizeSearch('a_b')).toBe('ab')
    expect(sanitizeSearch('(paren)')).toBe('paren')
  })

  it('trims whitespace', () => {
    expect(sanitizeSearch('  hello  ')).toBe('hello')
  })
})

describe('cleanInput', () => {
  it('trims string inputs', () => {
    expect(cleanInput('  hello  ')).toBe('hello')
  })

  it('passes through non-strings unchanged', () => {
    expect(cleanInput(42)).toBe(42)
    expect(cleanInput(null)).toBeNull()
    expect(cleanInput(undefined)).toBeUndefined()
  })
})

describe('withPublicProtection', () => {
  it('blocks when rate limit is exceeded', async () => {
    vi.doMock('@/lib/rate-limit', () => ({
      checkPublicRateLimit: vi.fn().mockResolvedValue({ success: false }),
    }))

    const { withPublicProtection: wp } = await import('@/lib/api-utils')
    const req = { headers: new Headers({ host: 'example.com' }) } as unknown as NextRequest
    const result = await wp(req, 'test-action')
    expect(result.blocked).toBe(true)
    expect((result as any).response.status).toBe(429)
  })
})

describe('sanitizeJobUpdate', () => {
  it('strips disallowed keys from a job update payload', () => {
    const raw = { title: 'Updated', status: 'open', created_by: 'evil', id: 'should-not-be-here' }
    const safe = sanitizeJobUpdate(raw)
    expect(safe).toHaveProperty('title', 'Updated')
    expect(safe).toHaveProperty('status', 'open')
    expect(safe).not.toHaveProperty('created_by')
    expect(safe).not.toHaveProperty('id')
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
