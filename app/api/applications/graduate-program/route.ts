import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, cleanInput, sanitizeErrorMessage, withPublicProtection } from '@/lib/api-utils'
import { sendAcknowledgmentEmail } from '@/lib/email-service'
import { GraduateProgramSchema } from '@/lib/validation/schemas'

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
      // Handle array fields that come as JSON strings
      if (data.preferred_areas && typeof data.preferred_areas === 'string') {
        try { data.preferred_areas = JSON.parse(data.preferred_areas) } catch { data.preferred_areas = [] }
      }
      const parsed = GraduateProgramSchema.safeParse(data)
      if (!parsed.success) {
        return ApiResponse.error(
          'Validation failed: ' + parsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
          400
        )
      }
      v = parsed.data
    } else {
      const body = await req.json()
      const parsed = GraduateProgramSchema.safeParse(body)
      if (!parsed.success) {
        return ApiResponse.error(
          'Validation failed: ' + parsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
          400
        )
      }
      v = parsed.data
    }

    // 1. Core application
    const { data: app, error: appErr } = await supabaseAdmin
       .from('applications')
       .insert({
         job_id:               null,
         job_title:            'Graduate Program',
         first_name:           cleanInput(v.first_name),
         last_name:            cleanInput(v.last_name),
         email:                v.email?.trim(),
         phone:                v.phone,
         nationality:          v.nationality,
         country_of_residence: v.country_of_residence,
         date_of_birth:        v.date_of_birth || null,
         has_valid_passport:   v.has_valid_passport ?? null,
         deployment_pref:      'fully_flexible',
         location_restrictions: null,
         availability:         'immediately',
         source:               v.source || 'graduate-program-form',
         status:               'new',
       })
       .select()
       .single()

    if (appErr || !app) {
      console.error('Graduate program application insert error:', appErr)
      return ApiResponse.error(appErr?.message || 'Failed to save application', 500)
    }

    const id = app.id

    // 2. Qualifications (store degree info)
    const { error: qualErr } = await supabaseAdmin.from('application_qualifications').insert({
      application_id:       id,
      licence_type:         `Graduate Program: ${v.preferred_areas.join(', ')}`,
      licence_number:       null,
      issuing_authority:    v.university,
      licence_expiry:       null,
      type_ratings:         [],
      other_type_ratings:   `Degree: ${v.degree}; Graduation: ${v.graduation_year}; Grade/GPA: ${v.grade_gpa || 'N/A'}`,
      certifications:       [],
      highest_qualification:v.degree,
    })
    if (qualErr) console.warn('Graduate program qualification insert failed:', qualErr)

    // 3. Experience
    const { error: expErr } = await supabaseAdmin.from('application_experience').insert({
      application_id:  id,
      current_employer: 'Recent Graduate / Student',
      job_title:       v.degree,
      role_start_date: null,
      role_end_date:   null,
      total_years_exp: 'Less than 3 years',
      work_types:      [],
      outstation_exp:  null,
      stations_worked: null,
      notice_period:   'immediately',
      motivation:      v.motivation || null,
    })
    if (expErr) console.warn('Graduate program experience insert failed:', expErr)

    // 4. Compensation
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
      deployment_arrangement:  'fully_flexible',
      earliest_start_date:     null,
      additional_notes:        `Graduate Program Application. Preferred areas: ${v.preferred_areas.join(', ')}. Internships/attachments: ${v.internships_attachments || 'N/A'}`,
    })
    if (compErr) console.warn('Graduate program compensation insert failed:', compErr)

    // 5. Pipeline event
    const { error: pipeErr } = await supabaseAdmin.from('pipeline_events').insert({
      application_id: id,
      event_type:     'submitted',
      to_status:      'new',
      note:           `Graduate Program application submitted. Areas: ${v.preferred_areas.join(', ')}`,
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
        console.error('Graduate program CV upload error:', uploadErr)
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
      'Graduate Program'
    ).catch(e => console.warn('Acknowledgment email failed:', e))

    return ApiResponse.success({ id, ref_code: app.ref_code })

  } catch (err) {
    console.error('Graduate program application error:', err)
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}