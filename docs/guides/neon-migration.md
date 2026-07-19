# Neon Migration Runbook

This project was migrated off Supabase (Auth + Postgres + Storage) onto a plain
**Neon** PostgreSQL database. Auth and file storage are now handled inside the
app instead of by Supabase services. Neon is the **primary**; the paused Supabase
project is kept as a **secondary/backup** so its data can be copied into Neon once
it is unpaused.

## What changed

| Concern | Before (Supabase) | After (Neon) |
| --- | --- | --- |
| Database | Supabase Postgres + PostgREST | Neon Postgres via `pg` |
| Query API | `supabase-js` query builder | Compatible shim in `lib/db.ts` |
| Auth | Supabase Auth (`auth.users`) | `auth_users` table + bcrypt + JWT cookie (`lib/auth.ts`) |
| Sessions | Supabase cookies | Signed JWT in `aj_session` httpOnly cookie |
| Storage | Supabase Storage buckets | `storage_objects` table, served via `/api/files` |
| Route guard | middleware + Supabase session | `proxy.ts` verifies the JWT cookie |

The `supabaseAdmin`, `createSupabaseServer`, and browser `supabase` objects were
kept as **Neon-backed shims** so the ~30 existing API routes and components did
not need rewriting. They expose the same `.from().select()...`, `.auth.*`, and
`.storage.*` surface.

## Key files

- `db/neon-schema.sql` — full schema (ported from `supabase/migrations/*`). Idempotent.
- `lib/db.ts` — connection pool + Supabase-style query builder.
- `lib/auth.ts` — password hashing, JWT signing/verify, `getServerUser()`.
- `lib/auth-admin.ts` — create / update / delete auth users.
- `lib/storage.ts` + `lib/storage-compat.ts` — file storage.
- `lib/supabase-admin.ts` / `lib/supabase-server.ts` / `lib/supabase.ts` — compat shims.
- `proxy.ts` — edge route guard.
- `app/api/auth/{login,logout,me}` — auth endpoints.
- `app/api/files` + `app/api/storage/upload` — file serve/upload.
- `seed-admin.js` — seeds the initial admin into Neon.

## Environment variables

Set in `.env.local` (and in your host, e.g. Vercel):

```
DATABASE_URL=postgresql://<user>:<pass>@<neon-host>/<db>?sslmode=require
AUTH_SECRET=<random 48+ byte secret used to sign session JWTs>
```

Rotating `AUTH_SECRET` invalidates all existing sessions (everyone must log in
again). The legacy `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY` values
are no longer used at runtime; they only remain for the one-time data export below.

## First-time setup on a fresh Neon database

1. Apply the schema:
   ```bash
   psql "$DATABASE_URL" -f db/neon-schema.sql
   ```
   (or paste it into the Neon SQL editor).
2. Seed the admin user:
   ```bash
   node seed-admin.js
   ```
   Default credentials: `admin@aerojet-aviation.com` / `Admin@2026`.
   Override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
3. Build & run:
   ```bash
   npm run build && npm start
   ```

## Migrating existing data out of Supabase (when unpaused)

The legacy Supabase project still holds any pre-migration data. To move it:

1. **Dump the Supabase tables** (schema is compatible except auth/storage):
   ```bash
   pg_dump --data-only --no-owner \
     --table='public.*' \
     "postgres://<supabase-connection-string>" > supabase-data.sql
   ```
2. **Load into Neon**:
   ```bash
   psql "$DATABASE_URL" -f supabase-data.sql
   ```
   Load order matters because of foreign keys; if you hit FK errors, dump/load
   parent tables first (jobs, departments, applications) then children.

### Users & passwords

Supabase stored password hashes in `auth.users`, which is **not** exportable via
the normal API and uses a different hashing scheme than our bcrypt setup.
Existing users therefore cannot have their passwords carried over directly.
Options:

- Re-invite users (they set a new password), **or**
- For each Supabase user, insert an `auth_users` row and issue a temporary
  password with `updateAuthUserPassword()` / the hire flow, then require a reset.

The `admin_users` / `staff_profiles` rows (roles, names) migrate normally since
they live in `public`. Only the credential material needs re-establishing.

### Storage files

Supabase Storage objects live in buckets, not in Postgres. To bring them over:

1. Download each object from Supabase Storage (dashboard or `supabase storage cp`).
2. Re-upload through the app's `/api/storage/upload` endpoint (or insert directly
   into `storage_objects(bucket, path, content, content_type, size)`), keeping the
   same `bucket` + `path` so existing `file_path` references stay valid.

## Notes

- All access control is enforced in the app layer (`verifyRole`, `proxy.ts`).
  There is no Row Level Security on Neon, so never expose the `DATABASE_URL`
  connection to the browser.
- `/api/files` requires a valid session; every bucket in this app holds private
  HR data.
