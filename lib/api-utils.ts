import { NextResponse } from 'next/server'
import { createSupabaseServer } from './supabase-server'
import { supabaseAdmin } from './supabase-admin'

/**
 * Standardized API Response Helper
 */
export class ApiResponse {
  static success(data?: any, status: number = 200) {
    return NextResponse.json({ success: true, data }, { status })
  }

  static error(message: string, status: number = 400) {
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

/**
 * Security Auth Guard for RBAC
 * @param allowedRoles List of roles permitted to access the route
   * @returns Object containing user, role, and adminUserId if authorized, otherwise null
   */
  export async function verifyRole(allowedRoles: string[]) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!adminUser) return null

    // super_admin bypasses all role checks
    if (adminUser.role === 'super_admin' || allowedRoles.includes(adminUser.role)) {
      return { user, role: adminUser.role, adminUserId: adminUser.id }
    }

    return null
  }

/**
 * Input cleaning — trims whitespace from string inputs.
 */
export function cleanInput(s: any) {
  if (typeof s !== 'string') return s
  return s.trim()
}

/**
 * Sanitize search input for use in PostgREST .or() / .ilike() filters.
 * Strips characters that have special meaning in PostgREST filter expressions.
 */
export function sanitizeSearch(s: string): string {
  return s.replace(/[%_(),.\\]/g, '').trim()
}
