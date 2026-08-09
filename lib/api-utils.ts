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

    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (!adminUser) return null

    // super_admin bypasses all role checks
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
 * (e.g. overwriting created_by, id, ref_code).
 */
export const ALLOWED_UPDATE_KEYS = [
  'title',
  'slug',
  'department',
  'category',
  'employment_type',
  'location',
  'status',
  'target_count',
  'open_positions',
  'indefinite_deadline',
  'summary',
  'responsibilities',
  'requirements',
  'what_we_offer',
  'salary_range_min',
  'salary_range_max',
  'tags',
  'closes_at',
  'published_at',
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
