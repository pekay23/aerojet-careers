/**
 * Single date-formatting helper used everywhere a closing date is rendered.
 *
 * `closes_at` is a Postgres `DATE` and the business calendar is UTC (Accra,
 * Ghana = UTC+0, DB session timezone GMT), so every format here uses
 * `timeZone: 'UTC'`. Formatting without a timeZone lets the server and the
 * browser disagree, which caused an off-by-one date and a React hydration
 * mismatch for visitors west of UTC.
 */
export function formatCloseDate(closesAt: string | null | undefined): string {
  if (!closesAt) return ''
  const d = new Date(closesAt)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Today's UTC calendar date as `YYYY-MM-DD` (the business calendar). */
export function todayUtc(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Is a job expired? A job is expired when `closes_at` is non-null and strictly
 * before today (UTC calendar date). A job closing today is still open.
 * Malformed/empty input fails open (not expired) so a bad row is never
 * silently hidden.
 *
 * This lives in a client-safe module on purpose: the admin jobs table is a
 * Client Component and needs the same expiry rule, and importing it from
 * `lib/recruitment-data.ts` would drag `pg` and `next/headers` into the
 * browser bundle and break the build.
 */
export function isJobExpired(
  closesAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (closesAt === null || closesAt === undefined || closesAt === '') return false
  const closes = new Date(closesAt)
  if (Number.isNaN(closes.getTime())) return false
  const today = new Date(now.toISOString().slice(0, 10))
  return closes < today
}
