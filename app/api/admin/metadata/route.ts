import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    // Public access allowed for recruitment metadata
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

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { type, items } = await req.json()
    const table = type === 'category' ? 'job_categories' : 'employment_types'

    const { data, error } = await supabaseAdmin
      .from(table)
      .upsert(items, { onConflict: 'value' })
      .select()

    if (error) throw error
    return ApiResponse.success(data)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
