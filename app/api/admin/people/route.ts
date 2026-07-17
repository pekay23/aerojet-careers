import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { data, error } = await supabaseAdmin
      .from('admin_users')
      .select(`
        id,
        auth_user_id,
        email,
        full_name,
        role,
        is_active,
        staff_profiles (
        id,
        job_title,
        department,
        employment_status
        )
      `)
      .order('full_name')

    if (error) throw error
    return ApiResponse.success(data)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const p = new URL(req.url).searchParams
    const id = p.get('id') // This should be the auth_user_id
    const mode = p.get('mode') || 'soft' // 'soft' or 'hard'

    if (!id) return ApiResponse.error('ID required', 400)

    // Security: Only super-admins can hard delete
    if (mode === 'hard' && auth.role !== 'super_admin') {
      return ApiResponse.error('Only super-admins can permanently remove staff', 403)
    }

    if (mode === 'soft') {
      // 1. Deactivate in admin_users
      const { error: adminErr } = await supabaseAdmin
        .from('admin_users')
        .update({ is_active: false })
        .eq('auth_user_id', id)
      
      if (adminErr) throw adminErr

      // 2. Mark terminated in staff_profiles
      const { error: staffErr } = await supabaseAdmin
        .from('staff_profiles')
        .update({ employment_status: 'terminated' })
        .eq('auth_user_id', id)
      
      if (staffErr) throw staffErr

      return ApiResponse.success({ message: 'User deactivated (soft deleted)' })
    } else {
      // HARD DELETE
      // 1. Delete from staff_profiles (cascade might handle related docs)
      await supabaseAdmin.from('staff_profiles').delete().eq('auth_user_id', id)
      
      // 2. Delete from admin_users
      await supabaseAdmin.from('admin_users').delete().eq('auth_user_id', id)
      
      // 3. Delete from Auth
      const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(id)
      if (authErr) throw authErr

      return ApiResponse.success({ message: 'User permanently removed' })
    }

  } catch (err: any) {
    console.error('People delete error:', err)
    return ApiResponse.error(err.message, 500)
  }
}
