import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getServerUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

export async function PATCH(req: NextRequest) {
  try {
    // Identify the user from the JWT session cookie
    const user = await getServerUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }


    const updates = await req.json()
    
    // Safety: Only allow updating specific fields in staff_profiles
    const allowedFields = [
      'first_name', 
      'last_name', 
      'phone', 
      'date_of_birth',
      'avatar_url',
      'bio'
    ]
    
    const filteredUpdates: Record<string, any> = {}
    Object.keys(updates).forEach(key => {
      if (allowedFields.includes(key)) {
        // Transform empty strings to null for nullable database columns
        if (updates[key] === '') {
          filteredUpdates[key] = null
        } else {
          filteredUpdates[key] = updates[key]
        }
      }
    })

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // 1. Try to fetch existing profile
    const { data: existingProfile } = await supabaseAdmin
      .from('staff_profiles')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    let result;

    if (existingProfile) {
      // Update existing
      result = await supabaseAdmin
        .from('staff_profiles')
        .update({ ...filteredUpdates, updated_at: new Date().toISOString() })
        .eq('auth_user_id', user.id)
        .select()
        .single()
    } else {
      // Insert new stub profile (using details from updates + auth user)
      result = await supabaseAdmin
        .from('staff_profiles')
        .insert({
          ...filteredUpdates,
          auth_user_id: user.id,
          email: user.email!,
          job_title: 'Staff Member',
          department: 'General Operations',
          employment_status: 'active'
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Profile DB error:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    const data = result.data

    // Also update Auth user metadata if name changed
    if (filteredUpdates.first_name || filteredUpdates.last_name) {
      const fullName = `${data.first_name || ''} ${data.last_name || ''}`.trim()
      
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: { full_name: fullName }
      })
      
      // Also update admin_users record
      await supabaseAdmin
        .from('admin_users')
        .update({ full_name: fullName })
        .eq('auth_user_id', user.id)
    }

    // 4. Force revalidation of admin pages
    revalidatePath('/admin', 'layout')
    revalidatePath('/admin/my-info')
    revalidatePath('/admin/people')

    return NextResponse.json({ success: true, data })

  } catch (err: any) {
    console.error('Profile update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
