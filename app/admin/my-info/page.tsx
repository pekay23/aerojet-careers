import AdminLayout from '@/components/admin/AdminLayout'
import StaffProfileView from '@/components/admin/StaffProfileView'
import { createSupabaseServer } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'My Info | Aerojet Staff Portal',
}

export default async function MyInfoPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/admin/login')
  }

    // Fetch admin access details
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('id, role, is_active, full_name, created_at')
      .eq('auth_user_id', user.id)
      .single()

    // Fetch detailed profile data
    const { data: profile } = await supabase
      .from('staff_profiles')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle()

  const member = {
    id: adminUser?.id,
    staff_profile_id: profile?.id,
    role: adminUser?.role,
    status: adminUser?.is_active ? 'active' : 'inactive',
    ...profile,
    full_name: profile && profile.first_name ? `${profile.first_name} ${profile.last_name || ''}`.trim() : adminUser?.full_name || user.email?.split('@')[0],
    personal_email: profile?.email,
    phone_number: profile?.phone,
    profile_photo_url: profile?.avatar_url,
    hire_date: profile?.joined_at,
    created_at: profile?.created_at || adminUser?.created_at || new Date().toISOString()
  }

  return (
    <AdminLayout title="My Information">
      <StaffProfileView member={member} isOwnProfile={true} />
    </AdminLayout>
  )
}
