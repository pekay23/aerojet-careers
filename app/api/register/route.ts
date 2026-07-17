import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, cleanInput } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const { data, error } = await supabaseAdmin
      .from('talent_pool')
      .insert({
        first_name:            cleanInput(body.first_name),
        last_name:             cleanInput(body.last_name),
        email:                 body.email?.trim(),
        phone:                 body.phone || null,
        nationality:           body.nationality || null,
        country:               body.country || null,
        years_experience:      body.years_experience || null,
        qualification:         body.qualification || null,
        departments_interest:  body.departments_interest || [],
        statement:             body.statement || null,
        source:                body.source || null,
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
