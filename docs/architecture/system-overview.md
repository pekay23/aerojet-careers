# System Architecture Overview

## Stack

- **Frontend:** Next.js 16 App Router (React Server Components), React 19, Tailwind CSS v4, shadcn/ui + Radix, Framer Motion
- **Backend:** Next.js API routes (serverless)
- **Database:** PostgreSQL (**Neon**, primary) via `pg` Pool; **Supabase** retained as a secondary/backup source for a one-time data migration
- **Query layer:** a Supabase-compatible query builder (`lib/db.ts`) so existing `.from().select()...` call-sites work unchanged against plain Postgres
- **Auth:** local bcrypt password hashing + JWT session in an httpOnly cookie (`lib/auth.ts`) — replaced Supabase Auth
- **Files:** `storage_objects` table (BYTEA), served through `/api/files` — replaced Supabase Storage
- **Email:** Resend
- **Hosting:** Vercel (region `lhr1`) with edge `proxy.ts` (Next 16 replacement for `middleware.ts`)

## Route layout

The public marketing/careers site and the authenticated admin portal live under
the same App Router tree.

```
app/(public)/     → Legal pages (privacy, terms, cookies)
app/              → Public careers site (home, jobs, apply/[slug], register,
                    graduate-program, skilled-training)
app/admin/        → Authenticated HR/admin portal (dashboard, applications, jobs,
                    talent, people, organization, documents, settings, my-info)
app/api/          → REST API (auth, admin/*, public applications, uploads, files)
```

## Auth enforcement (three layers)

1. **Edge proxy** at `proxy.ts` — verifies the JWT session cookie (`aj_session`) for
   every `/admin/*` page and `/api/admin/*` route. Unauthenticated users are
   redirected to `/admin/login?redirect=…` (pages) or get 401 JSON (API). The
   `/admin/login` page itself is exempt.
2. **API role checks** — route handlers call `verifyRole([...])` from
   `lib/api-utils.ts`, which resolves the session user, looks up their
   `admin_users.role`, and allows/denies (with `super_admin` bypassing all checks).
3. **File access** — `/api/files` re-checks the session before serving any stored
   object, since every bucket holds private HR data.

A missed check in any one layer is caught by the next.

## Neon-backed compatibility shims

To migrate off Supabase without rewriting ~30 API routes and components, the three
Supabase client objects were re-implemented against Neon while keeping their
original surface:

- `lib/supabase-admin.ts` — `supabaseAdmin.from()` / `.storage` / `.auth.admin.*` (service-role equivalent)
- `lib/supabase-server.ts` — `createSupabaseServer()` with `.auth.getUser()` + `.from()`
- `lib/supabase.ts` — the browser client; routes auth/storage calls through `/api/auth/*` and `/api/storage/upload`

All three delegate to `lib/db.ts` (query builder), `lib/auth.ts` (sessions), and
`lib/storage.ts` (files).

## Key design decisions

1. **Compatibility shims over a rewrite** — the query builder mimics the subset of
   the supabase-js/PostgREST API the app uses (`eq/neq/in/ilike/or/contains/range`,
   nested embeds, `count`, `upsert`), so call-sites stayed intact.
2. **Stateless JWT sessions** — signed with `AUTH_SECRET` (jose, HS256), stored in an
   httpOnly cookie; verifiable at the edge without a DB round-trip.
3. **App-layer authorization** — Neon has no Row Level Security, so access control is
   enforced entirely by `proxy.ts` + `verifyRole`. The `DATABASE_URL` must never reach
   the browser.
4. **Files in Postgres** — small HR documents are stored as BYTEA and gated behind a
   session-checked route rather than a public CDN URL.
5. **Neon primary, Supabase secondary** — Supabase stays as a backup so its data can be
   exported into Neon once it is unpaused (see the [Neon migration guide](../guides/neon-migration.md)).
