import { getRecruitmentMetadata } from '@/lib/recruitment-data'
import { ApiResponse } from '@/lib/api-utils'

/**
 * Public metadata endpoint for recruitment data (departments, categories, employment types).
 * This is intentionally outside /api/admin/ so it is NOT behind the auth middleware.
 */
export async function GET() {
  try {
    const { categories, employment_types, departments } = await getRecruitmentMetadata()

    return ApiResponse.success({
      categories,
      employment_types,
      departments,
    }, 200, {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=60',
    })
  } catch (err) {
    // This endpoint is public, so the raw driver error (database host, port,
    // role name) must never reach an anonymous visitor.
    console.error('[api/metadata] recruitment metadata unavailable', err)
    return ApiResponse.error('Recruitment metadata is temporarily unavailable', 503)
  }
}
