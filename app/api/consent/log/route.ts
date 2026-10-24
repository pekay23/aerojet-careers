import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sanitizeErrorMessage } from '@/lib/api-utils'
import { checkConsentRateLimit } from '@/lib/rate-limit'

// ── Schema ──────────────────────────────────────────────────────────────────
// `necessary` is always true (per GDPR — it is not a choice the user makes).
// `targeting` is fixed false for this portal (no ads). Both are validated to
// be present so a client cannot smuggle an unexpected shape through.
const ConsentLogSchema = z.object({
  categories: z.object({
    necessary: z.literal(true, { message: 'necessary must be true' }),
    analytics: z.boolean(),
    functional: z.boolean(),
    targeting: z.literal(false, { message: 'targeting must be false' }),
  }),
  timestamp: z.string().refine(
    (s) => !Number.isNaN(Date.parse(s)),
    { message: 'timestamp must be a valid ISO date string' }
  ),
  userAgent: z.string().max(1024).optional(),
  ip: z.string().max(45).optional(), // 45 = max IPv6 length
})

// ── IP hashing (PII minimisation) ───────────────────────────────────────────
// Hash rather than store: audit needs a correlation key, not the raw address.
// NOTE: This relies on the deployment being behind a trusted proxy (e.g., Vercel,
// Cloudflare) that sets `x-forwarded-for` and `x-real-ip` correctly. In
// untrusted environments these headers can be spoofed. If deploying outside
// a trusted proxy, add explicit proxy validation or use platform-specific IP
// resolution (e.g., `req.ip` on Express, `req.headers['x-forwarded-for']`
// with known proxy IPs).
async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip)
  const buf = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, 16) // 16 hex chars = 64 bits, enough to avoid collisions
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const ip = xff.split(',')[0]?.trim()
    if (ip && /^[0-9a-fA-F:.]+$/.test(ip)) return ip
  }
  const xri = req.headers.get('x-real-ip')
  if (xri && /^[0-9a-fA-F:.]+$/.test(xri)) return xri
  return ''
}

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 req/min per IP (consent endpoint is write-only, so this
    // is enforced before any parsing work).
    const rl = await checkConsentRateLimit(req)
    if (!rl.success) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const parsed = ConsentLogSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed: ' +
            parsed.error.issues.map((i) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
        },
        { status: 400 }
      )
    }

    const v = parsed.data
    const ipRaw = v.ip || getClientIp(req)
    const ipHash = ipRaw ? await hashIp(ipRaw) : null

    const { error } = await supabaseAdmin
      .from('cookie_consent_log')
      .insert({
        categories: v.categories,
        timestamp: v.timestamp,
        user_agent: v.userAgent || null,
        ip_hash: ipHash,
      })
      .select()
      .single()

    if (error) {
      console.error('[consent] insert error:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to record consent' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    console.error('[consent] handler error:', err)
    return NextResponse.json(
      { success: false, error: sanitizeErrorMessage(err) },
      { status: 500 }
    )
  }
}