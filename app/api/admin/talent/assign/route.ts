import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { talentId, jobId } = await req.json()
    if (!talentId || !jobId) return ApiResponse.error('talentId and jobId are required', 400)

    // 1. Fetch Talent
    const { data: talent, error: tErr } = await supabaseAdmin
      .from('talent_pool')
      .select('*')
      .eq('id', talentId)
      .single()
    
    if (tErr || !talent) return ApiResponse.error('Talent not found', 404)

    // 2. Fetch Job (for title)
    const { data: job, error: jErr } = await supabaseAdmin
      .from('jobs')
      .select('title')
      .eq('id', jobId)
      .single()
    
    if (jErr || !job) return ApiResponse.error('Target job not found', 404)

    // 3. Insert Application
    const { data: app, error: appErr } = await supabaseAdmin
      .from('applications')
      .insert({
        job_id:               jobId,
        job_title:            job.title,
        first_name:           talent.first_name,
        last_name:            talent.last_name,
        email:                talent.email,
        phone:                talent.phone,
        nationality:          talent.nationality,
        country_of_residence: talent.country || 'N/A',
        status:               'new',
        source:               'talent_pool'
      })
      .select('id, ref_code')
      .single()

    if (appErr || !app) throw appErr

    // 4. Record event
    await supabaseAdmin.from('pipeline_events').insert({
      application_id: app.id,
      event_type:     'transferred_from_pool',
      note:           `Candidate fast-tracked from Talent Pool by ${auth.user.email}`,
      admin_user_id:  auth.user.id
    })

    return ApiResponse.success({ 
      message: 'Candidate assigned to job successfully',
      applicationId: app.id,
      refCode: app.ref_code
    })

  } catch (err: any) {
    console.error('Talent assignment error:', err)
    return ApiResponse.error(err.message, 500)
  }
}
