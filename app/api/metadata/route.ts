import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, sanitizeErrorMessage } from '@/lib/api-utils'
import { NextResponse } from 'next/server'

/**
 * Public metadata endpoint for recruitment data (departments, categories, employment types).
 * This is intentionally outside /api/admin/ so it is NOT behind the auth middleware.
 */
export async function GET() {
  try {
    const [categories, empTypes, departments] = await Promise.all([
      supabaseAdmin.from('job_categories').select('value, label, is_active, created_at').eq('is_active', true).order('label'),
      supabaseAdmin.from('employment_types').select('value, label, is_active, created_at').eq('is_active', true).order('label'),
      supabaseAdmin.from('departments').select('name, code').order('name')
    ])

    return NextResponse.json({
      categories: categories.data || [],
      employment_types: empTypes.data || [],
      departments: departments.data || []
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
      }
    })
  } catch (err) {
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}
