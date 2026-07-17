import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse } from '@/lib/api-utils'

/**
 * Public metadata endpoint for recruitment data (departments, categories, employment types).
 * This is intentionally outside /api/admin/ so it is NOT behind the auth middleware.
 */
export async function GET() {
  try {
    const [categories, empTypes, departments] = await Promise.all([
      supabaseAdmin.from('job_categories').select('*').eq('is_active', true).order('label'),
      supabaseAdmin.from('employment_types').select('*').eq('is_active', true).order('label'),
      supabaseAdmin.from('departments').select('name, code').order('name')
    ])

    return ApiResponse.success({
      categories: categories.data || [],
      employment_types: empTypes.data || [],
      departments: departments.data || []
    })
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
