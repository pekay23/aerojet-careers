# Aerojet Aviation Careers Portal

Careers subdomain for Aerojet Aviation — public job listings, application management, graduate & skilled training programs, and admin dashboard for recruitment workflows.

Subdomain: `careers.aerojet-aviation.com`

## Features

- **Public job board** — Filterable listings with search, department tags, location
- **Application flow** — Multi-step forms with file upload (CV, cover letter, certificates)
- **Program pages** — Graduate Program (24-month structured placements) and Skilled Training (technician/mechanic pathways)
- **Candidate registration** — Profile creation for future opportunities
- **Admin dashboard** — Application pipeline (Kanban/list), candidate profiles, job CRUD, email templates, document vault, team management
- **Email automation** — Acknowledgment on submit, status change notifications, bulk actions
- **Audit logging** — All privileged actions recorded

## Tech Stack

- **Framework:** Next.js 16 (App Router) · React 19
- **Language:** TypeScript
- **Database:** **Neon** (PostgreSQL serverless) — primary data store
- **Auth:** Custom JWT sessions (`jose` + bcrypt) with refresh tokens
- **Email:** Resend
- **Files:** Custom DB-backed storage (`storage_objects` BYTEA on Neon)
- **UI:** Tailwind CSS v4 + design tokens in `app/globals.css` + Radix primitives
- **Package manager:** **bun**

## Getting Started

```bash
# Install dependencies
bun install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your credentials

# Run schema migrations
bun scripts/schema-push.mjs   # pushes schema to Neon

# Start dev server
bun dev
```

## Environment Variables

See `.env.example` for all required variables:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Neon PostgreSQL pooled connection string |
| `DIRECT_URL` | Neon direct connection string (for migrations/schema) |
| `AUTH_SECRET` | Secret key for signing JWT session tokens |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | From address (e.g., `careers@aerojet-aviation.com`) |
| `NEXT_PUBLIC_APP_URL` | Production URL (`https://careers.aerojet-aviation.com`) |
| `UPSTASH_REDIS_REST_URL` | Optional: Upstash Redis for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Optional: Upstash Redis token |

## Project Structure

```
app/
  (public)/              # Public marketing & application pages
    faq/                 # FAQ page
    check-status/        # Application status lookup
    our-story/           # Company timeline
    jobs/                # Job listings & detail
    apply/[slug]/        # Application forms
    graduate-program/    # Graduate program info
    skilled-training/    # Skilled training info
    register/            # Candidate registration
    login/               # Staff portal login
  admin/                 # Admin dashboard (protected)
    dashboard/           # Overview stats
    applications/        # Pipeline management
    jobs/                # Job CRUD
    people/              # Staff/team management
    talent/              # Talent pool
    documents/           # Document vault
    settings/            # Org settings, email templates
    hr/                  # HR transfers
    organization/        # Org chart + budget
    my-info/             # Employee self-service
  api/                   # REST API endpoints
    admin/               # Admin-only endpoints
    applications/        # Public application submission
    email/               # Email acknowledgment
    upload/              # File uploads
    auth/                # Login, logout, refresh, me
    storage/             # Generic storage upload
components/
  ui/                    # Shared UI components (Button, Card, FormCard, NoticeBanner, StatusPill, ToastContainer, PageHero, EmptyState, Skeleton, ConfirmDialog)
  layout/                # SiteNav, SiteFooter
  admin/                 # Admin-specific components
  forms/                 # Reusable form components (13 components)
lib/
   auth.ts               # JWT session + bcrypt password hashing
   auth-admin.ts         # Admin user CRUD helpers
   sanitize.ts           # HTML sanitization (DOMPurify)
   refresh-token.ts      # Refresh token lifecycle
   email-service.ts      # Resend wrapper with backoff
   rate-limit.ts         # Upstash Redis + memory rate limiting
   logger.ts             # Structured JSON logging
   domain-config.ts      # Domain URLs and internal link lists
   utils.ts              # cn(), formatters
   toast.ts              # Sonner wrapper
   validation/           # Zod schemas
   db.ts                 # Neon pg connection pool + query builder
   storage.ts            # File storage (BYTEA on Neon)
   storage-compat.ts     # Supabase Storage API compat shim
scripts/                 # Operational scripts (DB, docs, audit)
tests/                   # Vitest + Playwright tests
```

## Key Business Flows

1. **Public Application** — Browse jobs → Click Apply → Multi-step form → Upload docs → Submit → Auto-acknowledgment email
2. **Admin Review** — Dashboard shows pipeline (New → Under Review → Shortlisted → Interview → Offer → Hired/Rejected) — Drag-drop or bulk actions
3. **Status Change** — Admin updates stage → Candidate gets notification email → Real-time UI update
4. **Talent Pool** — Candidates can register without applying → Admins can tag/source for future roles
5. **Programs** — Graduate & Skilled Training pages feed into same application system with program-specific fields

## Design System

Tokens from `@aerojet/design-tokens` (shared with `aerojet-aviation` and `aerojet-academy`):

- **Colors** — `--aero-blue` (#003366), `--aero-sky` (#00AEEF), semantic palette (background, foreground, primary, muted, destructive, etc.)
- **Typography** — Montserrat (display), Inter (sans), Outfit (alt)
- **Spacing/Radius/Shadows** — Consistent scale via CSS variables
- **Components** — `@aerojet/ui` exports Button, Card, Input, Select, Textarea, Badge

## Scripts

```bash
bun dev              # Dev server (Turbopack)
bun run build        # Production build
bun run lint         # ESLint
bun run lint:fix     # ESLint auto-fix
bun run type-check   # TypeScript check
bun run format       # Prettier
bun run test         # Unit tests (Vitest)
bun run test:e2e     # E2E tests (Playwright)
bun run docs:html    # Generate HTML docs mirror
```

## Deployment

- **Vercel** — Auto-deploy on push to `main`; preview on PRs
- **Region:** `lhr1` (London)
- **Custom domain** — `careers.aerojet-aviation.com`
- **Env vars** — Set in Vercel dashboard (Project → Settings → Environment Variables)
- **Database** — Schema lives in `db/neon-schema.sql`; apply with `bun scripts/apply-schema.mjs`
- **Build command** — `bun run build`
- **Security headers** — HSTS, X-XSS-Protection, Permissions-Policy configured in `vercel.json` + `next.config.js`

## License

Proprietary — Aerojet Aviation Careers © 2026