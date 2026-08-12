# Troubleshooting

Common issues and how to resolve them.

## Build failures

### TypeScript errors

```bash
bun run type-check
```

Common causes:
- Missing env vars at build time (e.g. `DATABASE_URL` for static generation)
- Stale `.next/` cache — delete and rebuild

### ESLint errors

```bash
bun run lint
```

Pre-existing warnings are expected in admin components. New errors must be
fixed before commit.

### Production build fails on static generation

Some pages (`/jobs`, `/register`) fetch data at build time. Ensure `DATABASE_URL`
is set in your local `.env.local` and in Vercel production/preview environments.

## Database issues

### Connection refused / SSL error

- Verify `DATABASE_URL` and `DIRECT_URL` are correct
- Neon requires `sslmode=require` (already in connection strings)
- Check Neon console for connection limits

### Schema not applied

```bash
bun scripts/apply-schema.mjs
```

The schema is idempotent — safe to re-run.

### Missing admin user

```bash
node scripts/seed-admin.mjs
```

Defaults: `admin@aerojet-aviation.com` / `Admin@2026`

## Auth issues

### Session not persisting

- Check `AUTH_SECRET` is set and consistent across deployments
- Verify cookie settings: `httpOnly`, `SameSite=Lax`, `Secure` in production
- Rotating `AUTH_SECRET` invalidates all sessions

### Refresh token 401

- Refresh tokens are single-use; if consumed twice, the user must re-login
- Check `refresh_tokens` table for expiry

### Login rate limited

- Default: 5 attempts per 15 minutes per email
- If using shared dev IP, memory fallback may block all users — restart dev server

## File upload issues

### Upload returns 413

- Max file size is 5 MB
- Check `storage_objects.size` for existing files

### File not found after upload

- Verify `storage_objects` has the row (`SELECT * FROM storage_objects WHERE bucket = ? AND path = ?`)
- Check `/api/files` auth — user must have a valid session

## Email issues

### Emails not sending

- Verify `RESEND_API_KEY` is set in Vercel (not just `.env.local`)
- Check Resend dashboard for delivery status
- Email failures are logged to `email_logs`

### Acknowledgment not sent

- Check `/api/email/acknowledge` logs
- Application is still created even if email fails (non-blocking)

## Vercel deployment

### Build succeeds but site shows 500

- Check Vercel function logs for runtime errors
- Most common cause: missing env vars in Vercel dashboard

### Region mismatch

- Portal is configured for `lhr1` (London)
- Set in `vercel.json` → regions

### Security headers missing

- Headers are set in both `next.config.js` and `vercel.json`
- `/admin/*` routes should have `X-Frame-Options: DENY`

## Logs

### Structured logs

JSON logs are emitted via `lib/logger.ts`. In Vercel, view logs in the
dashboard or with `vercel logs <deployment>`.

### Sensitive data

The logger automatically redacts keys named `password`, `token`, `secret`,
`api_key`, `authorization`, `cookie`.

## Debug commands

```bash
# Check DB connection
node scripts/check-db.mjs

# Audit document storage
node scripts/audit-documents.mjs

# Verify documents route
node scripts/verify-documents-route.mjs

# Build docs HTML
bun run docs:html
```
