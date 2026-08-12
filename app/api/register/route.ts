import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, cleanInput, withPublicProtection, sanitizeErrorMessage } from '@/lib/api-utils'
import { RegistrationSchema } from '@/lib/validation/schemas'

export async function POST(req: NextRequest) {
  try {
    const guard = await withPublicProtection(req, 'register')
    if (guard.blocked) return guard.response

    const isMultipart = req.headers.get('content-type')?.includes('multipart/form-data')
    let v: any
    let file: File | null = null

    if (isMultipart) {
      const formData = await req.formData()
      const data: Record<string, any> = {}
      const rawFile = formData.get('file')
      if (rawFile instanceof File) {
        file = rawFile
      }
      formData.forEach((value, key) => {
        if (key === 'file') return
        if (key === 'departments_interest') {
          data[key] = JSON.parse(value as string)
        } else {
          data[key] = value
        }
      })
      const parsed = RegistrationSchema.safeParse(data)
      if (!parsed.success) {
        return ApiResponse.error(
          'Validation failed: ' + parsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
          400
        )
      }
      v = parsed.data
    } else {
      const body = await req.json()
      const parsed = RegistrationSchema.safeParse(body)
      if (!parsed.success) {
        return ApiResponse.error(
          'Validation failed: ' + parsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
          400
        )
      }
      v = parsed.data
    }

    const { data: talent, error } = await supabaseAdmin
      .from('talent_pool')
      .insert({
        first_name:            cleanInput(v.first_name),
        last_name:             cleanInput(v.last_name),
        email:                 v.email?.trim(),
        phone:                 v.phone || null,
        nationality:           v.nationality,
        country:               v.country,
        years_experience:      v.years_experience,
        qualification:         v.qualification,
        departments_interest:  v.departments_interest || [],
        statement:             v.statement || null,
        source:                v.source || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return ApiResponse.success({ id: null, duplicate: true })
      }
      console.error('Talent pool insert error:', error)
      return ApiResponse.error('Failed to register', 500)
    }

    if (file && talent.id) {
      if (file.size > 5 * 1024 * 1024) {
        return ApiResponse.error('CV must be under 5 MB', 400)
      }
      const allowed = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp'
      ]
      if (!allowed.includes(file.type)) {
        return ApiResponse.error('CV file type not permitted', 400)
      }

      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const path = `talent-pool/${talent.id}/${Date.now()}-${safe}`
      const bytes = await file.arrayBuffer()
      const { error: uploadErr } = await supabaseAdmin.storage
        .from('application-documents')
        .upload(path, bytes, { contentType: file.type, upsert: false })
      if (uploadErr) {
        console.error('Talent CV upload error:', uploadErr)
      } else {
        await supabaseAdmin
          .from('talent_pool')
          .update({ cv_path: path })
          .eq('id', talent.id)
      }
    }

    return ApiResponse.success({ id: talent.id })

  } catch (err) {
    console.error('Register error:', err)
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}
