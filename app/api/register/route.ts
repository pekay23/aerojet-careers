import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, cleanInput } from '@/lib/api-utils'
import { RegistrationSchema } from '@/lib/validation/schemas'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = RegistrationSchema.safeParse(body)
    if (!parsed.success) {
      return ApiResponse.error(
        'Validation failed: ' + parsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
        400
      )
    }

    const v = parsed.data

    const { data, error } = await supabaseAdmin
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
        departments_interest:  v.departments_interest,
        statement:             v.statement || null,
        source:                v.source || null,
      })
      .select()
      .single()

    if (error) {
      // Duplicate email — still return success
      if (error.code === '23505') {
        return ApiResponse.success({ id: null, duplicate: true })
      }
      console.error('Talent pool insert error:', error)
      return ApiResponse.error('Failed to register', 500)
    }

    return ApiResponse.success({ id: data.id })

  } catch (err: any) {
    console.error('Register error:', err)
    return ApiResponse.error('Internal server error', 500)
  }
}
