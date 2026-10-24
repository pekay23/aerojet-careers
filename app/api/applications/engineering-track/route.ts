import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, cleanInput, sanitizeErrorMessage, withPublicProtection } from '@/lib/api-utils'
import { sendAcknowledgmentEmail } from '@/lib/email-service'
import { EngineeringTrackSchema } from '@/lib/validation/schemas'

export async function POST(req: NextRequest) {
  try {
    const guard = await withPublicProtection(req, 'application')
    if (guard.blocked) return guard.response

    const isMultipart = req.headers.get('content-type')?.includes('multipart/form-data')
    let v: any
    let file: File | null = null

    if (isMultipart) {
      const formData = await req.formData()
      const data: Record<string, any> = {}
      const rawFile = formData.get('cv_file')
      if (rawFile instanceof File) {
        file = rawFile
      }
      formData.forEach((value, key) => {
        if (key === 'cv_file') return
        data[key] = value
      })
      const parsed = EngineeringTrackSchema.safeParse(data)
      if (!parsed.success) {
        return ApiResponse.error(
          'Validation failed: ' + parsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
          400
        )
      }
      v = parsed.data
    } else {
      const body = await req.json()
      const parsed = EngineeringTrackSchema.safeParse(body)
      if (!parsed.success) {
        return ApiResponse.error(
          'Validation failed: ' + parsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
          400
        )
      }
      v = parsed.data
    }

    // 1. Core application — insert into applications table with track identifier
    const { data: app, error: appErr } = await supabaseAdmin
       .from('applications')
       .insert({
         job_id:               null,
         job_title:            v.job_title_applied || 'Skilled Training — Engineering Track',
         first_name:           cleanInput(v.first_name),
         last_name:            cleanInput(v.last_name),
         email:                v.email?.trim(),
         phone:                v.phone,
         nationality:          v.nationality,
         country_of_residence: v.country_of_residence,
         date_of_birth:        v.date_of_birth || null,
         has_valid_passport:   v.has_valid_passport ?? null,
         deployment_pref:      v.deployment_pref,
         location_restrictions: null,
         availability:         'immediately',
         source:               v.source || 'engineering-track-form',
         status:               'new',
       })
       .select()
       .single()

    if (appErr || !app) {
      console.error('Engineering track application insert error:', appErr)
      return ApiResponse.error(appErr?.message || 'Failed to save application', 500)
    }

    const id = app.id

    // 2. Track-specific qualifications (store in application_qualifications with track context)
    const { error: qualErr } = await supabaseAdmin.from('application_qualifications').insert({
      application_id:       id,
      licence_type:         `Engineering Track: ${v.preferred_engineering_role}`,
      licence_number:       null,
      issuing_authority:    null,
      licence_expiry:       null,
      type_ratings:         [],
      other_type_ratings:   `WAEC Maths: ${v.waec_maths_grade || 'N/A'}; WAEC Physics: ${v.waec_physics_grade || 'N/A'}`,
      certifications:       [],
      highest_qualification:v.highest_qualification || null,
    })
    if (qualErr) console.warn('Engineering track qualification insert failed:', qualErr)

    // 3. Experience (minimal for trainees)
    const { error: expErr } = await supabaseAdmin.from('application_experience').insert({
      application_id:  id,
      current_employer: v.highest_qualification === 'WAEC/WASSCE' ? 'Student / Recent Graduate' : 'Not specified',
      job_title:       null,
      role_start_date: null,
      role_end_date:   null,
      total_years_exp: 'Less than 3 years',
      work_types:      [],
      outstation_exp:  null,
      stations_worked: null,
      notice_period:   'immediately',
      motivation:      v.motivation || null,
    })
    if (expErr) console.warn('Engineering track experience insert failed:', expErr)

    // 4. Compensation (defaults for trainees)
    const { error: compErr } = await supabaseAdmin.from('application_compensation').insert({
      application_id:          id,
      current_salary:          null,
      current_salary_currency: 'USD',
      current_benefits:        [],
      total_package_approx:    null,
      expected_min_usd:        null,
      expected_target_usd:     null,
      payment_preference:      'usd_home',
      accommodation_important: null,
      deployment_arrangement:  v.deployment_pref,
      earliest_start_date:     null,
      additional_notes:        `Engineering Track Application - ${v.preferred_engineering_role}. Shift confirmed: ${v.shift_availability_confirmed}. Medical confirmed: ${v.medical_fitness_confirmed}. Accra-based confirmed: ${v.accra_based_confirmed}. Qualification details: ${v.qualification_details || 'N/A'}`,
    })
    if (compErr) console.warn('Engineering track compensation insert failed:', compErr)

    // 5. Pipeline event
    const { error: pipeErr } = await supabaseAdmin.from('pipeline_events').insert({
      application_id: id,
      event_type:     'submitted',
      to_status:      'new',
      note:           `Engineering Track application submitted for ${v.preferred_engineering_role}`,
    })
    if (pipeErr) console.warn('Pipeline event failed:', pipeErr)

    // 6. CV upload
    if (file && id) {
      if (file.size > 5 * 1024 * 1024) {
        return ApiResponse.error('CV must be under 5 MB', 400)
      }
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ]
      if (!allowed.includes(file.type)) {
        return ApiResponse.error('CV file type not permitted', 400)
      }

      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `applications/${id}/${Date.now()}-${safe}`
      const bytes = await file.arrayBuffer()
      const { error: uploadErr } = await supabaseAdmin.storage
        .from('application-documents')
        .upload(path, bytes, { contentType: file.type, upsert: false })
      if (uploadErr) {
        console.error('Engineering track CV upload error:', uploadErr)
      } else {
        await supabaseAdmin
          .from('application_documents')
          .insert({
            application_id: id,
            document_type: 'cv',
            file_name: file.name,
            file_path: path,
            file_size: file.size,
            mime_type: file.type,
            storage_bucket: 'application-documents',
          })
      }
    }

    // 7. Acknowledgement email
    await sendAcknowledgmentEmail(
      v.email,
      v.first_name,
      v.last_name,
      app.ref_code,
      v.job_title_applied || 'Skilled Training — Engineering Track'
    ).catch(e => console.warn('Acknowledgment email failed:', e))

    return ApiResponse.success({ id, ref_code: app.ref_code })

  } catch (err) {
    console.error('Engineering track application error:', err)
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}