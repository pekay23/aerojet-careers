import { NextRequest } from 'next/server'
import { getRecruitmentStats } from '@/lib/recruitment-data'
import { ApiResponse, sanitizeErrorMessage } from '@/lib/api-utils'

export async function GET(_req: NextRequest) {
  try {
    const { activeJobs, departments } = await getRecruitmentStats()

    // The counters are cached, so the CDN can serve most requests without
    // waking the function at all. The window is deliberately short: the CDN
    // copy is keyed by URL and cannot be purged by `revalidateTag`.
    return ApiResponse.success(
      { activeJobs, departments },
      200,
      { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60' }
    )
  } catch (err) {
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}
