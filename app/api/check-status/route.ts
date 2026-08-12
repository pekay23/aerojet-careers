import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, sanitizeErrorMessage } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const refCode = new URL(req.url).searchParams.get('ref')?.trim()
    if (!refCode) {
      return ApiResponse.error('Reference code is required', 400)
    }

    const { data: app, error } = await supabaseAdmin
      .from('applications')
      .select(`
        ref_code,
        status,
        first_name,
        last_name,
        job_title,
        created_at,
        qualifications:application_qualifications(licence_type, licence_expiry),
        experience:application_experience(current_employer, total_years_exp, motivation),
        compensation:application_compensation(current_salary, current_salary_currency, expected_min_usd, expected_target_usd, payment_preference)
      `)
      .eq('ref_code', refCode)
      .is('deleted_at', null)
      .maybeSingle()

    if (error) throw error
    if (!app) {
      return ApiResponse.error('Application not found. Please check your reference code and try again.', 404)
    }

    return ApiResponse.success(app)
  } catch (err) {
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}
