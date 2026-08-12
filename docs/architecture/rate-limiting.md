# Rate Limiting

The portal uses **Upstash Redis** for rate limiting with an in-memory fallback.
Rate limiting is currently implemented on `/api/auth/login` only.

## Implementation

`lib/rate-limit.ts` exposes a `rateLimit(key, limit, window)` function:

```ts
const result = await rateLimit(`login:${email}`, 5, 15 * 60_000)
if (!result.ok) return ApiResponse.error('Too many attempts', 429)
```

- **Key:** typically `login:<email>` or `ip:<address>`
- **Limit:** max attempts
- **Window:** milliseconds (e.g. `15 * 60_000` = 15 minutes)

## Upstash Redis

Configured via environment variables:

- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`

Uses the Upstash REST API (`@upstash/ratelimit` + `@upstash/redis`).

## Memory fallback

When Upstash is unavailable, the module falls back to an in-memory `Map` with
TTL-based expiry. **This fallback is ineffective in production** (Vercel
serverless) because each function instance has isolated memory.

**Known gap:** rate limiting is missing on other public write endpoints:
- `/api/register`
- `/api/applications`
- `/api/upload/talent`

These should be rate-limited to prevent abuse.

## Current usage

- `lib/api-utils.ts` — `withPublicProtection()` applies login rate limiting
