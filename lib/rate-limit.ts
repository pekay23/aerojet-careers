import 'server-only'
import { NextRequest } from 'next/server'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

// Cookie consent: 10 req/min per IP (write-only audit endpoint).
const CONSENT_MAX = 10
const CONSENT_WINDOW_MS = 60 * 1000

type RateLimitResult = { success: boolean; remaining: number }

const memoryStore = new Map<string, { count: number; resetAt: number }>()

function memoryLimit(identifier: string, max: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(identifier)

  if (!entry || entry.resetAt < now) {
    memoryStore.set(identifier, { count: 1, resetAt: now + windowMs })
    return { success: true, remaining: max - 1 }
  }

  if (entry.count >= max) {
    return { success: false, remaining: 0 }
  }

  entry.count += 1
  return { success: true, remaining: max - entry.count }
}

let upstashLimiter: { limit: (_id: string) => Promise<{ success: boolean; remaining: number }> } | null = null
let upstashInitAttempted = false

async function getUpstashLimiter() {
  if (upstashInitAttempted) return upstashLimiter
  upstashInitAttempted = true

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({ url, token })
    upstashLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(MAX_ATTEMPTS, '15 m'),
      prefix: 'ratelimit:careers:login',
    })
  } catch {
    upstashLimiter = null
  }
  return upstashLimiter
}

// Consent needs a different window (10 req/min) than the login limiter
// (5 req/15 min), so it gets its own Upstash instance rather than sharing.
let consentLimiter: { limit: (_id: string) => Promise<{ success: boolean; remaining: number }> } | null = null
let consentInitAttempted = false

async function getConsentLimiter() {
  if (consentInitAttempted) return consentLimiter
  consentInitAttempted = true

  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null

  try {
    const { Ratelimit } = await import('@upstash/ratelimit')
    const { Redis } = await import('@upstash/redis')
    const redis = new Redis({ url, token })
    consentLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(CONSENT_MAX, '1 m'),
      prefix: 'ratelimit:careers:consent',
    })
  } catch {
    consentLimiter = null
  }
  return consentLimiter
}

export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  const key = identifier.toLowerCase().trim()
  const limiter = await getUpstashLimiter()

  if (limiter) {
    const { success } = await limiter.limit(key)
    return { success, remaining: 0 }
  }

  return memoryLimit(key, MAX_ATTEMPTS, WINDOW_MS)
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for')
  if (xff) {
    const ip = xff.split(',')[0]?.trim()
    if (ip && /^[0-9a-fA-F:.]+$/.test(ip)) {
      return ip
    }
  }
  const xri = req.headers.get('x-real-ip')
  if (xri && /^[0-9a-fA-F:.]+$/.test(xri)) {
    return xri
  }
  return 'unknown'
}

export async function checkPublicRateLimit(req: NextRequest, action: string): Promise<RateLimitResult> {
  const ip = getClientIp(req)
  const key = `public:${action}:${ip.toLowerCase().trim()}`
  const limiter = await getUpstashLimiter()

  if (limiter) {
    const { success } = await limiter.limit(key)
    return { success, remaining: 0 }
  }

  if (process.env.NODE_ENV === 'production') {
    return { success: true, remaining: MAX_ATTEMPTS }
  }

  return memoryLimit(key, MAX_ATTEMPTS, WINDOW_MS)
}

/**
 * Cookie consent audit endpoint rate limit: 10 req/min per IP.
 *
 * Runs in every environment (including production) because the consent
 * endpoint is unauthenticated — without this a bot can spam the audit
 * table. Uses the shared memory store when Upstash is unavailable.
 */
export async function checkConsentRateLimit(req: NextRequest): Promise<RateLimitResult> {
  const ip = getClientIp(req)
  const key = `consent:${ip.toLowerCase().trim()}`
  const limiter = await getConsentLimiter()

  if (limiter) {
    const { success } = await limiter.limit(key)
    return { success, remaining: 0 }
  }

  return memoryLimit(key, CONSENT_MAX, CONSENT_WINDOW_MS)
}