import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const [jobsRes, deptsRes] = await Promise.allSettled([
      supabaseAdmin
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open'),

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

    return ApiResponse.success({ activeJobs, departments })
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
