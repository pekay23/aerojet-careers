# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 App Router careers portal for Aerojet Aviation — public job listings, application management, graduate/training programs, and admin dashboard for recruitment workflows. Neon PostgreSQL, custom JWT auth (bcrypt + jose), Vercel deployment. Package manager: **bun**.

Subdomain: `careers.aerojet-aviation.com`

## Common Commands

```bash
bun dev              # Start dev server with Turbopack
bun run build        # Production build (requires .env.local)
bun run lint         # ESLint
bun run lint:fix     # ESLint auto-fix
bun run type-check   # npx tsc --noEmit
bun run format       # Prettier (if configured)
bun run test         # Unit tests (Vitest)
bun run test:e2e     # E2E tests (Playwright)

# Database (Neon)
# Schema in db/neon-schema.sql; apply with: bun scripts/apply-schema.mjs
```

## Architecture

### Route Groups

```
app/
  (public)/          — Marketing pages, job listings, programs
    page.tsx         — Home page
    jobs/            — Job listings & detail pages
    apply/[slug]/    — Application forms
    graduate-program/ — Graduate program info
    skilled-training/ — Skilled training program info
    register/        — Candidate registration
    faq/             — Frequently asked questions
    our-story/       — Company timeline
    check-status/    — Application status lookup
    login/           — Staff portal login
  admin/             — Admin dashboard (protected)
    dashboard/       — Overview stats
    applications/    — Application management (list, detail, actions)
    jobs/            — Job CRUD
    people/          — Staff/team management
    talent/          — Talent pool
    documents/       — Document vault
    settings/        — Org settings, email templates
    hr/              — HR transfer management
    organization/    — Org chart + budget manager
    my-info/         — Employee self-service profile
  api/               — REST API endpoints
    admin/           — Admin-only endpoints
    applications/    — Public application submission
    email/           — Email acknowledgment
    upload/          — File uploads
    auth/            — Login, logout, refresh, me
    storage/         — Generic storage upload
```

### Auth System (JWT + bcrypt)

- **Local JWT** — Email/password with bcrypt hashing, jose HS256 signing
- **Session**: HttpOnly cookie (`aj_session`) with secure + sameSite flags
- **Refresh tokens**: One-time-use tokens in `refresh_tokens` table, rotated on `/api/auth/refresh`
- **Admin protection**: `proxy.ts` guards `/admin` and `/api/admin`; in-handler `verifyRole([...])`
- **Roles**: `admin`, `hr_manager`, `recruiter`, `employee`

### Database (Neon PostgreSQL)

- **Schema**: `db/neon-schema.sql` (idempotent, apply with `bun scripts/apply-schema.mjs`)
- **Key tables**: `jobs`, `applications`, `application_documents`, `candidates`, `departments`, `stages`, `documents`, `email_templates`, `audit_logs`, `staff_profiles`, `auth_users`, `admin_users`, `refresh_tokens`, `storage_objects`, `talent_pool`, `system_settings`
- **No RLS** — Authorization is entirely application-layer
- **Query builder**: `lib/db.ts` wraps `pg` with parameterized queries and a PostgREST-like API

### Admin Dashboard

- **Layout**: `components/admin/AdminLayout.tsx` — sidebar nav, top bar, user menu (client component, not a route layout)
- **Data fetching**: Server components with direct `pg` queries via `lib/db.ts`
- **Mutations**: API routes in `app/api/admin/`
- **Real-time**: Not implemented — UI polls on interval for pipeline updates

### Email (Resend)

- `lib/email-service.ts` — `sendEmail()`, `sendBulkEmails()` with 3-attempt backoff
- Templates in `app/admin/settings/email-templates/`
- Acknowledgment auto-sent on application submit (`app/api/email/acknowledge/route.ts`)

### File Storage (Custom)

- `storage_objects` table with BYTEA content on Neon
- `/api/files` — serves files by bucket + path with session auth
- `/api/storage/upload` — generic authenticated upload
- `/api/upload/talent` — talent CV upload (sets `talent_pool.cv_path`)
- Client shims in `lib/storage-compat.ts` for Supabase Storage API compat

## Key Shared Utilities

- `lib/utils.ts` — `cn()` (tailwind-merge + clsx), format helpers
- `lib/supabase-server.ts` — Server component Supabase client
- `lib/supabase-admin.ts` — Service-role client for admin APIs
- `lib/toast.ts` — Sonner toast wrapper
- `lib/sanitize.ts` — HTML sanitization (DOMPurify)
- `lib/refresh-token.ts` — Refresh token lifecycle
- `lib/auth-admin.ts` — Admin user CRUD
- `lib/rate-limit.ts` — Upstash Redis rate limiting
- `lib/logger.ts` — Structured JSON logging
- `lib/domain-config.ts` — Domain URLs and internal links
- `components/ui/` — Reusable UI components (Button, Card, FormCard, NoticeBanner, StatusPill, ToastContainer, PageHero, EmptyState, Skeleton, ConfirmDialog)

## Design System

- **Tokens**: CSS variables in `app/globals.css` — colors, spacing, typography, shadows
- **Components**: Radix primitives + custom components in `components/ui/`
- **Fonts**: Montserrat (display), Inter (sans), Outfit (alt) — loaded in `app/layout.tsx`
- **CSS**: `app/globals.css` imports design tokens + Tailwind v4 `@theme` mapping

## Code Conventions

### Imports

- Server components: `import { createClient } from '@/lib/supabase-server'`
- Client components: `import { cn } from '@/lib/utils'`
- UI components: `import { Button } from '@/components/ui'`
- Design tokens: CSS variables via `var(--token-name)` in globals.css

### Server Actions

- Colocated in `actions.ts` files (e.g., `app/admin/applications/actions.ts`)
- Use `revalidatePath()` / `revalidateTag()` for cache invalidation
- Throw `'Unauthorized'` / `'Forbidden'` strings for auth failures (caught by error boundary)

### API Routes

- Use `withErrorHandler` pattern from `lib/api-utils.ts` (if exists) or try/catch
- Validate with Zod schemas from `lib/validation/`
- Return `NextResponse.json({ success, data, error })`

### Forms

- Custom form components in `components/forms/` (TextInput, TextArea, Select, CheckItem, RadioItem, FileZone, BtnRow, etc.)
- React Hook Form + Zod (`@hookform/resolvers/zod`) where applicable
- Schemas in `lib/validation/`
- Server-side validation in actions/API routes
- `touched` state pattern: errors shown only after blur or submit attempt

## Performance Conventions

1. **Parallel queries** — Use `Promise.all()` for independent Supabase queries
2. **Select only needed fields** — `.select('id, title, status')` not `*`
3. **Loading states** — Every data-fetching page has `loading.tsx` with skeletons
4. **Dynamic imports** — Heavy client components (charts, editors) via `next/dynamic`
5. **Pagination** — Always paginate lists (`.range(from, to)`)
6. **Caching** — Use `next: { tags: ['jobs'] }` and `revalidateTag('jobs')` on mutations

## Testing

- **Unit/Component**: Vitest (configured — 49 tests in `tests/`)
- **E2E**: Playwright (configured — 2 specs in `tests/e2e/`)

## Build & Deploy

- **Output**: `output: 'standalone'` in `next.config.js` (Docker/standalone)
- **Vercel**: Auto-deploy on push to `main`; preview on PRs
- **Region**: `lhr1`
- **Env vars**: Set in Vercel dashboard (not committed)
- **Custom domain**: `careers.aerojet-aviation.com` (configure in Vercel)
- **Security headers**: HSTS, X-XSS-Protection, Permissions-Policy in `vercel.json` + `next.config.js`

## Environment Variables

Required in `.env.local` (see `.env.example`):

```
DATABASE_URL=
DIRECT_URL=
AUTH_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_APP_URL=https://careers.aerojet-aviation.com
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Verification

- `bun run type-check` — no errors expected
- `bun run lint` — ESLint clean
- `bun run build` — full production build succeeds

## License

Proprietary — Aerojet Aviation Careers © 2026