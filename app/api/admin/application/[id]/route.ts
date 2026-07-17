import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { id } = await params
    const { data, error } = await supabaseAdmin
      .from('applications')
      .select(`
        *,
        qualifications:application_qualifications(*),
        experience:application_experience(*),
        compensation:application_compensation(*),
        documents:application_documents(*),
        pipeline_events(*)
      `)
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) return ApiResponse.error(error.message, 404)
    return ApiResponse.success(data)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
