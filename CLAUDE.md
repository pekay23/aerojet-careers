# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 App Router careers portal for Aerojet Aviation — public job listings, application management, graduate/training programs, and admin dashboard for recruitment workflows. Supabase PostgreSQL, Supabase Auth (email/password), Vercel deployment. Package manager: **bun**.

Subdomain: `careers.aerojet-aviation.com`

## Common Commands

```bash
bun dev              # Start dev server with Turbopack
bun run build        # Production build (requires .env.local)
bun run lint         # ESLint
bun run lint:fix     # ESLint auto-fix
bun run type-check   # npx tsc --noEmit
bun run format       # Prettier (if configured)

# Database (Supabase)
# No local Prisma; Supabase handles schema via migrations in supabase/migrations/
# Run migrations via Supabase Dashboard or CLI
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
  admin/             — Admin dashboard (protected)
    dashboard/       — Overview stats
    applications/    — Application management (list, detail, actions)
    jobs/            — Job CRUD
    people/          — Staff/team management
    talent/          — Talent pool
    documents/       — Document vault
    settings/        — Org settings, email templates
  api/               — REST API endpoints
    admin/           — Admin-only endpoints
    applications/    — Public application submission
    email/           — Email acknowledgment
    upload/          — File uploads
```

### Auth System (Supabase)

- **Supabase Auth** — Email/password, magic links, OAuth (Google, GitHub)
- **Session**: Server-side via `@supabase/ssr` in `lib/supabase-server.ts`
- **Admin protection**: `app/admin/layout.tsx` checks `session.user` + `user_metadata.role === 'admin'`
- **Middleware**: `proxy.ts` rewrites API paths; auth gate at route level

### Database (Supabase PostgreSQL)

- **Migrations**: `supabase/migrations/` (numbered SQL files)
- **Key tables**: `jobs`, `applications`, `candidates`, `departments`, `stages`, `documents`, `email_templates`, `audit_logs`, `staff_profiles`
- **Row Level Security**: Policies enforce org isolation and role-based access
- **Seed**: `seed-admin.js` creates initial admin user

### Admin Dashboard

- **Layout**: `app/admin/layout.tsx` — sidebar nav, top bar, auth guard
- **Data fetching**: Server components with `supabase-server` client
- **Mutations**: Server Actions in `app/admin/actions.ts` + API routes
- **Real-time**: Supabase Realtime for application status updates

### Email (Resend)

- `lib/email-service.ts` — `sendEmail()`, `sendBulkEmails()` with 3-attempt backoff
- Templates in `app/admin/settings/email-templates/`
- Acknowledgment auto-sent on application submit (`app/api/email/acknowledge/route.ts`)

### File Uploads

- UploadThing via `app/api/upload/route.ts` and `app/api/upload/talent/route.ts`
- Client helpers: `UploadButton`, `UploadDropzone` (if needed)

## Key Shared Utilities

- `lib/utils.ts` — `cn()` (tailwind-merge + clsx), format helpers
- `lib/supabase-server.ts` — Server component Supabase client
- `lib/supabase-admin.ts` — Service-role client for admin APIs
- `lib/toast.ts` — Sonner toast wrapper
- `components/ui/` — Reusable UI components (Button, Card, FormCard, NoticeBanner, StatusPill, ToastContainer, PageHero, EmptyState)

## Design System

- **Tokens**: `@aerojet/design-tokens` (CSS variables) — colors, spacing, typography, shadows
- **Components**: `@aerojet/ui` — Button, Card, Input, Select, Textarea, Badge (Radix + CVA)
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

- React Hook Form + Zod (`@hookform/resolvers/zod`)
- Schemas in `lib/validation/`
- Server-side validation in actions/API routes

## Performance Conventions

1. **Parallel queries** — Use `Promise.all()` for independent Supabase queries
2. **Select only needed fields** — `.select('id, title, status')` not `*`
3. **Loading states** — Every data-fetching page has `loading.tsx` with skeletons
4. **Dynamic imports** — Heavy client components (charts, editors) via `next/dynamic`
5. **Pagination** — Always paginate lists (`.range(from, to)`)
6. **Caching** — Use `next: { tags: ['jobs'] }` and `revalidateTag('jobs')` on mutations

## Testing

- **Unit/Component**: Vitest (not yet configured — add if needed)
- **E2E**: Playwright (not yet configured — add if needed)

## Build & Deploy

- **Output**: `output: 'standalone'` in `next.config.js` (Docker/standalone)
- **Vercel**: Auto-deploy on push to `main`; preview on PRs
- **Env vars**: Set in Vercel dashboard (not committed)
- **Custom domain**: `careers.aerojet-aviation.com` (configure in Vercel)

## Environment Variables

Required in `.env.local` (see `.env.example`):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
EMAIL_FROM=
NEXT_PUBLIC_APP_URL=https://careers.aerojet-aviation.com
```

## Verification

- `bun run type-check` — no errors expected
- `bun run lint` — ESLint clean
- `bun run build` — full production build succeeds

## License

Proprietary — Aerojet Aviation Careers © 2026