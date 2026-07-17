import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    // Fetch snapshots for the last 30 days
    const { data: snapshots, error } = await supabaseAdmin
      .from('dashboard_snapshots')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(100)

    if (error) throw error
    return ApiResponse.success(snapshots)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const body = await req.json()
    const { snapshots, manual } = body 

    if (manual) {
      // Manual trigger of current snapshot
      const [
        totalJobs,
        totalCandidates,
        newApps,
        hired
      ] = await Promise.all([
        supabaseAdmin.from('jobs').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).is('deleted_at', null),
        supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'new').is('deleted_at', null),
        supabaseAdmin.from('applications').select('*', { count: 'exact', head: true }).eq('status', 'hired').is('deleted_at', null)
      ])

      const today = new Date().toISOString().split('T')[0]
      const currentSnapshots = [
        { metric_name: 'total_jobs', metric_value: totalJobs.count || 0, snapshot_date: today },
        { metric_name: 'total_candidates', metric_value: totalCandidates.count || 0, snapshot_date: today },
        { metric_name: 'new_applications', metric_value: newApps.count || 0, snapshot_date: today },
        { metric_name: 'hired_count', metric_value: hired.count || 0, snapshot_date: today }
      ]

      const { data, error } = await supabaseAdmin
        .from('dashboard_snapshots')
        .upsert(currentSnapshots, { onConflict: 'metric_name,snapshot_date' })

      if (error) throw error
      return ApiResponse.success({ message: 'Snapshots captured for today' })
    }

    if (Array.isArray(snapshots)) {
      // Import historical snapshots
      const { data, error } = await supabaseAdmin
        .from('dashboard_snapshots')
        .upsert(snapshots, { onConflict: 'metric_name,snapshot_date' })

      if (error) throw error
      return ApiResponse.success({ message: 'Imported ' + snapshots.length + ' snapshots' })
    }

    return ApiResponse.error('Invalid request body', 400)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
