import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, cleanInput } from '@/lib/api-utils'
import { sendAcknowledgmentEmail } from '@/lib/email-service'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const firstName = cleanInput(body.first_name)
    const lastName = cleanInput(body.last_name)
    const email = body.email?.trim()

    // 1. Core application
    const { data: app, error: appErr } = await supabaseAdmin
      .from('applications')
      .insert({
        job_id:               body.job_id || null,
        job_title:            body.job_title_applied || null,
        first_name:           firstName,
        last_name:            lastName,
        email:                email,
        phone:                body.phone,
        nationality:          body.nationality,
        country_of_residence: body.country_of_residence,
        date_of_birth:        body.date_of_birth || null,
        has_valid_passport:   body.has_valid_passport ?? null,
        deployment_pref:      body.deployment_pref,
        location_restrictions:body.location_restrictions || null,
        availability:         body.availability || null,
        source:               body.source || null,
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
    if (body.licence_type) {
      const { error: qualErr } = await supabaseAdmin.from('application_qualifications').insert({
        application_id:       id,
        licence_type:         body.licence_type,
        licence_number:       body.licence_number || null,
        issuing_authority:    body.issuing_authority || null,
        licence_expiry:       body.licence_expiry || null,
        type_ratings:         body.type_ratings || [],
        other_type_ratings:   body.other_type_ratings || null,
        certifications:       body.certifications || [],
        highest_qualification:body.highest_qualification || null,
      })
      if (qualErr) console.warn('Qualification insert failed:', qualErr)
    }

    // 3. Experience
    if (body.current_employer) {
      const { error: expErr } = await supabaseAdmin.from('application_experience').insert({
        application_id:  id,
        current_employer:body.current_employer,
        job_title:       body.job_title || null,
        role_start_date: body.role_start_date || null,
        role_end_date:   body.role_end_date || null,
        total_years_exp: body.total_years_exp || null,
        work_types:      body.work_types || [],
        outstation_exp:  body.outstation_exp || null,
        stations_worked: body.stations_worked || null,
        notice_period:   body.notice_period || null,
        motivation:      body.motivation || null,
      })
      if (expErr) console.warn('Experience insert failed:', expErr)
    }

    // 4. Compensation
    const { error: compErr } = await supabaseAdmin.from('application_compensation').insert({
      application_id:          id,
      current_salary:          body.current_salary || null,
      current_salary_currency: body.current_salary_currency || 'USD',
      current_benefits:        body.current_benefits || [],
      total_package_approx:    body.total_package_approx || null,
      expected_min_usd:        body.expected_min_usd || null,
      expected_target_usd:     body.expected_target_usd || null,
      payment_preference:      body.payment_preference || null,
      accommodation_important: body.accommodation_important || null,
      deployment_arrangement:  body.deployment_arrangement || null,
      earliest_start_date:     body.earliest_start_date || null,
      additional_notes:        body.additional_notes || null,
    })
    if (compErr) console.warn('Compensation insert failed:', compErr)

    // 5. Pipeline event
    const { error: pipeErr } = await supabaseAdmin.from('pipeline_events').insert({
      application_id: id,
      event_type:     'submitted',
      to_status:      'new',
      note:           `Application submitted for ${body.job_title_applied || 'General Application'}`,
    })
    if (pipeErr) console.warn('Pipeline event failed:', pipeErr)

    // 6. Acknowledgement email (non-fatal, direct call)
    await sendAcknowledgmentEmail(
      email,
      firstName,
      lastName,
      app.ref_code,
      body.job_title_applied || 'General Application'
    ).catch(e => console.warn('Acknowledgment email failed:', e))

    return ApiResponse.success({ id, ref_code: app.ref_code })

  } catch (err: any) {
    console.error('Application error:', err)
    return ApiResponse.error(err.message || 'Internal server error', 500)
  }
}
