import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole, sanitizeErrorMessage } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const fetchCount = async (table: string, filter?: { col: string; val: any }) => {
      try {
        let q = supabaseAdmin.from(table).select('*', { count: 'exact', head: true })
        if (filter) q = q.eq(filter.col, filter.val)
        
        // Exclude soft-deleted applications
        if (table === 'applications') {
          q = q.is('deleted_at', null)
        }

        const { count, error } = await q
        if (error) throw error
        return count || 0
      } catch (e) {
        console.error(`Count failed for ${table}:`, e)
        return 0
      }
    }

    const [
      activeJobs,
      totalJobs,
      totalCandidates,
      talentPoolCount,
      newApplications,
      hiredCount
    ] = await Promise.all([
       fetchCount('jobs', { col: 'status', val: 'live' }),
      fetchCount('jobs'),
      fetchCount('applications'),
      fetchCount('talent_pool'),
      fetchCount('applications', { col: 'status', val: 'new' }),
      fetchCount('applications', { col: 'status', val: 'hired' })
    ])

    return ApiResponse.success({
      activeJobs,
      totalJobs,
      totalCandidates,
      talentPoolCount,
      newApplications,
      hiredCount
    })
  } catch (err) {
    console.error('Stats route critical error:', err)
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}
