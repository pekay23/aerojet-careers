import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

describe('db pool caching', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetModules()
    // Ensure DATABASE_URL exists for tests (setup.ts also sets it)
    process.env.DATABASE_URL = originalEnv.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
  })

  afterEach(() => {
    process.env = { ...originalEnv }
    // Clean up global pool
    delete (globalThis as any).__neonPool
    vi.resetModules()
  })

  it('reuses global pool across module re-evaluations (does not recreate)', async () => {
    // First import
    const mod1 = await import('@/lib/db')
    // Force lazy init by touching a property that doesn't open connection
    const pool1: any = (mod1 as any).pool
    // Access options if exists, else just access a property
    if (pool1.options) {
      // accessing options is fine
      void pool1.options
    } else {
      // fallback
      void pool1
    }
    const globalPool1 = (globalThis as any).__neonPool
    expect(globalPool1).toBeDefined()

    // Reset modules and re-import
    vi.resetModules()
    const mod2 = await import('@/lib/db')
    const pool2: any = (mod2 as any).pool
    if (pool2.options) {
      void pool2.options
    } else {
      void pool2
    }
    const globalPool2 = (globalThis as any).__neonPool
    expect(globalPool2).toBeDefined()
    // Must be the same instance
    expect(globalPool2).toBe(globalPool1)
  })

  it('does not throw on import when DATABASE_URL missing; throws only when used', async () => {
    // Remove all DB env vars
    delete process.env.DATABASE_URL
    delete process.env.NEON_DATABASE_URL
    delete process.env.POSTGRES_URL
    vi.resetModules()
    // Import should not throw
    const mod = await import('@/lib/db')
    expect(mod).toBeDefined()
    // Using should throw
    const pool: any = (mod as any).pool
    expect(() => {
      // Accessing something that triggers getPool via proxy - accessing options may trigger getPool
      // getPool is called on first property access
      void pool.options
    }).toThrow()
  })
})
