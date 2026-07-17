import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    // Fetch all staff with their profiles and reporting lines
    const { data: staff, error } = await supabaseAdmin
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
          reporting_manager_id,
          avatar_url
        )
      `)
      .eq('is_active', true)

    if (error) throw error

    // Transform data for React Flow
    // Nodes: Each staff member
    // Edges: reporting_manager_id relationship
    const nodes = staff.map((member: any) => {
      const profile = member.staff_profiles?.[0] || {}
      return {
        id: member.auth_user_id,
        type: 'staffNode',
        data: {
          name: member.full_name,
          title: profile.job_title || 'Staff Member',
          department: profile.department || 'General',
          email: member.email,
          avatar: profile.avatar_url,
          role: member.role
        },
        position: { x: 0, y: 0 } // Positioned by the frontend layout engine
      }
    })

    const edges = staff
      .filter((member: any) => member.staff_profiles?.[0]?.reporting_manager_id)
      .map((member: any) => ({
        id: `e-${member.staff_profiles[0].reporting_manager_id}-${member.auth_user_id}`,
        source: member.staff_profiles[0].reporting_manager_id,
        target: member.auth_user_id,
        type: 'smoothstep',
        animated: true
      }))

    return ApiResponse.success({ nodes, edges })
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { staffId, reportsTo } = await req.json()
    
    if (!staffId) return ApiResponse.error('staffId required', 400)

    // Update the reporting relationship
    const { error } = await supabaseAdmin
      .from('staff_profiles')
      .update({ reporting_manager_id: reportsTo || null })
      .eq('auth_user_id', staffId)

    if (error) throw error

    return ApiResponse.success({ message: 'Reporting structure updated' })
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
