import { unstable_cache } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { isJobExpired, todayUtc } from '@/lib/dates'
import type { Job } from '@/types'

/**
 * Data-access layer for the public recruitment reads.
 *
 * Every read comes in two flavours:
 *   - `loadX()` — always hits the database. Used by admin routes that need
 *                  fresh rows (the job form, the departments editor).
 *   - `getX()`  — the same read wrapped in `unstable_cache`. Used by the
 *                  public pages and the public metadata endpoint.
 *
 * Both flavours return the exact same runtime shape. That is not automatic:
 * `unstable_cache` serialises its result through JSON, so a cached row would
 * hand back a *string* for every date column while the uncached loader hands
 * back a `Date`. The loaders therefore normalise every date column to an ISO
 * string before the value can reach the cache, which keeps the declared
 * `Job` types true at runtime and makes the cached and uncached paths
 * byte-identical.
 */

export const JOBS_CACHE_TAG = 'jobs'
export const JOB_DETAIL_CACHE_TAG = 'job-detail'
export const METADATA_CACHE_TAG = 'recruitment-metadata'
export const STATS_CACHE_TAG = 'recruitment-stats'

/** The 21 columns the public job reads have always selected. */
const JOB_COLUMNS =
  'id, ref_code, title, slug, department, category, employment_type, location, status, target_count, summary, responsibilities, requirements, what_we_offer, salary_range_min, salary_range_max, tags, closes_at, published_at, created_at, updated_at'

const METADATA_VALUE_COLUMNS = 'value, label, is_active, created_at'

const DEPARTMENT_COLUMNS = 'name, code'

/** A value that may arrive as a `Date` (node-postgres) or as a string. */
type DateLike = string | Date | null | undefined

export interface RecruitmentMetadataValue {
  value: string
  label: string
  is_active: boolean
  created_at: string
}

export interface RecruitmentDepartment {
  name: string
  code: string | null
}

export interface RecruitmentMetadata {
  categories: RecruitmentMetadataValue[]
  employment_types: RecruitmentMetadataValue[]
  departments: RecruitmentDepartment[]
}

/** The counters rendered on the homepage. */
export interface RecruitmentStats {
  activeJobs: number
  departments: number
}

/** A `jobs` row as it comes back from the driver, before normalisation. */
interface JobRow extends Omit<Job, 'closes_at' | 'published_at' | 'created_at' | 'updated_at'> {
  closes_at: DateLike
  published_at: DateLike
  created_at: DateLike
  updated_at: DateLike
}

/** A `job_categories` / `employment_types` row, before normalisation. */
interface MetadataValueRow {
  value: string
  label: string
  is_active: boolean
  created_at: DateLike
}

/** A `departments` row, before normalisation. */
interface DepartmentRow {
  name: string
  code: string | null
}

/**
 * The query shim swallows driver failures into an `error` field. Turn that
 * into a thrown Error so callers' try/catch blocks actually fire instead of
 * silently receiving empty data.
 */
function toDbError(error: unknown): Error {
  if (error instanceof Error) return error
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string' &&
    error.message
  ) {
    return new Error(error.message)
  }
  return new Error('Recruitment data query failed')
}

/** `Date` → ISO string. `null` stays `null`, an existing string is untouched. */
function toIsoString(value: DateLike): string | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  return value
}

/**
 * Is a job expired? A job is expired when `closes_at` is non-null and strictly
 * before today (UTC calendar date). A job closing today is still open.
 * Malformed/empty input fails open (not expired) so a bad row is never silently
 * hidden.
 *
 * Implemented in `lib/dates.ts` (client-safe) and re-exported here so server
 * callers can keep importing it from the data layer. Do NOT import
 * `lib/recruitment-data.ts` from a Client Component — it pulls `pg` and
 * `next/headers` into the browser bundle and breaks the build.
 */
export { isJobExpired } from '@/lib/dates'

function normaliseJob(row: JobRow): Job {
  return {
    ...row,
    closes_at: toIsoString(row.closes_at),
    published_at: toIsoString(row.published_at),
    // `created_at` / `updated_at` are NOT NULL in the database, so the empty
    // string is only a defensive fallback for a malformed row.
    created_at: toIsoString(row.created_at) ?? '',
    updated_at: toIsoString(row.updated_at) ?? '',
  }
}

function normaliseMetadataValues(rows: MetadataValueRow[]): RecruitmentMetadataValue[] {
  return rows.map((row) => ({
    value: row.value,
    label: row.label,
    is_active: row.is_active,
    created_at: toIsoString(row.created_at) ?? '',
  }))
}

function normaliseDepartments(rows: DepartmentRow[]): RecruitmentDepartment[] {
  return rows.map((row) => ({
    name: row.name,
    code: row.code ?? null,
  }))
}

/**
 * All live jobs, newest first. Uncached.
 */
export async function loadPublicJobs(): Promise<Job[]> {
  const today = todayUtc()
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select(JOB_COLUMNS)
    .eq('status', 'live')
    .or(`closes_at.is.null,closes_at.gte.${today}`)
    .order('created_at', { ascending: false })

  if (error) throw toDbError(error)

  const rows: JobRow[] = data ?? []
  // Defence in depth: the SQL filter is the source of truth, but re-check in
  // JavaScript so an expired row can never leak through a driver quirk.
  return rows
    .filter((row) => !isJobExpired(toIsoString(row.closes_at)))
    .map(normaliseJob)
}

/**
 * Departments, job categories and employment types. Uncached.
 */
export async function loadRecruitmentMetadata(): Promise<RecruitmentMetadata> {
  const [categories, empTypes, departments] = await Promise.all([
    supabaseAdmin
      .from('job_categories')
      .select(METADATA_VALUE_COLUMNS)
      .eq('is_active', true)
      .order('label'),
    supabaseAdmin
      .from('employment_types')
      .select(METADATA_VALUE_COLUMNS)
      .eq('is_active', true)
      .order('label'),
    supabaseAdmin.from('departments').select(DEPARTMENT_COLUMNS).order('name'),
  ])

  if (categories.error) throw toDbError(categories.error)
  if (empTypes.error) throw toDbError(empTypes.error)
  if (departments.error) throw toDbError(departments.error)

  return {
    categories: normaliseMetadataValues(categories.data ?? []),
    employment_types: normaliseMetadataValues(empTypes.data ?? []),
    departments: normaliseDepartments(departments.data ?? []),
  }
}

/**
 * A single live job by slug. Uncached. Returns `null` when the slug does not
 * match a live job (a draft job is invisible here).
 */
export async function loadLiveJobBySlug(slug: string): Promise<Job | null> {
  const today = todayUtc()
  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select(JOB_COLUMNS)
    .eq('slug', slug)
    .eq('status', 'live')
    .or(`closes_at.is.null,closes_at.gte.${today}`)
    .maybeSingle()

  if (error) throw toDbError(error)
  if (!data) return null

  const row: JobRow = data
  // Defence in depth: an expired slug must 404 even if the driver lets it
  // through (the SQL filter is the source of truth).
  if (isJobExpired(toIsoString(row.closes_at))) return null
  return normaliseJob(row)
}

/**
 * The homepage counters: how many jobs are live and how many departments
 * exist. Uncached.
 *
 * Both counters are read with `head: true`, so the database only returns the
 * count and never the rows. A failing counter degrades to `0` instead of
 * throwing — the endpoint this feeds has always swallowed database errors
 * this way, and a single unreachable count must not take the other one down
 * with it.
 */
export async function loadRecruitmentStats(): Promise<RecruitmentStats> {
  const today = todayUtc()
  const [jobsRes, deptsRes] = await Promise.allSettled([
    supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'live')
      .or(`closes_at.is.null,closes_at.gte.${today}`),

    supabaseAdmin
      .from('departments')
      .select('id', { count: 'exact', head: true }),
  ])

  const activeJobs = jobsRes.status === 'fulfilled' && !jobsRes.value.error
    ? jobsRes.value.count || 0
    : 0
  const departments = deptsRes.status === 'fulfilled' && !deptsRes.value.error
    ? deptsRes.value.count || 0
    : 0

  return { activeJobs, departments }
}

/**
 * Cached public reads.
 *
 * `unstable_cache` is a higher-order function evaluated at import time, so
 * these wrappers are created once at module scope — never inside a request
 * handler. Arguments are part of the cache key, so each slug is cached
 * separately.
 */
export const getPublicJobs = unstable_cache(
  async () => loadPublicJobs(),
  ['public-jobs'],
  { revalidate: 60, tags: [JOBS_CACHE_TAG] }
)

export const getRecruitmentMetadata = unstable_cache(
  async () => loadRecruitmentMetadata(),
  ['recruitment-metadata'],
  { revalidate: 300, tags: [METADATA_CACHE_TAG] }
)

export const getLiveJobBySlug = unstable_cache(
  (slug: string) => loadLiveJobBySlug(slug),
  ['live-job-by-slug'],
  // 60s, not 300s: the expiry filter lives inside this query, so a longer
  // window would keep serving a role whose closing date has passed.
  { revalidate: 60, tags: [JOB_DETAIL_CACHE_TAG] }
)

export const getRecruitmentStats: () => Promise<RecruitmentStats> = unstable_cache(
  async () => loadRecruitmentStats(),
  ['recruitment-stats'],
  { revalidate: 300, tags: [STATS_CACHE_TAG] }
)
