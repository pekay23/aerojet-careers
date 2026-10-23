import { NextRequest, NextResponse } from 'next/server'
import { getServerUser } from './auth'
import { pool } from './db'
import { checkPublicRateLimit } from './rate-limit'
import { logger } from './logger'

/**
 * Standardized API Response Helper
 */
export class ApiResponse {
  static success(data?: any, status: number = 200, headers: Record<string, string> = {}) {
    return NextResponse.json({ success: true, data }, { status, headers })
  }

  static error(message: string, status: number = 400, headers: Record<string, string> = {}) {
    return NextResponse.json({ success: false, error: message }, { status, headers })
  }
}

/**
 * Validates that the request Origin matches the application URL.
 * Blocks simple CSRF attacks on state-changing endpoints.
 */
export function validateOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin')
  const referer = req.headers.get('referer')
  const host = req.headers.get('host')
  if (!host) return false

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `https://${host}`
  const appOrigin = new URL(appUrl).origin

  const isDev = process.env.NODE_ENV !== 'production'

  if (origin && origin !== appOrigin) {
    if (isDev) {
      try {
        const originUrl = new URL(origin)
        const hostUrl = new URL(`http://${host}`)
        if (originUrl.hostname === hostUrl.hostname) return true
      } catch { /* ignore parse errors */ }
    }
    return false
  }
  if (!origin && referer && !referer.startsWith(appOrigin)) {
    if (isDev) {
      try {
        const refererUrl = new URL(referer)
        const hostUrl = new URL(`http://${host}`)
        if (refererUrl.hostname === hostUrl.hostname) return true
      } catch { /* ignore parse errors */ }
    }
    return false
  }
  return true
}

/**
 * Applies rate limiting + CSRF origin check for public write endpoints.
 */
export async function withPublicProtection(req: NextRequest, action: string) {
  const rl = await checkPublicRateLimit(req, action)
  if (!rl.success) {
    return { blocked: true as const, response: NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 }) }
  }
  if (!validateOrigin(req)) {
    return { blocked: true as const, response: NextResponse.json({ error: 'Invalid request origin' }, { status: 403 }) }
  }
  return { blocked: false as const }
}

/**
 * Security Auth Guard for RBAC
 * @param allowedRoles List of roles permitted to access the route
 * @param req Optional NextRequest for CSRF origin validation
 * @returns Object containing user, role, and adminUserId if authorized, otherwise null
 */
    export async function verifyRole(allowedRoles: string[] | null = null, req?: NextRequest) {
    if (req && !validateOrigin(req)) {
      return null
    }

    const user = await getServerUser()
    if (!user) return null

    let admin: { id: string; role: string; is_active: boolean } | null = null
    try {
      const res = await pool.query(
        'SELECT id, role, is_active FROM admin_users WHERE auth_user_id = $1 LIMIT 1',
        [user.id]
      )
      admin = res.rows[0] ?? null
    } catch {
      return null
    }

    if (!admin) return null
    if (!admin.is_active) return null

    if (admin.role === 'super_admin' || (allowedRoles && allowedRoles.includes(admin.role))) {
      return { user, role: admin.role, adminUserId: admin.id }
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
 * Sanitizes error messages for API responses.
 * Returns a generic message and logs the original error server-side.
 */
const NODE_NETWORK_CODES = new Set([
  'ECONNREFUSED', 'ENOTFOUND', 'ETIMEDOUT', 'ECONNRESET', 'EPIPE', 'EAI_AGAIN',
  'EHOSTUNREACH', 'ENETUNREACH', 'ECONNABORTED', 'EPROTO',
])
const SQLSTATE_RE = /^[0-9A-Z]{5}$/

const DRIVER_PATTERNS: RegExp[] = [
  /ECONNREFUSED/i,
  /ENOTFOUND/i,
  /ETIMEDOUT/i,
  /connection refused/i,
  /connection reset/i,
  /password authentication failed/i,
  /the database system is (starting up|shutting down|in recovery mode)/i,
  /terminating connection/i,
  /too many connections/i,
  /connect /i,
  /SSL/i,
  /pool\.query/i,
]

function isDriverError(err: unknown): boolean {
  if (err && typeof err === 'object') {
    const code = (err as { code?: unknown }).code
    if (typeof code === 'string') {
      if (NODE_NETWORK_CODES.has(code) || SQLSTATE_RE.test(code)) return true
    }
  }
  if (err instanceof Error) {
    return DRIVER_PATTERNS.some((re) => re.test(err.message))
  }
  if (typeof err === 'object' && err !== null) {
    const msg = (err as { message?: unknown; error?: unknown }).message ?? (err as { error?: unknown }).error
    if (typeof msg === 'string') return DRIVER_PATTERNS.some((re) => re.test(msg))
  }
  return false
}

function redact(s: string): string {
  return s
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@[^\s]+/gi, '[redacted]')
    .replace(/(?:password|user|host|port|database|dbname)\s*=\s*[^\s&]+/gi, '[redacted]')
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(?::\d+)?\b/g, '[redacted]')
    .replace(/\b[a-z0-9.-]+\.(?:com|net|org|io|co|dev|internal)(?::\d+)?\b/gi, (m) => m.includes(':') ? '[redacted]' : m)
    .replace(/\b(?:\w[\w.-]*):\d{2,5}\b/g, '[redacted]')
    .replace(/(?:user|role)\s+"[^"]*"/gi, '[redacted]')
}

export function sanitizeErrorMessage(err: unknown): string {
  if (typeof err === 'string') {
    logger.error('API error', { error: err })
    return redact(err) || 'Internal server error'
  }
  if (err instanceof Error) {
    logger.error('API error', { message: err.message, stack: err.stack })
    if (isDriverError(err)) return 'Internal server error'
    return redact(err.message) || 'Internal server error'
  }
  if (err && typeof err === 'object') {
    const obj = err as Record<string, unknown>
    const msg = typeof obj.message === 'string' ? obj.message : typeof obj.error === 'string' ? obj.error : null
    logger.error('API error', { details: msg ?? err })
    if (isDriverError(err)) return 'Internal server error'
    if (msg) return redact(msg) || 'Internal server error'
    return 'Internal server error'
  }
  logger.error('API error', { error: String(err) })
  return 'Internal server error'
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
 * Allow-list of keys that the PATCH /api/admin/applications endpoint will accept.
 */
export const ALLOWED_APPLICATION_UPDATE_KEYS = [
  'status',
  'priority',
  'assigned_to',
  'recruiter_notes',
  'rejection_reason',
  'hr_transferred',
  'hr_employee_id',
  'reviewed_at',
  'shortlisted_at',
  'hired_at',
  'deleted_at',
  'updated_at',
]

/**
 * Strips disallowed keys from an application-update payload.
 */
export function sanitizeApplicationUpdate(raw: Record<string, unknown>): Record<string, unknown> {
  const safe: Record<string, unknown> = {}
  for (const key of ALLOWED_APPLICATION_UPDATE_KEYS) {
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
