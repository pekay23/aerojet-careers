import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

/**
 * Unit tests for the query-builder shim in `lib/db.ts`, specifically the
 * `.or()` PostgREST-style filter. No live database is used: the Neon pool is
 * pre-seeded with a fake client so `pg` and `DATABASE_URL` are never touched,
 * and the generated SQL + bound parameters are asserted directly.
 */

import { createDbClient } from '@/lib/db'

type QueryResult = { rows: unknown[] }

const mockQuery = vi.fn<(_sql: string, _params: unknown[]) => Promise<QueryResult>>()
mockQuery.mockResolvedValue({ rows: [] })

const fakePool = { query: mockQuery, on: vi.fn() }

beforeEach(() => {
  mockQuery.mockClear()
  mockQuery.mockResolvedValue({ rows: [] })
  // Pre-seed the cached pool so `getPool()` returns it without touching `pg` or
  // `DATABASE_URL`. `lib/db.ts` caches the pool in globalThis.__neonPool.
  ;(globalThis as { __neonPool?: typeof fakePool }).__neonPool = fakePool
})

afterEach(() => {
  ;(globalThis as { __neonPool?: typeof fakePool }).__neonPool = undefined
})

async function runOr(raw: string): Promise<[string, unknown[]]> {
  const client = createDbClient()
  await client.from('jobs').select('*').or(raw).then()
  expect(mockQuery).toHaveBeenCalledTimes(1)
  const call = mockQuery.mock.calls[0]
  expect(call).toBeTruthy()
  const sql = call[0] as string
  const params = call[1] as unknown[]
  return [sql, params]
}

describe('lib/db — .or() builder', () => {
  it('ilike still works with a bound parameter', async () => {
    const [sql, params] = await runOr('first_name.ilike.%john%')
    expect(sql).toContain('ILIKE $1')
    expect(params).toEqual(['%john%'])
  })

  it('is.null renders IS NULL with no bound parameter', async () => {
    const [sql, params] = await runOr('closes_at.is.null')
    expect(sql).toContain('IS NULL')
    expect(params).toEqual([])
  })

  it('gte renders >= $n with the value bound as a parameter', async () => {
    const [sql, params] = await runOr('closes_at.gte.2026-01-01')
    expect(sql).toContain('>= $1')
    expect(params).toEqual(['2026-01-01'])
  })

  it('combines is.null and gte with OR and binds only the gte value', async () => {
    const [sql, params] = await runOr('closes_at.is.null,closes_at.gte.2026-01-01')
    expect(sql).toContain('IS NULL')
    expect(sql).toContain('>= $1')
    expect(params).toEqual(['2026-01-01'])
  })

  it('gt / lt / lte render the correct operator', async () => {
    mockQuery.mockClear()
    const [sqlGt] = await runOr('closes_at.gt.2026-01-01')
    expect(sqlGt).toContain('> $1')
    mockQuery.mockClear()
    const [sqlLt] = await runOr('closes_at.lt.2026-01-01')
    expect(sqlLt).toContain('< $1')
    mockQuery.mockClear()
    const [sqlLte] = await runOr('closes_at.lte.2026-01-01')
    expect(sqlLte).toContain('<= $1')
  })

  it('throws for a non-allow-listed column instead of dropping it', async () => {
    const client = createDbClient()
    const res = await client.from('jobs').select('*').or('salary_range_min.gte.1000').then()
    expect(res.data).toBeNull()
    expect(res.error?.message).toContain(
      'column "salary_range_min" is not allow-listed in .or() expression: salary_range_min.gte.1000'
    )
    // Nothing reached the database.
    expect(mockQuery).not.toHaveBeenCalled()
  })

  it('throws for an unsupported operator instead of dropping it', async () => {
    const client = createDbClient()
    const res = await client.from('jobs').select('*').or('title.contains.x').then()
    expect(res.data).toBeNull()
    expect(res.error?.message).toContain(
      'operator "contains" is not supported in .or() expression: title.contains.x'
    )
    expect(mockQuery).not.toHaveBeenCalled()
  })
})
