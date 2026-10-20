import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole, sanitizeErrorMessage } from '@/lib/api-utils'

export async function GET(_req: NextRequest) {
  try {
    const auth = await verifyRole(['admin'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('setting_key, setting_value, updated_by, updated_at')
      .order('setting_key')

    if (error) throw error
    return ApiResponse.success(settings)
  } catch (err) {
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const body = await req.json()
    const { settings } = body // Expected: Array of { key: string, value: string }

    if (!Array.isArray(settings)) {
      return ApiResponse.error('Invalid settings format. Expected an array.', 400)
    }

    const updates = settings.map(s => ({
      setting_key: s.key,
      setting_value: s.value,
      updated_by: auth.user.id,
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabaseAdmin
      .from('system_settings')
      .upsert(updates, { onConflict: 'setting_key' })
      .select()

    if (error) throw error

     const { data: adminRow } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('auth_user_id', auth.user.id)
      .maybeSingle()

    // Log the configuration update in the audit trail
    await supabaseAdmin.from('pipeline_events').insert({
      event_type:    'system_update',
      note:          `Configuration updated by ${auth.user.email} (${settings.length} parameters)`,
      admin_user_id: adminRow?.id
    })

    return ApiResponse.success(data)
  } catch (err) {
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}
