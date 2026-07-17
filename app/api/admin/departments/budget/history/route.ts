import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const p = new URL(req.url).searchParams
    const deptId = p.get('deptId')

    let q = supabaseAdmin
      .from('department_budget_history')
      .select(`
        *,
        author:admin_users!department_budget_history_created_by_fkey (
          full_name
        )
      `)
      .order('created_at', { ascending: false })

    if (deptId) q = q.eq('department_id', deptId)

    const { data, error } = await q
    if (error) throw error

    return ApiResponse.success(data)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
