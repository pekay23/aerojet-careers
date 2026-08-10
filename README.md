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
- **Database:** **Neon** (PostgreSQL serverless) — shared with `aerojet-aviation`
- **Auth:** Custom JWT session (`jose` library, bcrypt password hashing)
- **Email:** Resend
- **Files:** Custom DB-backed storage (`storage_objects` table with BYTEA on Neon)
- **UI:** Tailwind CSS v4 + `@aerojet/design-tokens` + `@aerojet/ui` (Radix + CVA)
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
| `DATABASE_URL` | Neon PostgreSQL connection string (pooled) |
| `DIRECT_URL` | Neon direct connection string (for migrations) |
| `AUTH_SECRET` | Secret key for signing JWT session tokens |
| `RESEND_API_KEY` | Resend API key for transactional email |
| `EMAIL_FROM` | From address (e.g., `careers@aerojet-aviation.com`) |
| `NEXT_PUBLIC_APP_URL` | Production URL (`https://careers.aerojet-aviation.com`) |

## Project Structure

```
app/
  (public)/              # Public marketing & application pages
    page.tsx             # Home page
    jobs/                # Job listings & detail
    apply/[slug]/        # Application forms
    graduate-program/    # Graduate program info
    skilled-training/    # Skilled training info
    register/            # Candidate registration
  admin/                 # Admin dashboard (protected)
    dashboard/           # Overview stats
    applications/        # Pipeline management
    jobs/                # Job CRUD
    people/              # Staff/team management
    talent/              # Talent pool
    documents/           # Document vault
    settings/            # Org settings, email templates
  api/                   # REST API endpoints
    admin/               # Admin-only endpoints
    applications/        # Public application submission
    email/               # Email acknowledgment
    upload/              # File uploads
components/
  ui/                    # Shared UI components (Button, Card, FormCard, NoticeBanner, StatusPill, ToastContainer, PageHero, EmptyState)
  layout/                # SiteNav, SiteFooter
  admin/                 # Admin-specific components
  forms/                 # ApplicationForm, etc.
lib/
   supabase-server.ts     # Server component compat shim (wraps Neon + JWT)
   supabase-admin.ts      # Service-role compat shim (wraps Neon + JWT)
   email-service.ts       # Resend wrapper with backoff
   utils.ts               # cn(), formatters
   toast.ts               # Sonner wrapper
   validation/            # Zod schemas
   auth.ts                # Custom JWT auth (bcrypt + jose)
   db.ts                  # Neon pg connection pool + PostgREST shim
   storage.ts             # File storage (BYTEA on Neon)
   storage-compat.ts      # Supabase Storage API compat shim
supabase/
  migrations/            # Numbered SQL migrations
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
```

## Deployment

- **Vercel** — Auto-deploy on push to `main`; preview on PRs
- **Custom domain** — `careers.aerojet-aviation.com` (configure in Vercel → Domains)
- **Env vars** — Set in Vercel dashboard (Project → Settings → Environment Variables)
- **Database** — Schema lives in `db/neon-schema.sql`; migrations in `supabase/migrations/`
- **Build command** — `bun run build`
- **Edge runtime** — Auth middleware (`proxy.ts`) runs on Edge; session JWT verified at the edge

## License

Proprietary — Aerojet Aviation Careers © 2026