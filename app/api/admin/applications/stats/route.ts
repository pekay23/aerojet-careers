import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole, sanitizeErrorMessage } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    // 1. Core Counts
    const { count: totalActive } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .is('deleted_at', null)

    const { count: newCount } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')
      .is('deleted_at', null)

    const { count: shortlisted } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'shortlisted')
      .is('deleted_at', null)

    // 2. Velocity (Shortlisted in last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    
    const { count: velocity } = await supabaseAdmin
      .from('pipeline_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'status_change')
      .eq('to_status', 'shortlisted')
      .gte('created_at', sevenDaysAgo.toISOString())

    // 3. Stale Applications (> 3 days with no status change)
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)
    
    const { count: pending } = await supabaseAdmin
      .from('applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'new')
      .is('deleted_at', null)
      .lte('updated_at', threeDaysAgo.toISOString())

    return ApiResponse.success({
      total: totalActive || 0,
      new: newCount || 0,
      shortlisted: shortlisted || 0,
      velocity: velocity || 0,
      pending: pending || 0
    })

  } catch (err) {
    console.error('Stats API error:', err)
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}
