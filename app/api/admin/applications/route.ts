import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole, sanitizeSearch } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const p      = new URL(req.url).searchParams
    const status = p.get('status')
    const search = p.get('search')
    const page   = Math.max(1, parseInt(p.get('page') || '1'))
    const limit  = Math.min(50, parseInt(p.get('limit') || '25'))
    const offset = (page - 1) * limit

    let q = supabaseAdmin
      .from('applications')
      .select('*, qualifications:application_qualifications(*), experience:application_experience(*), compensation:application_compensation(*)', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) q = q.eq('status', status)
    if (search) {
      const s = sanitizeSearch(search)
      if (s) q = q.or(`first_name.ilike.%${s}%,last_name.ilike.%${s}%,email.ilike.%${s}%,ref_code.ilike.%${s}%`)
    }

    const { data, error, count } = await q
    if (error) throw error

    return ApiResponse.success({ data, total: count, page, limit })
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { id, ...updates } = await req.json()
    if (!id) return ApiResponse.error('id required', 400)

    // Log status change if status is being updated
    const { data: current } = await supabaseAdmin.from('applications').select('status').eq('id', id).single()

    const { data, error } = await supabaseAdmin
      .from('applications')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (updates.status && current && updates.status !== current.status) {
      await supabaseAdmin.from('pipeline_events').insert({
        application_id: id,
        event_type:     'status_change',
        from_status:    current.status,
        to_status:      updates.status,
        note:           `Status changed from ${current.status} to ${updates.status}`,
        admin_user_id:  auth.user.id
      })
    }

    return ApiResponse.success(data)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return ApiResponse.error('id required', 400)

    // TIERED DELETE LOGIC
    if (auth.role === 'recruiter') {
      // SOFT DELETE (Archive) for Hiring Managers
      const { error } = await supabaseAdmin
        .from('applications')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
      
      if (error) throw error
      return ApiResponse.success({ message: 'Application archived successfully' })
    } else {
      // HARD DELETE for Admin/HR
      // 1. Clean up storage files before deleting DB records
      const { data: docs } = await supabaseAdmin
        .from('application_documents')
        .select('file_path, storage_bucket')
        .eq('application_id', id)

      if (docs && docs.length > 0) {
        // Group files by bucket
        const bucketFiles: Record<string, string[]> = {}
        docs.forEach((d: any) => {
          if (!bucketFiles[d.storage_bucket]) bucketFiles[d.storage_bucket] = []
          bucketFiles[d.storage_bucket].push(d.file_path)
        })
        // Remove files from each bucket
        for (const [bucket, paths] of Object.entries(bucketFiles)) {
          await supabaseAdmin.storage.from(bucket).remove(paths)
        }
      }

      // 2. Delete related DB records
      await supabaseAdmin.from('application_qualifications').delete().eq('application_id', id)
      await supabaseAdmin.from('application_experience').delete().eq('application_id', id)
      await supabaseAdmin.from('application_compensation').delete().eq('application_id', id)
      await supabaseAdmin.from('pipeline_events').delete().eq('application_id', id)
      await supabaseAdmin.from('application_documents').delete().eq('application_id', id)

      // 3. Delete the application itself
      const { error } = await supabaseAdmin.from('applications').delete().eq('id', id)
      if (error) throw error

      return ApiResponse.success({ message: 'Application permanently deleted' })
    }
  } catch (err: any) {
    console.error('Application delete error:', err)
    return ApiResponse.error(err.message, 500)
  }
}
