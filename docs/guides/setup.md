# Setup Guide

## Prerequisites

- Node.js >= 20
- A PostgreSQL database (Neon recommended)
- Package manager: `bun` (preferred) or `npm` — both lockfiles exist

## Installation

```bash
git clone https://github.com/pekay23/aerojet-careers.git
cd aerojet-careers
bun install     # or: npm install
```

## Environment configuration

Create `.env.local`:

```
# Neon (primary database)
DATABASE_URL="postgresql://<user>:<pass>@<neon-host>/<db>?sslmode=require"

# Local auth — signs the JWT session cookie. Keep secret.
AUTH_SECRET="<random 48+ byte string>"

# App
EMAIL_FROM="careers@aerojet-aviation.com"
NEXT_PUBLIC_APP_URL="https://careers.aerojet-aviation.com"
RESEND_API_KEY="<resend key>"
```

Generate a secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

The legacy `NEXT_PUBLIC_SUPABASE_*` / `SUPABASE_SERVICE_ROLE_KEY` values are not used
at runtime; keep them only if you still need to export data from the paused Supabase
project (see the [Neon migration guide](./neon-migration.md)).

## Database setup

Apply the schema (idempotent — safe to re-run):

```bash
psql "$DATABASE_URL" -f db/neon-schema.sql
# or paste db/neon-schema.sql into the Neon SQL editor
```

Seed the initial admin:

```bash
node seed-admin.js
```

Defaults: `admin@aerojet-aviation.com` / `Admin@2026`
(override with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`).

## Development

```bash
bun run dev          # dev server → http://localhost:3000
bun run lint         # ESLint
bun run type-check   # tsc --noEmit
bun run build        # production build (next build)
bun start            # run the production build
```

## Verifying the DB connection

A quick sanity check that the schema and admin exist:

```bash
node -e "const{Pool}=require('pg');const p=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}});p.query('select count(*) from admin_users').then(r=>{console.log(r.rows);return p.end()})"
```

## Demo credentials (after seeding)

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@aerojet-aviation.com | Admin@2026 |

Change this password after first login.
