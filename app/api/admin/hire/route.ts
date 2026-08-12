import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWelcomeEmail } from '@/lib/email-service'
import { ApiResponse, verifyRole, sanitizeErrorMessage } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { applicationId } = await req.json()
    if (!applicationId) {
      return ApiResponse.error('Application ID is required', 400)
    }

    // 1. Fetch the application with all details
    const { data: app, error: appError } = await supabaseAdmin
      .from('applications')
      .select('*, experience:application_experience(*), job:jobs(department)')
      .eq('id', applicationId)
      .is('deleted_at', null)
      .single()

    if (appError || !app) {
      return ApiResponse.error('Application not found', 404)
    }

    // 2. Check if email already exists in admin_users or staff_profiles
    const { data: existingAdmin } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('email', app.email)
      .maybeSingle()
    
    if (existingAdmin) {
      return ApiResponse.error('A staff member with this email already exists in the portal.', 400)
    }

    // 3. Generate a temporary password
    const tempPassword = `Aerojet!${Math.random().toString(36).slice(-8)}`

    // 3. Create the Supabase Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: app.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${app.first_name} ${app.last_name}`,
        phone: app.phone
      }
    })

    if (authError || !authData.user) {
      return ApiResponse.error(`Auth Error: ${authError?.message}`, 500)
    }

    const authUserId = authData.user.id

    // 4. Create record in admin_users (to allow portal login)
    const { data: adminUser, error: adminUserError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        auth_user_id: authUserId,
        email: app.email,
        full_name: `${app.first_name} ${app.last_name}`,
        role: 'employee', 
        is_active: true
      })
      .select('id')
      .single()

    if (adminUserError || !adminUser) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      return ApiResponse.error(`Admin Record Error: ${adminUserError.message}`, 500)
    }

    // 5. Create the Staff Profile
    const { error: profileError } = await supabaseAdmin
      .from('staff_profiles')
      .insert({
        auth_user_id: authUserId,
        admin_user_id: adminUser.id,
        application_id: app.id,
        first_name: app.first_name,
        last_name: app.last_name,
        email: app.email,
        phone: app.phone,
        nationality: app.nationality,
        date_of_birth: app.date_of_birth,
        job_title: app.job_title || 'New Employee',
        department: app.job?.department || 'Aerojet Operations',
        employee_id: `AE-${Math.floor(1000 + Math.random() * 9000)}`,
        employment_status: 'active',
        joined_at: new Date().toISOString().split('T')[0]
      })

    if (profileError) {
      return ApiResponse.error(`Profile Creation Error: ${profileError.message}`, 500)
    }

    // 6. Update Application Status
    await supabaseAdmin
      .from('applications')
      .update({ 
        status: 'hired', 
        hired_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', app.id)

    await supabaseAdmin.from('pipeline_events').insert({
      application_id: app.id,
      event_type: 'status_change',
      from_status: app.status,
      to_status: 'hired',
      note: 'Candidate officially hired and staff profile created.',
      admin_user_id: auth.adminUserId,
    })

    // 8. Send Welcome Email
    await sendWelcomeEmail(app.email, `${app.first_name} ${app.last_name}`, tempPassword)

    return ApiResponse.success({ 
      authUserId, 
      tempPassword,
      message: 'Candidate hired successfully. Credentials generated.' 
    })

  } catch (err) {
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}
