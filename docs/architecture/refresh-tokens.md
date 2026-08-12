# Refresh Tokens

The portal uses one-time-use refresh tokens to rotate JWT sessions without
forcing the user to re-authenticate. Refresh tokens are stored server-side in
the `refresh_tokens` table and are invalidated immediately on use.

## Lifecycle

```
Login (POST /api/auth/login)
  → authenticate(email, password)
  → signSession(user)           // sets aj_session cookie (30 days)
  → issueRefreshToken(user.id)  // INSERT refresh_tokens row (30-day TTL)

Refresh (POST /api/auth/refresh)
  → consumeRefreshToken(token)  // SELECT + DELETE from refresh_tokens
  → signSession(user)           // new JWT
  → issueRefreshToken(user.id)  // INSERT new refresh_tokens row
```

## TTL

The refresh token TTL is `SESSION_MAX_AGE * 30 / 7` days (configurable in
`lib/refresh-token.ts`). By default this is ~30 days.

## One-time-use pattern

`consumeRefreshToken()` deletes the token row immediately after reading it.
If the client replays the same token, the lookup returns `null` and the refresh
fails with `401`. The user must log in again.

## Implementation

- **Table:** `refresh_tokens` (`token`, `auth_user_id`, `expires_at`)
- **Module:** `lib/refresh-token.ts`
  - `issueRefreshToken(userId)` — generates a 64-char hex token and inserts it
  - `consumeRefreshToken(token)` — returns the user or `{ user: null, error }`
  - `revokeRefreshToken(token)` — deletes a token (logout)
- **Route:** `app/api/auth/refresh/route.ts` — public endpoint that rotates the
  token and sets a new `aj_session` cookie

## Security notes

- Refresh tokens are single-use; replay attacks are impossible after the first use.
- Expired tokens are rejected by the `expires_at` check.
- The `aj_session` cookie is `httpOnly`, `SameSite=Lax`, and `Secure` in production.
- Rotating `AUTH_SECRET` invalidates all existing JWT sessions but does not
  affect refresh tokens.
