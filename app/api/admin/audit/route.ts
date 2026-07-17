import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const p    = new URL(req.url).searchParams
    const type = p.get('type')
    const limit = Math.min(100, parseInt(p.get('limit') || '50'))

    let q = supabaseAdmin
      .from('pipeline_events')
      .select('*, admin:admin_users(email, full_name)')
      .order('created_at', { ascending: false })
      .range(0, limit - 1)

    if (type) q = q.eq('event_type', type)

    const { data, error } = await q
    if (error) throw error

    return ApiResponse.success(data)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
