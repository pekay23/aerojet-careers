# Developer Handover

Onboarding notes for anyone taking over the Aerojet Careers portal.

## Technical stack

- **Framework:** Next.js 16 (App Router), React 19, TypeScript
- **Database:** PostgreSQL (**Neon** primary)
- **Data access:** custom Supabase-compatible query builder (`lib/db.ts`) — no ORM
- **Auth:** local bcrypt + JWT session cookie (`lib/auth.ts`), refresh tokens (`lib/refresh-token.ts`), no external auth provider
- **Storage:** files in a `storage_objects` table, served via `/api/files`
- **Styling:** Tailwind CSS 4 + design tokens in `app/globals.css` + Radix primitives
- **Email:** Resend (`lib/email-service.ts`)
- **Hosting:** Vercel (region `lhr1`)
- **Logging:** Structured JSON logging (`lib/logger.ts`)
- **Rate limiting:** Upstash Redis + memory fallback (`lib/rate-limit.ts`)

## The most important thing to understand

This project was migrated off Supabase. Rather than rewrite ~30 routes, the three
Supabase client objects are now **Neon-backed compatibility shims** that keep the
old `supabase-js` surface:

| File | Replaces | Backed by |
| --- | --- | --- |
| `lib/supabase-admin.ts` | service-role client | `lib/db.ts`, `lib/auth-admin.ts`, `lib/storage-compat.ts` |
| `lib/supabase-server.ts` | server SSR client | `lib/db.ts`, `lib/auth.ts` |
| `lib/supabase.ts` | browser client | `/api/auth/*`, `/api/storage/upload`, `/api/files` |

So when you see `supabaseAdmin.from('applications').select(...)`, it is **not** talking
to Supabase — it runs SQL against Neon through the query builder. Full details in the
[Neon migration guide](./neon-migration.md).

## Where things live

```
lib/
  db.ts              Neon pool + Supabase-style query builder (the core)
  auth.ts            bcrypt hashing, JWT sign/verify, getServerUser()
  auth-admin.ts      create/update/delete auth_users
  refresh-token.ts   one-time-use refresh token lifecycle
  storage.ts         low-level storage_objects read/write
  storage-compat.ts  supabase.storage-shaped wrapper over storage.ts
  supabase*.ts       the three compat shims
  api-utils.ts       ApiResponse + verifyRole (authorization)
  email-service.ts   Resend templates (welcome, acknowledgement)
  sanitize.ts        DOMPurify HTML sanitization + escapeHtml
  rate-limit.ts      Upstash Redis rate limiting
  logger.ts          Structured JSON logging with redaction
  domain-config.ts   Domain URLs + internal link lists

proxy.ts             edge route guard (JWT cookie check)
db/neon-schema.sql   full schema
scripts/seed-admin.mjs  seeds the first admin into Neon

app/
  (public)/          legal pages, faq, our-story, check-status
  (root routes)      public careers site (jobs, apply, register, programs, login)
  admin/             authenticated HR/admin portal
  api/               REST API

components/
  admin/             portal UI (PeopleDirectory, PipelineView, OrgChart, …)
  forms/             13 reusable form components (TextInput, Select, CheckItem, …)
  layout/ ui/        site chrome + shared primitives (Skeleton, ConfirmDialog, …)
```

## Common tasks

### Add an admin API route
1. Create `app/api/admin/<name>/route.ts`.
2. Start each handler with `const auth = await verifyRole([...]); if (!auth) return ApiResponse.error('Unauthorized', 403)`.
3. Query with `supabaseAdmin.from('<table>')...` and return `ApiResponse.success(data)`.

### Add a table / column
1. Edit `db/neon-schema.sql` (keep it idempotent).
2. Apply it: `psql "$DATABASE_URL" -f db/neon-schema.sql`.
3. If you add a new relational embed, add a rule to `resolveRelationship()` in `lib/db.ts`.

### Reset / add an admin
```bash
SEED_ADMIN_EMAIL=you@example.com SEED_ADMIN_PASSWORD='Secret@2026' node seed-admin.js
```

## Known constraints / gotchas

- **No RLS.** All security is app-layer (`proxy.ts` + `verifyRole`). Never leak `DATABASE_URL`.
- **Query builder is a subset.** It supports what the app uses (`eq/neq/in/ilike/or/contains/range`,
  embeds, `count`, `upsert`). If you need an unsupported operator, extend `lib/db.ts`
  rather than reaching for raw SQL scattered across routes (use the exported `query()` helper for one-offs).
- **Supabase passwords can't be imported** (different hashing, not exportable) — migrated
  users need a reset. See the migration guide.
- **`AUTH_SECRET` rotation logs everyone out.**
- **Build hits the DB** during static generation of `/jobs`, so `DATABASE_URL` must be set at build time.

## Verifying a change

```bash
bun run type-check   # tsc --noEmit
bun run build        # next build (also type-checks + static-generates)
```

Both should pass clean before shipping.
