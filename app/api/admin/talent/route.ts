import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole, sanitizeSearch } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const p      = new URL(req.url).searchParams
    const search = p.get('search')
    const dept   = p.get('dept')
    const page   = Math.max(1, parseInt(p.get('page') || '1'))
    const limit  = Math.min(100, parseInt(p.get('limit') || '50'))
    const offset = (page - 1) * limit

    let q = supabaseAdmin
      .from('talent_pool')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      const s = sanitizeSearch(search)
      if (s) q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%`)
    }

    if (dept && dept !== 'all') {
      q = q.contains('departments_interest', [dept])
    }

    const { data, error, count } = await q

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('not found')) {
        return ApiResponse.success({ data: [], total: 0, page, limit })
      }
      throw error
    }

    return ApiResponse.success({ 
      data, 
      total: count, 
      page, 
      limit 
    })

  } catch (err: any) {
    console.error('Admin talent route error:', err)
    return ApiResponse.error(err.message, 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized: Deletion restricted to Admin/HR', 403)

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return ApiResponse.error('id required', 400)

    const { error } = await supabaseAdmin.from('talent_pool').delete().eq('id', id)
    if (error) throw error

    return ApiResponse.success({ message: 'Candidate removed from talent pool' })
  } catch (err: any) {
    console.error('Talent delete error:', err)
    return ApiResponse.error(err.message, 500)
  }
}
