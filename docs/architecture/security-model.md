# Security Model

Authentication and authorization are handled entirely in the application layer
(no Supabase Auth, no Row Level Security). There are three enforcement points.

## Session lifecycle

```
POST /api/auth/login
  → authenticate(email, password)          verify bcrypt hash in auth_users
  → signSession(user)                       sign JWT (jose, HS256, AUTH_SECRET)
  → Set-Cookie: aj_session=<jwt>            httpOnly, SameSite=Lax, 30-day maxAge
                                            Secure in production

GET  /api/auth/me                          decode cookie → user + admin_users row
POST /api/auth/logout                      clear the cookie
```

- Sessions are stateless: the JWT itself carries the user id/email, so no session
  table lookup is needed to validate a request.
- Rotating `AUTH_SECRET` invalidates every existing session (forces re-login).

## Layer 1 — edge route guard (`proxy.ts`)

Runs on the Edge runtime for every matched request. Verifies the `aj_session` JWT
using `jose.jwtVerify` (no DB / no `next/headers`, so it is edge-safe).

```
Request → proxy.ts
  → /admin/login is exempt → allow
  → not /admin/* and not /api/admin/* → allow
  → no valid JWT:
       /api/admin/*  → 401 JSON
       /admin/*      → redirect /admin/login?redirect=<path>
  → valid JWT → allow
```

Matcher: `['/admin/:path*', '/api/admin/:path*']`.

## Layer 2 — role checks (`verifyRole`)

API route handlers call `verifyRole([...])` from `lib/api-utils.ts`:

```ts
const auth = await verifyRole(['admin', 'hr_manager'])
if (!auth) return ApiResponse.error('Unauthorized', 403)
```

It resolves the session user, loads their `admin_users.role`, and returns
`{ user, role }` only if the role is allowed. `super_admin` bypasses all role checks.

### Role → capability

| Role | Typical access |
| --- | --- |
| `super_admin` | Everything, including hard-deletes of staff |
| `admin` | Full recruitment + people/HR management |
| `hr_manager` | Applications, hiring, people, transfers |
| `recruiter` | Applications + talent pool (soft-delete only) |
| `read_only` | View access |
| `employee` | Own profile (`/admin/my-info`) only |

Exact allow-lists are defined per route via the `verifyRole([...])` argument.

## Layer 3 — file access

`/api/files` and `/api/storage/upload` both call `getServerUser()` and reject
unauthenticated requests. Stored objects are never exposed via a public URL —
`getPublicUrl()` in the shims returns an internal `/api/files?...` link that still
passes through the session check. Every bucket holds private HR data (CVs, licence
scans, passports).

## Other measures

- **Input sanitisation** — `sanitizeSearch()` strips PostgREST/ILIKE special
  characters before building `or()` filters; the query builder always uses
  parameterised queries (`$1, $2, …`), never string interpolation of values.
- **HTML sanitization** — `lib/sanitize.ts` provides `sanitizeHtml()` (DOMPurify)
  and `escapeHtml()` for XSS prevention in any future rich-text features.
- **Security headers** — `/admin/*` sends `X-Frame-Options: DENY`,
  `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`
  (set in both `next.config.js` and `vercel.json`).
- **Rate limiting** — `/api/auth/login` is rate-limited via Upstash Redis
  (`lib/rate-limit.ts`); other public write endpoints should be added.
- **Structured logging** — `lib/logger.ts` provides JSON line logging with
  sensitive-key redaction (password, token, secret, etc.).
- **Secrets** — `DATABASE_URL` and `AUTH_SECRET` are server-only and must never be
  exposed to the browser; there is no RLS fallback if the connection string leaks.

## Refresh tokens

The session layer includes one-time-use refresh tokens stored in the
`refresh_tokens` table:

```
POST /api/auth/refresh
  → consumeRefreshToken(token)    DELETE from refresh_tokens, return user
  → signSession(user)             issue new JWT
  → issueRefreshToken(user.id)    INSERT new refresh token (30-day TTL)
```

- Tokens are single-use: consuming them deletes the row immediately.
- TTL is `SESSION_MAX_AGE * 30 / 7` days (configurable in `lib/refresh-token.ts`).
- Implemented in `lib/refresh-token.ts`; rotation happens automatically on
  `/api/auth/refresh`.
