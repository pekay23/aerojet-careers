# Deployment Guide

The portal deploys to **Vercel** (framework auto-detected as Next.js, region `lhr1`
per `vercel.json`).

## Environment variables (Vercel → Project → Settings → Environment Variables)

Required in every environment (Production, Preview, Development):

| Key | Notes |
| --- | --- |
| `DATABASE_URL` | Neon pooled connection string. Server-only. |
| `DIRECT_URL` | Neon direct connection (for migrations). Server-only. |
| `AUTH_SECRET` | Random 48+ byte secret used to sign session JWTs. Server-only. Rotating it logs everyone out. |
| `NEXT_PUBLIC_APP_URL` | Public site URL, e.g. `https://careers.aerojet-aviation.com`. |
| `EMAIL_FROM` | Sender address for transactional emails. |
| `RESEND_API_KEY` | Resend API key. Server-only. |
| `UPSTASH_REDIS_REST_URL` | Optional: Upstash Redis for rate limiting. Server-only. |
| `UPSTASH_REDIS_REST_TOKEN` | Optional: Upstash Redis token. Server-only. |

Do **not** expose `DATABASE_URL`, `DIRECT_URL`, or `AUTH_SECRET` to the browser. Only `NEXT_PUBLIC_*` values are safe client-side.

## First deploy against a fresh Neon database

1. Set the env vars above in Vercel.
2. Apply the schema once (from your machine or the Neon SQL editor):
   ```bash
   bun scripts/apply-schema.mjs
   # or: psql "$DATABASE_URL" -f db/neon-schema.sql
   ```
3. Seed the admin:
   ```bash
   node scripts/seed-admin.mjs
   ```
4. Push to the deploy branch — Vercel runs `next build` automatically.

## Build

- Build command: `bun run build`.
- The build connects to Neon during static generation of a few pages (e.g. `/jobs`),
  so `DATABASE_URL` must be present at build time.
- `next.config.js` sends the `/admin/*` security headers.

## Domains & headers

- Security headers for `/admin/*` are defined in both `next.config.js` and `vercel.json`.
- The edge route guard (`proxy.ts`) is bundled automatically as Middleware/Proxy.

## Post-deploy smoke test

1. Visit `/jobs` — open roles render (public read path).
2. Visit `/admin/login`, sign in with the seeded admin — you should reach `/admin/dashboard`.
3. Hit `/api/admin/applications` while logged out — expect `401`.
