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
    export async function verifyRole(allowedRoles: string[] | null = null) {
    const supabase = await createSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    let { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id, role, is_active')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!adminUser) {
      const { data: authUser, error: authError } = await supabaseAdmin
        .from('auth_users')
        .select('email, user_metadata')
        .eq('id', user.id)
        .maybeSingle()

      if (authError || !authUser) return null

      const role = (authUser.user_metadata?.role as string) || 'admin'
      const fullName = authUser.user_metadata?.full_name || authUser.email.split('@')[0]

      const { data: provisioned, error: provisionError } = await supabaseAdmin
        .from('admin_users')
        .insert({
          auth_user_id: user.id,
          email: authUser.email,
          full_name: fullName,
          role,
          is_active: true,
        })
        .select('id, role, is_active')
        .maybeSingle()

      if (provisionError || !provisioned) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[verifyRole] Auto-provisioning admin_users failed:', provisionError?.message)
        }
        return null
      }

      adminUser = provisioned
    }

    if (!adminUser.is_active) return null

    if (adminUser.role === 'super_admin' || (allowedRoles && allowedRoles.includes(adminUser.role))) {
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

/**
 * Allow-list of keys that the PATCH /api/admin/jobs endpoint will accept.
 * Anything not in this list is stripped — prevents privilege escalation
 * (e.g. overwriting created_by, id, slug).
 */
export const ALLOWED_UPDATE_KEYS = [
  'title',
  'ref_code',
  'department',
  'category',
  'employment_type',
  'location',
  'status',
  'target_count',
  'summary',
  'responsibilities',
  'requirements',
  'what_we_offer',
  'salary_range_min',
  'salary_range_max',
  'tags',
  'closes_at',
  'published_at',
  'updated_at',
]

/**
 * Strips disallowed keys from a job-update payload.
 * Always returns a fresh object with only allow-listed fields.
 */
export function sanitizeJobUpdate(raw: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {}
  for (const key of ALLOWED_UPDATE_KEYS) {
    if (key in raw) safe[key] = raw[key]
  }
  return safe
}

/**
 * Validate that a docType is in the allowed set (blocks path traversal)
 * and that the given IDs are valid UUIDs.
 * Returns an error message string, or null if everything is OK.
 */
export function validatePathTraversal(
  docType: string,
  applicationId?: string,
  talentPoolId?: string
): string | null {
  const allowedDocTypes = ['cv', 'licence_scan', 'passport_scan', 'other']
  if (!docType || !allowedDocTypes.includes(docType)) {
    return 'Invalid document type'
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  if (applicationId && !uuidRegex.test(applicationId)) {
    return 'Invalid application ID'
  }

  if (talentPoolId && !uuidRegex.test(talentPoolId)) {
    return 'Invalid talent pool ID'
  }

  return null
}
