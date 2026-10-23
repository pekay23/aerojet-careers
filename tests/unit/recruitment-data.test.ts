import { describe, it, expect, vi, beforeEach } from 'vitest'

/**
 * Regression tests for the data-access layer in `lib/recruitment-data.ts`.
 *
 * The critical contract: node-postgres returns TIMESTAMPTZ/DATE columns as JS
 * `Date` objects, but `types/index.ts` declares them as `string`. `unstable_cache`
 * serialises through JSON, so a cached row hands back a *string* while the
 * uncached loader hands back a *Date*. The loaders therefore normalise every
 * date column to an ISO string, which keeps the declared types true and makes
 * the cached and uncached paths return identical shapes.
 *
 * The Supabase-compatible query-builder shim is mocked out; this suite is about
 * the shaping/normalisation contract, not about SQL.
 */

const { TABLES, failingTables, queries } = vi.hoisted(() => {
  const TABLES: Record<string, any[]> = {}
  const failingTables = new Set<string>()
  const queries: { table: string; head: boolean }[] = []
  return { TABLES, failingTables, queries }
})

// `unstable_cache` needs the Next.js server runtime. Stub it with the identity
// function so the loaders can be exercised as plain async functions.
vi.mock('next/cache', () => ({
  unstable_cache: (fn: any) => fn,
}))

vi.mock('@/lib/supabase-admin', () => {
  function makeBuilder(table: string) {
    let head = false
    let maybe = false

    const builder: any = {
      select(_cols?: string, opts?: { count?: string; head?: boolean }) {
        head = Boolean(opts?.head)
        return builder
      },
      eq() {
        return builder
      },
      or() {
        return builder
      },
      order() {
        return builder
      },
      maybeSingle() {
        maybe = true
        return builder
      },
      async then(resolve: any) {
        queries.push({ table, head })

        if (failingTables.has(table)) {
          return resolve({
            data: null,
            error: { message: `boom: ${table}`, code: 'ECONNREFUSED' },
            count: null,
          })
        }

        const rows = TABLES[table] ?? []
        if (head) {
          return resolve({ data: null, error: null, count: rows.length })
        }
        // The real shim's maybeSingle() yields the single row, or `data: null`
        // when nothing matched.
        if (maybe) {
          return resolve({
            data: rows.length ? rows[0] : null,
            error: null,
            count: rows.length,
          })
        }
        return resolve({ data: rows, error: null, count: rows.length })
      },
    }
    return builder
  }

  return {
    supabaseAdmin: {
      from: (table: string) => makeBuilder(table),
    },
  }
})

import {
  isJobExpired,
  loadPublicJobs,
  loadRecruitmentMetadata,
  loadLiveJobBySlug,
  loadRecruitmentStats,
} from '@/lib/recruitment-data'

const CREATED = new Date('2026-08-10T10:58:59.589Z')
const CLOSES = new Date('2026-12-31T00:00:00.000Z')

function jobRow(overrides: Record<string, any> = {}) {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    ref_code: 'ENG-01',
    title: 'Licensed Aircraft Engineer',
    slug: 'licensed-aircraft-engineers',
    department: 'Engineering',
    category: 'experienced_professional',
    employment_type: 'full_time',
    location: 'Accra, Ghana (AIA)',
    status: 'live',
    target_count: 2,
    summary: 'Summary',
    responsibilities: 'Responsibilities',
    requirements: 'Requirements',
    what_we_offer: 'Offer',
    salary_range_min: null,
    salary_range_max: null,
    tags: ['engineering'],
    closes_at: CLOSES,
    published_at: CREATED,
    created_at: CREATED,
    updated_at: CREATED,
    ...overrides,
  }
}

beforeEach(() => {
  for (const key of Object.keys(TABLES)) delete TABLES[key]
  failingTables.clear()
  queries.length = 0

  TABLES.jobs = [jobRow()]
  TABLES.job_categories = [
    { value: 'experienced_professional', label: 'Experienced Professional', is_active: true, created_at: CREATED },
  ]
  TABLES.employment_types = [
    { value: 'full_time', label: 'Full Time', is_active: true, created_at: CREATED },
  ]
  TABLES.departments = [{ name: 'Engineering', code: 'ENG' }]
})

describe('lib/recruitment-data', () => {
  describe('loadPublicJobs', () => {
    it('normalises Date columns to ISO strings', async () => {
      const [job] = await loadPublicJobs()

      expect(job.created_at).toBe('2026-08-10T10:58:59.589Z')
      expect(job.updated_at).toBe('2026-08-10T10:58:59.589Z')
      expect(job.published_at).toBe('2026-08-10T10:58:59.589Z')
      expect(job.closes_at).toBe('2026-12-31T00:00:00.000Z')

      // Nothing may leak a Date object — that is exactly the divergence
      // between the cached and uncached paths that normalisation removes.
      for (const value of Object.values(job)) {
        expect(value).not.toBeInstanceOf(Date)
      }
    })

    it('keeps null date columns null', async () => {
      TABLES.jobs = [jobRow({ closes_at: null, published_at: null })]

      const [job] = await loadPublicJobs()

      expect(job.closes_at).toBeNull()
      expect(job.published_at).toBeNull()
    })

    it('leaves a string date column untouched', async () => {
      TABLES.jobs = [jobRow({ created_at: '2026-08-10T10:58:59.589Z' })]

      const [job] = await loadPublicJobs()

      expect(job.created_at).toBe('2026-08-10T10:58:59.589Z')
    })

    it('throws on a database error instead of returning empty data', async () => {
      failingTables.add('jobs')

      await expect(loadPublicJobs()).rejects.toThrow(/boom: jobs/)
    })

    it('excludes expired jobs (defence-in-depth re-check)', async () => {
      TABLES.jobs = [
        jobRow({ slug: 'live-job', closes_at: new Date('2027-12-31T00:00:00.000Z') }),
        jobRow({ slug: 'expired-job', closes_at: new Date('2025-12-31T00:00:00.000Z') }),
      ]

      const jobs = await loadPublicJobs()

      expect(jobs.map((j) => j.slug)).toEqual(['live-job'])
    })

    it('includes jobs with no deadline', async () => {
      TABLES.jobs = [jobRow({ slug: 'no-deadline', closes_at: null })]

      const jobs = await loadPublicJobs()

      expect(jobs.map((j) => j.slug)).toEqual(['no-deadline'])
    })
  })

  describe('loadRecruitmentMetadata', () => {
    it('normalises the metadata date columns', async () => {
      const meta = await loadRecruitmentMetadata()

      expect(meta.categories[0].created_at).toBe('2026-08-10T10:58:59.589Z')
      expect(meta.employment_types[0].created_at).toBe('2026-08-10T10:58:59.589Z')
      expect(meta.departments).toEqual([{ name: 'Engineering', code: 'ENG' }])
    })

    it('throws when any of the three reads fails', async () => {
      failingTables.add('departments')

      await expect(loadRecruitmentMetadata()).rejects.toThrow(/boom: departments/)
    })
  })

  describe('loadLiveJobBySlug', () => {
    it('normalises dates for a known slug', async () => {
      const job = await loadLiveJobBySlug('licensed-aircraft-engineers')

      expect(job).not.toBeNull()
      expect(job!.created_at).toBe('2026-08-10T10:58:59.589Z')
      expect(job!.closes_at).toBe('2026-12-31T00:00:00.000Z')
    })

    it('returns null for an unknown slug', async () => {
      TABLES.jobs = []

      await expect(loadLiveJobBySlug('does-not-exist')).resolves.toBeNull()
    })

    it('throws on a database error', async () => {
      failingTables.add('jobs')

      await expect(loadLiveJobBySlug('licensed-aircraft-engineers')).rejects.toThrow(/boom: jobs/)
    })

    it('returns null for an expired slug', async () => {
      TABLES.jobs = [jobRow({ slug: 'expired-job', closes_at: new Date('2025-12-31T00:00:00.000Z') })]

      await expect(loadLiveJobBySlug('expired-job')).resolves.toBeNull()
    })
  })

  describe('loadRecruitmentStats', () => {
    it('counts the live jobs and the departments', async () => {
      TABLES.jobs = [jobRow(), jobRow({ id: '2' })]

      await expect(loadRecruitmentStats()).resolves.toEqual({
        activeJobs: 2,
        departments: 1,
      })
    })

    it('degrades a failing counter to zero without throwing', async () => {
      failingTables.add('jobs')

      await expect(loadRecruitmentStats()).resolves.toEqual({
        activeJobs: 0,
        departments: 1,
      })
    })

    it('reads the counters with head: true so no rows are transferred', async () => {
      await loadRecruitmentStats()

      const jobQuery = queries.find((q) => q.table === 'jobs')
      expect(jobQuery?.head).toBe(true)
    })
  })

  describe('isJobExpired', () => {
    const today = new Date().toISOString().slice(0, 10)

    it('null closes_at is not expired', () => {
      expect(isJobExpired(null)).toBe(false)
    })

    it('undefined closes_at is not expired', () => {
      expect(isJobExpired(undefined)).toBe(false)
    })

    it('empty string closes_at is not expired (fail open)', () => {
      expect(isJobExpired('')).toBe(false)
    })

    it('malformed string closes_at is not expired (fail open)', () => {
      expect(isJobExpired('not-a-date')).toBe(false)
    })

    it('a future date is not expired', () => {
      expect(isJobExpired('2027-12-31')).toBe(false)
    })

    it('today is not expired (a job closing today is still open)', () => {
      expect(isJobExpired(today, new Date())).toBe(false)
    })

    it('a past date is expired', () => {
      expect(isJobExpired('2025-12-31')).toBe(true)
    })

    it('uses the provided `now` for the UTC calendar comparison', () => {
      // A date that is in the past relative to 2026-01-01 but in the future
      // relative to today.
      expect(isJobExpired('2025-06-01', new Date('2026-01-01T00:00:00Z'))).toBe(true)
      expect(isJobExpired('2025-12-31', new Date('2025-12-31T00:00:00Z'))).toBe(false)
    })
  })
})
