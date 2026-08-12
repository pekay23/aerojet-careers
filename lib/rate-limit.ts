import 'server-only'
import { NextRequest } from 'next/server'

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000

type RateLimitResult = { success: boolean; remaining: number }

const memoryStore = new Map<string, { count: number; resetAt: number }>()

function memoryLimit(identifier: string): RateLimitResult {
  const now = Date.now()
  const entry = memoryStore.get(identifier)

  if (!entry || entry.resetAt < now) {
    memoryStore.set(identifier, { count: 1, resetAt: now + WINDOW_MS })
    return { success: true, remaining: MAX_ATTEMPTS - 1 }
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { success: false, remaining: 0 }
  }

  entry.count += 1
  return { success: true, remaining: MAX_ATTEMPTS - entry.count }
}

let upstashLimiter: { limit: (id: string) => Promise<{ success: boolean; remaining: number }> } | null = null
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

export async function checkLoginRateLimit(identifier: string): Promise<RateLimitResult> {
  const key = identifier.toLowerCase().trim()
  const limiter = await getUpstashLimiter()

  if (limiter) {
  const { success } = await limiter.limit(key)
  return { success, remaining: 0 }
  }

  return memoryLimit(key)
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

  return memoryLimit(key)
}
