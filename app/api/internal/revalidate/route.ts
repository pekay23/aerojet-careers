import 'server-only'
import { timingSafeEqual } from 'node:crypto'
import { revalidatePath, revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'
import {
  JOBS_CACHE_TAG,
  JOB_DETAIL_CACHE_TAG,
  METADATA_CACHE_TAG,
  STATS_CACHE_TAG,
} from '@/lib/recruitment-data'

/**
 * Internal cache-invalidation endpoint.
 *
 * `scripts/apply-schema.mjs` applies `db/neon-schema.sql`, which mutates the
 * very tables the public pages cache (`jobs`, `departments`, `job_categories`,
 * `employment_types`). Without a purge the site keeps serving pre-migration
 * rows for up to 300 s (the longest `unstable_cache` TTL in the app).
 *
 * The endpoint is guarded by a shared secret:
 *   - `REVALIDATE_SECRET` unset  -> 404, so the route is invisible when it
 *     has not been configured.
 *   - wrong or missing header     -> 403.
 *   - correct header              -> purge every public cache and report what
 *     was purged.
 *
 * `import 'server-only'` makes the module throw at build time if it is ever
 * pulled into a Client Component.
 */

export const dynamic = 'force-dynamic'
export const revalidate = 0

const INVALIDATED_TAGS = [
  JOBS_CACHE_TAG,
  JOB_DETAIL_CACHE_TAG,
  METADATA_CACHE_TAG,
  STATS_CACHE_TAG,
] as const

const INVALIDATED_PATHS = ['/', '/jobs', '/api/metadata', '/api/stats'] as const

/**
 * Dynamic route patterns. `revalidatePath` needs the explicit `'page'` type for
 * a dynamic segment, and the job detail pages have to be included: the Full
 * Route Cache for `/apply/<slug>` is keyed by path, so purging the data cache
 * alone leaves the rendered (and possibly expired) page in place.
 */
const INVALIDATED_DYNAMIC_PATHS = ['/apply/[slug]'] as const

/**
 * Constant-time string comparison. `timingSafeEqual` throws on buffers of
 * different lengths, so the length is checked first — a length mismatch is
 * still a mismatch, and returning early leaks only the length, not the
 * secret.
 */
function secretsMatch(expected: string, provided: string): boolean {
  const expectedBytes = Buffer.from(expected, 'utf8')
  const providedBytes = Buffer.from(provided, 'utf8')
  if (expectedBytes.length !== providedBytes.length) return false
  return timingSafeEqual(expectedBytes, providedBytes)
}

export async function POST(req: NextRequest) {
  const secret = process.env.REVALIDATE_SECRET

  // Fail closed: without a configured secret the route must not exist.
  if (!secret) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const provided = req.headers.get('x-revalidate-secret')
  if (!provided || !secretsMatch(secret, provided)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  for (const tag of INVALIDATED_TAGS) {
    revalidateTag(tag, { expire: 0 })
  }
  for (const path of INVALIDATED_PATHS) {
    revalidatePath(path)
  }
  for (const path of INVALIDATED_DYNAMIC_PATHS) {
    revalidatePath(path, 'page')
  }

  return NextResponse.json({
    success: true,
    invalidated: {
      tags: [...INVALIDATED_TAGS],
      paths: [...INVALIDATED_PATHS, ...INVALIDATED_DYNAMIC_PATHS],
    },
  })
}
