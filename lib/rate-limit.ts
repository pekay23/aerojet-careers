import 'server-only'

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
