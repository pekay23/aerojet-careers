import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendWelcomeEmail } from '@/lib/email-service'
import { ApiResponse, verifyRole, sanitizeErrorMessage } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'], req)
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const body = await req.json()
    const { firstName, lastName, email, role, department, jobTitle } = body

    if (!firstName || !lastName || !email) {
      return ApiResponse.error('Missing required fields', 400)
    }

    // 1. Generate temporary password
    const array = new Uint32Array(2)
    crypto.getRandomValues(array)
    const tempPassword = `Aerojet!${Array.from(array, v => v.toString(36)).join('').slice(-8)}`

    // 2. Create Auth User
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: `${firstName} ${lastName}`
      }
    })

    if (authError || !authData.user) {
      return ApiResponse.error(authError?.message || 'Failed to create auth user', 500)
    }

    const authUserId = authData.user.id

    // 3. Create Admin User record
    // 3. Create Admin User record
    const { data: adminUser, error: adminUserError } = await supabaseAdmin
      .from('admin_users')
      .insert({
        auth_user_id: authUserId,
        email,
        full_name: `${firstName} ${lastName}`,
        role: role?.toLowerCase() || 'employee',
        is_active: true
      })
      .select('id')
      .single()

    if (adminUserError || !adminUser) {
      await supabaseAdmin.auth.admin.deleteUser(authUserId)
      throw adminUserError
    }

    // 4. Create Staff Profile
    const { error: profileError } = await supabaseAdmin
      .from('staff_profiles')
      .insert({
        auth_user_id: authUserId,
        admin_user_id: adminUser.id,
        first_name: firstName,
        last_name: lastName,
        email,
        job_title: jobTitle || 'Staff Member',
        department: department || 'General Operations',
        employee_id: `AE-M${Math.floor(1000 + Math.random() * 9000)}`,
        employment_status: 'active'
      })

    if (profileError) {
      return ApiResponse.error(profileError.message, 500)
    }

    // 5. Send Welcome Email
    await sendWelcomeEmail(email, `${firstName} ${lastName}`, tempPassword)

    return ApiResponse.success({ 
      id: authUserId,
      email,
      full_name: `${firstName} ${lastName}`,
      role: role?.toLowerCase() || 'employee'
    })

  } catch (err) {
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}
