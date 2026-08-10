import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, cleanInput } from '@/lib/api-utils'
import { sendAcknowledgmentEmail } from '@/lib/email-service'
import { ApplicationSchema } from '@/lib/validation/schemas'

export async function POST(req: NextRequest) {
  try {
     const body = await req.json()
     const parsed = ApplicationSchema.safeParse(body)
     if (!parsed.success) {
       return ApiResponse.error(
         'Validation failed: ' + parsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
         400
       )
     }

      const v = parsed.data

    // 1. Core application
    const { data: app, error: appErr } = await supabaseAdmin
       .from('applications')
       .insert({
         job_id:               v.job_id || null,
         job_title:            v.job_title_applied || null,
         first_name:           cleanInput(v.first_name),
         last_name:            cleanInput(v.last_name),
         email:                v.email?.trim(),
         phone:                v.phone,
         nationality:          v.nationality,
         country_of_residence: v.country_of_residence,
         date_of_birth:        v.date_of_birth || null,
         has_valid_passport:   v.has_valid_passport ?? null,
         deployment_pref:      v.deployment_pref,
         location_restrictions: v.location_restrictions || null,
         availability:         v.availability || null,
         source:               v.source || null,
         status:               'new',
       })
       .select()
       .single()

    if (appErr || !app) {
      console.error('Application insert error:', appErr)
      return ApiResponse.error(appErr?.message || 'Failed to save application', 500)
    }

    const id = app.id

    // 2. Qualifications
    if (v.licence_type) {
      const { error: qualErr } = await supabaseAdmin.from('application_qualifications').insert({
        application_id:       id,
        licence_type:         v.licence_type,
        licence_number:       v.licence_number || null,
        issuing_authority:    v.issuing_authority || null,
        licence_expiry:       v.licence_expiry || null,
        type_ratings:         v.type_ratings || [],
        other_type_ratings:   v.other_type_ratings || null,
        certifications:       v.certifications || [],
        highest_qualification:v.highest_qualification || null,
      })
      if (qualErr) console.warn('Qualification insert failed:', qualErr)
    }

    // 3. Experience
    if (v.current_employer) {
      const { error: expErr } = await supabaseAdmin.from('application_experience').insert({
        application_id:  id,
        current_employer: v.current_employer,
        job_title:       v.job_title || null,
        role_start_date: v.role_start_date || null,
        role_end_date:   v.role_end_date || null,
        total_years_exp: v.total_years_exp || null,
        work_types:      v.work_types || [],
        outstation_exp:  v.outstation_exp || null,
        stations_worked: v.stations_worked || null,
        notice_period:   v.notice_period || null,
        motivation:      v.motivation || null,
      })
      if (expErr) console.warn('Experience insert failed:', expErr)
    }

    // 4. Compensation
    const { error: compErr } = await supabaseAdmin.from('application_compensation').insert({
      application_id:          id,
      current_salary:          v.current_salary || null,
      current_salary_currency: v.current_salary_currency || 'USD',
      current_benefits:        v.current_benefits || [],
      total_package_approx:    v.total_package_approx || null,
      expected_min_usd:        v.expected_min_usd || null,
      expected_target_usd:     v.expected_target_usd || null,
      payment_preference:      v.payment_preference || null,
      accommodation_important: v.accommodation_important || null,
      deployment_arrangement:  v.deployment_arrangement || null,
      earliest_start_date:     v.earliest_start_date || null,
      additional_notes:        v.additional_notes || null,
    })
    if (compErr) console.warn('Compensation insert failed:', compErr)

    // 5. Pipeline event
    const { error: pipeErr } = await supabaseAdmin.from('pipeline_events').insert({
      application_id: id,
      event_type:     'submitted',
      to_status:      'new',
      note:           `Application submitted for ${v.job_title_applied || 'General Application'}`,
    })
    if (pipeErr) console.warn('Pipeline event failed:', pipeErr)

    // 6. Acknowledgement email
    await sendAcknowledgmentEmail(
      v.email,
      v.first_name,
      v.last_name,
      app.ref_code,
      v.job_title_applied || 'General Application'
    ).catch(e => console.warn('Acknowledgment email failed:', e))

    return ApiResponse.success({ id, ref_code: app.ref_code })

  } catch (err: any) {
    console.error('Application error:', err)
    return ApiResponse.error(err.message || 'Internal server error', 500)
  }
}
