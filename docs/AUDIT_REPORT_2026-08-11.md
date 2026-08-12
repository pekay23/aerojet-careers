# Aerojet Aviation Careers Portal — Full Codebase Audit Report

**Date:** 2026-08-11  
**Updated:** 2026-08-12  
**Project:** aerojet-careers (`C:\Projects\aerojet-careers`)  
**Auditors:** LLM Council — 2 Senior Dev Engineers, 1 UI/UX Specialist, 1 Non-Technical User  
**Scope:** Complete codebase audit across architecture, security, performance, design, accessibility, and usability

> **Addendum (2026-08-12):** Many issues identified in this report have been
> addressed in a subsequent verification pass. See `docs/CHANGELOG_2026-08-12.md`
> for the full list of fixes. Key resolved items:
>
> | Original finding | Resolution |
> |---|---|
> | 688-line monolithic `ApplicationForm.tsx` | Refactored into 13 reusable `components/forms/*` |
> | Inline error text below fields | Removed; errors shown via `aria-invalid` red borders only |
> | Terse validation messages | Updated to friendly, field-specific prompts |
> | Missing skip link | Added to `app/layout.tsx` |
> | Mobile menu missing ARIA | Added `aria-label`, `aria-expanded`, `aria-controls` |
> | iOS auto-zoom on inputs | Min `16px` font-size enforced on `.field-input` |
> | 3-column grid no responsive breakpoint | Added mobile breakpoint |
> | Job card no press feedback | Added `.job-card:active` scale transform |
> | Text alignment inconsistencies | Standardized across all pages |
> | Login page design misalignment | Migrated to design token classes |
> | My-info page style issues | Fixed |
> | Auth/me route type issue | Fixed |
> | Admin documents route type issue | Fixed |
> | ESLint empty catch blocks | Fixed in 6 script files |
> | DashboardStats redeclare error | Fixed type import conflict |

---

## Executive Summary

The Aerojet Aviation Careers Portal is a **Next.js 16 App Router** application serving as a dual-portal system (public careers site + admin recruitment dashboard). The codebase demonstrates strong engineering fundamentals—comprehensive RBAC, Zod validation, type-safe TypeScript, and a well-structured design token system—but has **3 critical security vulnerabilities** and significant usability barriers that must be addressed before production scale.

**Overall Grade: C+ (Production-ready with critical remediations required)**

| Domain | Grade | Critical Issues |
|--------|-------|-----------------|
| Architecture & Code Quality | B- | Monolithic components, mixed styling paradigms |
| Security | D+ | 3 critical vulnerabilities, missing CSRF, unauthenticated uploads |
| Performance | B | Missing caching, N+1 queries, large bundle concerns |
| UI/UX & Accessibility | C+ | Broken CSS variables, missing skip link, inline style dominance |
| Usability & Trust | B- | Aviation jargon, missing salary data, no candidate login |

---

## Part 1: Senior Dev Engineer 1 — Architecture & Code Quality

### 1.1 Project Structure

**Strengths:**
- Clear dual-portal separation: `app/` (public) and `app/admin/` (protected)
- Barrel exports in `components/ui/index.tsx` prevent component divergence
- Centralized types in `types/index.ts` with comprehensive domain interfaces
- Shared utilities in `lib/` (`api-utils.ts`, `auth.ts`, `domain-config.ts`)

**Issues:**
- `app/page.tsx` (265 lines) mixes data fetching, layout, and presentation with heavy inline styles
- `components/forms/ApplicationForm.tsx` (688 lines) is a monolithic wizard containing 5 steps, 13 inline sub-components, and business logic
- `components/admin/AdminLayout.tsx` (369 lines) bundles sidebar state, user menu, settings fetch, and responsive logic

### 1.2 Next.js App Router Usage

**Good patterns:**
- Server components fetch data directly via `supabaseAdmin` (`app/page.tsx`, `app/jobs/page.tsx`)
- Client components correctly use `'use client'` (`JobsClient.tsx`, `register/page.tsx`, `LoginClient.tsx`)
- ISR on jobs page with `revalidate = 60` (`app/jobs/page.tsx:14`)
- Lazy loading for login client with `Suspense`

**Issues:**
- `app/login/page.tsx:5` sets `dynamic = 'force-dynamic'` on a purely client-side page — unnecessary SSR
- `app/admin/dashboard/page.tsx:16` uses `force-dynamic` with no caching strategy
- `app/jobs/JobsClient.tsx:14-22` fetches departments client-side, causing empty-state flash

### 1.3 TypeScript & Type Safety

**Strengths:**
- `strict: true` enabled in `tsconfig.json`
- Path aliases (`@/*`) used consistently
- Comprehensive union types for enums in `types/index.ts`

**Issues:**
- ~15 instances of `any` type undermining safety (`lib/api-utils.ts:44`, `app/register/page.tsx:21`, `ApplicationForm.tsx:16`, `app/admin/dashboard/page.tsx:112`)
- Duplicate Zod schemas: `lib/validation/schemas.ts` vs `ApplicationForm.tsx:50-90` with divergent validation logic
- Duplicate `isAdult` function in two locations

### 1.4 Styling Approach

**Critical inconsistency: THREE styling paradigms coexist:**
1. **Tailwind CSS v4 utilities** — used in login page and some admin components
2. **CSS custom properties via `globals.css`** — used in shared component classes
3. **Inline `style={{}}` objects** — used in ~60% of page components

This is the single largest maintainability issue. `app/page.tsx` has 50+ inline style objects. `app/register/page.tsx` has 30+.

### 1.5 API Design

**Strengths:**
- RESTful routes with proper HTTP methods (GET/POST/PATCH/DELETE)
- Standardized response format via `ApiResponse` class
- Sort column allow-listing prevents SQL injection (`SORTABLE_COLUMNS`)
- UUID validation on delete operations

**Issues:**
- No CSRF protection on state-changing endpoints
- No rate limiting on public endpoints despite `@upstash/ratelimit` being installed
- `PATCH /api/admin/applications` accepts unvalidated updates

### 1.6 Testing Strategy

**Strengths:**
- Vitest configured with V8 coverage
- Playwright configured for E2E
- Unit tests exist for validation, security, and API utilities

**Gaps:**
- No unit tests for `lib/auth.ts`, `lib/api-utils.ts`, or `ApplicationForm.tsx`
- No E2E test for application submission flow
- No E2E test for admin CRUD operations
- Only Chromium tested — no Firefox/Safari

### 1.7 Key Recommendations

| Priority | Action |
|----------|--------|
| P0 | Consolidate Zod schemas — move all step schemas to `lib/validation/schemas.ts` |
| P0 | Extract inline form components from `ApplicationForm.tsx` into typed, testable files |
| P0 | Reduce inline styles — create reusable components for repeated patterns |
| P1 | Remove `any` types and replace with proper interfaces |
| P1 | Unify auth strategy — Supabase Auth OR local JWT, not both |
| P2 | Add Open Graph metadata to all pages |
| P3 | Extract `AdminLayout` sub-components into separate files |
| P3 | Add Husky + lint-staged for pre-commit enforcement |

---

## Part 2: Senior Dev Engineer 2 — Security, Performance & Maintainability

### 2.1 Security Posture

#### Authentication & Session Management
- **Good:** JWT sessions with `jose` (`HS256`), httpOnly cookies, `secure` flag in production, `sameSite: 'lax'`
- **Good:** Refresh token rotation with one-time-use tokens stored in DB
- **Good:** Secret fallback chain (`AUTH_SECRET || JWT_SECRET || NEXTAUTH_SECRET`)
- **Concern:** No MFA, no password complexity requirements, bcrypt cost 10 (acceptable but could be 12)

#### Rate Limiting
- **Good:** Login rate limiting implemented with Upstash Redis + in-memory fallback
- **Critical Gap:** Rate limiting is **ONLY** on `/api/auth/login`. All other public write endpoints (`/api/register`, `/api/applications`, `/api/upload/talent`) have **NO rate limiting**
- **Critical Gap:** Memory fallback is **broken in production** — on Vercel serverless, each function instance has isolated memory, so rate limiting becomes ineffective across instances

#### Input Validation
- **Good:** Zod schemas on most mutation endpoints
- **Good:** UUID validation consistently applied
- **Good:** Sort column allow-listing
- **Concern:** `cleanInput()` only trims whitespace — no XSS sanitization (relies on React JSX escaping)
- **Concern:** No `dangerouslySetInnerHTML` found — good

#### XSS / CSRF Protection
- **Critical:** No CSRF tokens anywhere in the application
- **Missing:** No `X-XSS-Protection` header configured
- **Missing:** No CSP nonces — `unsafe-inline` used for scripts in dev
- **Concern:** CSP `connect-src 'self'` in admin blocks all external API calls

#### Data Exposure
- **Critical:** Error messages from internal operations returned directly to clients
- **Concern:** Console.error statements may leak sensitive data to Vercel logs
- **Critical:** `/api/files` serves files based on bucket+path with only session authentication — any authenticated user can access any file by guessing paths

### 2.2 API Security

#### Authorization
- **Good:** Centralized `verifyRole()` with RBAC
- **Critical Anti-pattern:** `verifyRole()` auto-creates `admin_users` records from `user_metadata.role` if no record exists. If any code path allows setting `user_metadata.role` during registration, it enables privilege escalation
- **Good:** Recruiter soft-delete pattern for applications
- **Good:** Employee self-service for documents

#### Data Leakage
- **Critical:** `/api/admin/download` allows any admin/hr_manager/recruiter to download ANY file by path without checking application ownership
- **Critical:** `/api/files` allows any authenticated user to read any storage object by path
- **Critical:** `/api/upload/talent` has **NO authentication check whatsoever** — completely unauthenticated file upload

### 2.3 Performance

#### Server Components & Data Fetching
- `app/admin/dashboard/page.tsx:16` uses `force-dynamic` with 6+ parallel DB queries and no caching
- No `next: { tags: [...] }` caching on any API route or server component
- `select('*')` used in multiple places where specific columns would suffice

#### Caching
- Zero API response caching — no `Cache-Control` headers, no Next.js revalidation tags
- Dashboard is fully dynamic with no caching strategy

#### Image Optimization
- Next.js Image remote patterns configured for Supabase storage, but app migrated to Neon
- No image optimization for admin-uploaded avatars or document previews

#### Bundle Size
- Framer Motion v12 — heavy dependency used extensively in admin modals
- @xyflow/react (React Flow) for org chart — large bundle impact
- No code splitting analysis performed

### 2.4 Infrastructure & Config

#### Environment Variables
- **Critical:** `.env.local` exists on disk with live production credentials (Neon DB passwords, AUTH_SECRET, RESEND_API_KEY, Upstash tokens)
- Legacy Supabase keys remain in `.env.local` despite migration to Neon

#### Deployment
- **Missing:** `output: 'standalone'` in `next.config.js` — `CLAUDE.md` claims it exists but it doesn't
- No build-time environment validation
- `vercel.json` configures regions and basic security headers

#### Headers & CSP
- Admin CSP: `default-src 'self'`, `script-src 'self' 'unsafe-inline'`, `connect-src 'self'`
- **Missing:** No HSTS (`Strict-Transport-Security`) header
- **Missing:** No `Permissions-Policy` header
- **Missing:** No `X-XSS-Protection` header

### 2.5 Error Handling & Resilience

- Consistent try/catch in all API route handlers
- Error responses sometimes leak internal details (raw `err.message`)
- Graceful degradation: Upstash Redis falls back to memory
- Email failures are non-blocking — application submission succeeds even if acknowledgment fails
- Console.error/warn used throughout — no structured logging, no request IDs, no error tracking service

### 2.6 Database & Data Layer

- Custom PostgREST query builder (`lib/db.ts`) with parameterized queries — no string concatenation
- **Risk:** SQL injection risk in `or()` parser — `sanitizeSearch()` strips special characters but parser doesn't validate column names against allowlist
- N+1 risk in document listing — each document triggers separate `createSignedUrl` call
- N+1 in talent CV lookup — individual `talent_pool` lookup per file path
- No RLS — authorization is entirely application-layer

### 2.7 Key Recommendations

| Priority | Action | Location |
|----------|--------|----------|
| P0 | Rotate ALL secrets immediately | `.env.local` |
| P0 | Add authentication to `/api/upload/talent` | `app/api/upload/talent/route.ts` |
| P0 | Implement CSRF protection | All API routes |
| P0 | Add rate limiting to all public write endpoints | `/api/register`, `/api/applications` |
| P1 | Remove auto-provisioning from `verifyRole()` | `lib/api-utils.ts:36-67` |
| P1 | Add authorization checks to `/api/files` and `/api/admin/download` | `app/api/files/route.ts` |
| P1 | Fix Upstash fallback — return 429 instead of silently bypassing | `lib/rate-limit.ts:53-63` |
| P1 | Sanitize error messages — replace raw `err.message` with generic messages | All API routes |
| P1 | Add security headers (HSTS, X-XSS-Protection, Permissions-Policy) | `next.config.js`, `vercel.json` |
| P2 | Batch signed URL generation in parallel | `app/api/admin/documents/route.ts` |
| P2 | Add response caching on read-only endpoints | All API routes |
| P2 | Replace `select('*')` with specific columns | Admin list endpoints |
| P2 | Add `output: 'standalone'` to `next.config.js` | `next.config.js` |
| P3 | Reduce Framer Motion bundle impact | `components/admin/*` |
| P3 | Add column name validation to query builder `or()` parser | `lib/db.ts:265-322` |
| P3 | Add automated dependency scanning in CI | CI config |

---

## Part 3: UI/UX Specialist — Design, Accessibility & UX

### 3.1 Design System Assessment

**Design Tokens (`lib/design-tokens.css`)**
- **Strengths:** Well-structured token system with navy/sky brand anchors, full tonal scales, semantic palette, surface tokens, gradients, and z-index hierarchy
- **Critical Issues:**
  - `var(--blue)`, `var(--navy)`, `var(--success)`, `var(--error)`, `var(--warning)`, `var(--info)` are used extensively in inline styles but **never defined** — resolve to `undefined` at runtime, causing broken colors
  - `--muted-bg` is referenced in `globals.css` but never defined
  - Duplicate `--sp-5` declaration at line 158
  - Duplicate `.cta-section` block in `globals.css` (lines 342-368 and 496-522)
  - Playfair Display declared in tokens but never loaded in `app/layout.tsx`

### 3.2 Visual Consistency

**Major Issue: Inline Style Dominance**
- `app/page.tsx`, `JobsClient.tsx`, `graduate-program/page.tsx`, `skilled-training/page.tsx` use hundreds of lines of inline `style={{}}` objects instead of existing CSS classes
- Existing components (`StatusPill`, `EmptyState`) are underutilized — `JobsClient.tsx` has custom empty state markup instead of reusing `EmptyState`
- Login page uses different visual language (Tailwind slate utilities) vs. careers portal's token system — feels like a separate product

**Brand Alignment**
- Navy/sky usage is consistent across nav, hero, CTAs, and footer
- Hero overlays use hardcoded `#1c2a38/60` instead of tokenized values
- Image references (`logo-navbar.png`, `logo-footer.png`) may 404 if not in expected `public/` subdirectory

### 3.3 Typography & Readability

**Strengths:**
- Three web fonts loaded correctly (Montserrat, Inter, Outfit) with `preconnect` hints
- Good hierarchy in `PageHero` and `SiteNav`

**Issues:**
- Many headings use arbitrary inline `fontSize` values (`'1.75rem'`, `'1.5rem'`, `'1.35rem'`) bypassing the token type scale
- `--muted-foreground: #64748B` (slate-500) on white has contrast ~4.5:1 — passes AA for large text only, used extensively for body text
- Stats labels use 13px — too small for prominent blocks

### 3.4 Layout & Responsiveness

**Strengths:**
- Responsive grids with `auto-fit, minmax()` collapse gracefully
- Mobile nav breakpoint at 900px with 44px touch targets
- `minmax(0, 1fr)` pattern prevents grid overflow

**Issues:**
- 3-column deployment grid in `ApplicationForm.tsx:488` without responsive breakpoint — cramped on mobile
- Sticky sidebar on job detail may overlap fixed nav on small screens
- Cookie banner may overlap content on small screens

### 3.5 Accessibility Audit

**Good:**
- `prefers-reduced-motion` respected globally
- `:focus-visible` outlines defined
- ARIA labels on search inputs (`JobsClient.tsx:39`, `49`)
- `role="note"` on NoticeBanner
- `aria-live="polite"` on cookie banner and error alerts
- `aria-pressed` on deployment preference cards
- `aria-expanded` on "Apply Now" button

**Critical Issues:**
- **Missing skip link:** CSS class `.skip-link` defined in `globals.css:1037-1055` but never rendered in `app/layout.tsx`
- **Mobile menu toggle lacks ARIA:** No `aria-label`, `aria-expanded`, or `aria-controls` (`SiteNav.tsx:101-106`)
- **CookieBanner lacks focus trap & aria-modal:** `role="dialog"` without `aria-modal="true"`
- **Form labels missing `htmlFor`/`id` in `register/page.tsx:127-153`:** Nationality, country, experience, qualification selects
- **File upload inputs lack accessible labeling:** Hidden inputs with no `aria-label` or `<label>` association

### 3.6 UX Patterns & Flows

**Strengths:**
- Multi-step application form with progress indicator and per-step validation
- Deferred form reveal pattern in job detail page
- Sticky sidebar CTA on job detail
- Toast notifications with framer-motion animations

**Issues:**
- Search state is client-side only — no URL-based sharing or bookmarking
- No pagination on jobs listing — long lists create unusably long pages
- No sort options on jobs page
- No loading skeletons for async data (despite README convention)
- ToastContainer component exists but not mounted in layout

### 3.7 Key Recommendations

| Priority | Action | File |
|----------|--------|------|
| P0 | Define missing CSS custom properties (`--blue`, `--navy`, `--success`, etc.) | `lib/design-tokens.css` |
| P0 | Add skip link to `app/layout.tsx` | `app/layout.tsx` |
| P0 | Verify image assets exist (logo-navbar.png, logo-footer.png) | `public/` |
| P1 | Add ARIA attributes to mobile menu toggle | `SiteNav.tsx:101-106` |
| P1 | Add focus trap and aria-modal to CookieBanner and ConfirmDialog | `CookieBanner.tsx`, `ConfirmDialog.tsx` |
| P1 | Reduce inline styles — extract TrackCard, Section, and other repeated patterns | `page.tsx`, `graduate-program/page.tsx` |
| P1 | Fix form label associations in register page | `register/page.tsx:127-153` |
| P1 | Replace inline hover handlers with CSS | `JobsClient.tsx:92-93` |
| P1 | Use EmptyState component in JobsClient | `JobsClient.tsx:64-69` |
| P1 | Mount ToastContainer in layout | `app/layout.tsx` |
| P2 | Remove duplicate CSS blocks in globals.css | `globals.css` |
| P2 | Align login page design system | `app/login/LoginClient.tsx` |
| P2 | Add responsive breakpoint to deployment grid | `ApplicationForm.tsx:488` |
| P2 | Add accessible labels to file upload zones | `ApplicationForm.tsx`, `register/page.tsx` |
| P3 | Extract inline helper components from ApplicationForm | `components/forms/` |

---

## Part 4: Non-Technical User — Usability, Content & Trust

### 4.1 First Impressions & Credibility

**Strengths:**
- Strong hero messaging: *"Build the future of African aviation"*
- Professional design with consistent navy/sky branding
- Physical address visible: *Accra International Airport, Accra, Ghana*
- Local Ghana phone number: `+233-20-984-8423`
- Transparent notice banners explain program status honestly

**Concerns:**
- **Jargon overload:** *"MRO facility"* appears in hero and across pages without definition
- **Stats fallback values:** Hardcoded "12+ Active Vacancies" and "1st Planned MRO Hub" when API fails undermines credibility
- **No social proof:** No employee testimonials, team photos, partner logos, or media mentions
- **"Actively building ahead of operational launch"** may trigger anxiety about job security

### 4.2 Navigation & Information Architecture

**Strengths:**
- Fixed top navigation with clear "View All Jobs" CTA
- Mobile hamburger menu with adequate touch target
- Comprehensive footer sitemap with 6 columns
- Breadcrumbs on job application pages

**Concerns:**
- **Breadcrumbs missing on 5+ major pages:** Homepage, Jobs, Graduate Program, Skilled Training, Register
- **No skip-to-content link rendered** — keyboard users tab through full nav
- **External link confusion:** Newsroom and Contact point to main `aerojet-aviation.com` domain
- **Admin login at `/login`:** Candidates searching for "login" or "my application" hit a staff portal

### 4.3 Job Discovery Experience

**Strengths:**
- Client-side search filters by title, department, and tags
- Department dropdown dynamically populated
- Job cards show location, type, vacancies, deadline, and tags
- Empty state gracefully redirects to general application

**Concerns:**
- **No salary information** on job cards or detail pages
- **No pagination or "Load more"** — long lists create unusably long pages
- **No sort options** — hardcoded to `created_at` descending
- **No "Save job" or email alerts**
- **Search state not URL-based** — cannot share or bookmark filtered results

### 4.4 Application Flow

**Strengths:**
- Progressive disclosure — 5-step form hidden behind "Apply Now" gate
- Clear progress indicator with back-navigation
- Per-step validation gates
- Confirmation screen with reference code
- WhatsApp sharing of job links

**Concerns:**
- **Extreme length and complexity:** Step 2 requires EASA Part-66 licence knowledge — non-EASA candidates (FAA, GCAA) may not know how to answer
- **No save-and-resume:** Browser close or connectivity loss = lost progress
- **Terse error messages:** "Required", "Invalid email" give no guidance
- **No time estimate:** Says "about five minutes" but realistically takes 15-20 minutes
- **Compensation step asks for salary expectations** but job never disclosed a range
- **No confirmation email guarantee:** Success screen claims email sent, but if API fails user sees false confirmation

### 4.5 Content Quality

**Strengths:**
- Local relevance: WAEC/WASSCE, Ghanaian nationality, GHS currency, Ghana Data Protection Act
- Transparent program status via NoticeBanners
- WhatsApp and LinkedIn sharing matches West African communication habits

**Concerns:**
- **Aviation jargon overload:** Cat A pathway, Part-66, type ratings, AOG, outstation, ULD, DG — all unexplained
- **Terms of Use contradicts reality:** Mentions "application fees are non-refundable" but no fees are charged
- **No FAQ or help center:** Common questions unanswered
- **Graduate Program is a stub:** Page openly admits it's a placeholder

### 4.6 Mobile Experience

**Strengths:**
- Responsive grids collapse gracefully
- Mobile nav with 44px touch target
- Single-column layout on mobile for job detail
- Footer grid steps up from 1 → 2 → 3 → 6 columns

**Concerns:**
- Sticky sidebar on job detail may overlap fixed nav on small screens
- 3-column deployment grid compresses on 320px screens
- No mobile-specific error presentation
- No viewport meta set explicitly (relies on Next.js default)

### 4.7 Trust & Transparency

**Strengths:**
- Legal compliance: Privacy policy references Ghana Data Protection Act, ISO/IEC 27001:2022
- Clear data subject rights enumeration
- Consent checkboxes with plain-language summaries
- Cookie consent with accept/reject options
- Physical address and local phone number in footer

**Concerns:**
- **Inconsistent contact emails:** Terms uses `info@aerojet-aviation.com`, footer/forms use `careers@aerojet-aviation.com`
- **Terms of Use references non-existent fees** — creates fear of hidden costs
- **No security indicators:** No SSL badge, no "secure application" icon, no encryption mention
- **No company legitimacy signals:** No registration number, no GRA references, no press mentions

### 4.8 Key Recommendations

| Priority | Action | Impact |
|----------|--------|--------|
| P0 | Create candidate-facing status page or clearly label admin login as "Staff Portal" | Eliminates login confusion |
| P0 | Add plain-language aviation glossary or tooltips for MRO, LAE, Part-66, etc. | Enables non-specialist applicants |
| P0 | Implement save-and-resume on 5-step application form | Reduces abandonment |
| P0 | Correct Terms of Use fee language or add "no fees" statement | Builds trust |
| P1 | Add salary ranges or compensation statements to job cards | Saves candidate time |
| P1 | Add "Save job" and "Set up job alert" buttons | Increases engagement |
| P1 | Add breadcrumbs to homepage, jobs, programs, register | Improves navigation |
| P1 | Add help widget or visible helpline (WhatsApp) | Reduces drop-off |
| P1 | Consolidate contact emails or add routing explanation | Reduces confusion |
| P2 | Add French language option | Widens West African reach |
| P2 | Add employee testimonials or "Meet the team" section | Humanizes brand |
| P2 | Add "Back to top" button on long pages | Improves mobile UX |
| P2 | Add pagination or "Load more" to jobs listing | Prevents unusably long pages |
| P2 | Add sort controls to jobs page | Improves discoverability |
| P3 | Add social media links to footer | Increases followability |
| P3 | Add company timeline or "Our story" page | Builds legitimacy |
| P3 | Render skip-link in layout | Keyboard accessibility |

---

## Consolidated Critical Issues (All Perspectives)

| # | Issue | Severity | Domain | Location |
|---|-------|----------|--------|----------|
| 1 | **Live production secrets on disk** (`.env.local` with real credentials) | CRITICAL | Security | `.env.local` |
| 2 | **Completely unauthenticated file upload** (`/api/upload/talent`) | CRITICAL | Security | `app/api/upload/talent/route.ts` |
| 3 | **No CSRF protection** on state-changing endpoints | CRITICAL | Security | All API routes |
| 4 | **Password returned in API response** (`tempPassword` in JSON) | CRITICAL | Security | `app/api/admin/people/create/route.ts:80` |
| 5 | **Undefined CSS variables** (`--blue`, `--navy`, etc.) causing broken colors | CRITICAL | UI/UX | All page components |
| 6 | **Missing skip link** (CSS exists but never rendered) | HIGH | Accessibility | `app/layout.tsx` |
| 7 | **No rate limiting on public write endpoints** | HIGH | Security | `/api/register`, `/api/applications` |
| 8 | **Unauthenticated memory rate limiter fallback** (broken in serverless) | HIGH | Security | `lib/rate-limit.ts` |
| 9 | **File access control gaps** (`/api/files`, `/api/admin/download`) | HIGH | Security | `app/api/files/route.ts`, `app/api/admin/download/route.ts` |
| 10 | **Auto-provisioning admin_users** from `user_metadata.role` | HIGH | Security | `lib/api-utils.ts:36-67` |
| 11 | **Unvalidated PATCH updates** on applications | HIGH | Security | `app/api/admin/applications/route.ts:44` |
| 12 | **Mobile menu toggle lacks ARIA attributes** | HIGH | Accessibility | `SiteNav.tsx:101-106` |
| 13 | **Form labels missing `htmlFor`/`id`** in register page | MEDIUM | Accessibility | `register/page.tsx:127-153` |
| 14 | **Duplicate Zod schemas with divergent validation logic** | MEDIUM | Architecture | `lib/validation/schemas.ts` vs `ApplicationForm.tsx` |
| 15 | **Monolithic 688-line ApplicationForm component** | MEDIUM | Architecture | `components/forms/ApplicationForm.tsx` |
| 16 | **~15 instances of `any` type** undermining TypeScript strictness | MEDIUM | Architecture | Multiple files |
| 17 | **Inline styles dominate page components** (~60% of styling) | MEDIUM | Architecture | `page.tsx`, `register/page.tsx`, others |
| 18 | **Dual auth systems** (Supabase Auth + local JWT) | MEDIUM | Architecture | `lib/auth.ts` vs `supabase-*` shims |
| 19 | **No salary transparency** on job cards | MEDIUM | Usability | `JobsClient.tsx`, `JobApplyContent.tsx` |
| 20 | **Aviation jargon without definitions** | MEDIUM | Usability | Multiple pages and form fields |
| 21 | **No save-and-resume on application form** | MEDIUM | Usability | `ApplicationForm.tsx` |
| 22 | **Terms of Use mentions non-existent fees** | MEDIUM | Usability | `app/(public)/terms/page.tsx:56` |
| 23 | **Client-side-only search with no URL state** | LOW | UX | `JobsClient.tsx:24-30` |
| 24 | **No pagination on jobs listing** | LOW | Performance/UX | `app/jobs/page.tsx:35` |
| 25 | **Duplicate CSS blocks** in globals.css | LOW | UI/UX | `globals.css:342-368, 496-522` |
| 26 | **Login page visual divergence** from design system | LOW | UI/UX | `app/login/LoginClient.tsx` |
| 27 | **ToastContainer not mounted in layout** | LOW | UI/UX | `components/ui/ToastContainer.tsx` |
| 28 | **3-column grid without responsive breakpoint** | LOW | UI/UX | `ApplicationForm.tsx:488` |

---

## Consolidated Recommendations (Prioritized)

### P0 — Fix Immediately

1. **Rotate ALL secrets** — `.env.local` contains live production credentials. Rotate Neon DB passwords, AUTH_SECRET, RESEND_API_KEY, Upstash tokens, Supabase keys. Migrate to Vercel Environment Variables or a secrets manager.
2. **Add authentication to `/api/upload/talent`** — This endpoint must require a valid session, ideally restricted to admin/hr_manager roles.
3. **Implement CSRF protection** — Add CSRF tokens to all mutation endpoints or enforce `SameSite: 'strict'` + `Origin` header validation.
4. **Remove `tempPassword` from API response** — Send credentials via email only, or generate a password reset link.
5. **Add rate limiting to all public write endpoints** — `/api/register`, `/api/applications` should have the same rate limiting as login.
6. **Define all missing CSS custom properties** — Add `--blue`, `--navy`, `--success`, `--error`, `--warning`, `--info`, `--muted-bg` to `lib/design-tokens.css` or create a centralized aliases file.
7. **Render skip link in `app/layout.tsx`** — `<a href="#main-content" class="skip-link">Skip to main content</a>`
8. **Remove auto-provisioning from `verifyRole()`** — Require explicit `admin_users` records. Auto-creation from `user_metadata.role` is a privilege escalation vector.

### P1 — High Priority (This Sprint)

9. **Add authorization checks to `/api/files` and `/api/admin/download`** — Users should only access files belonging to their own applications/records.
10. **Fix Upstash fallback behavior** — When Redis is unavailable, return 429 instead of silently falling back to ineffective memory limiting.
11. **Sanitize error messages** — Replace raw `err.message` with generic messages in API responses. Log details server-side only.
12. **Add security headers** — Implement `Strict-Transport-Security`, `X-XSS-Protection`, `Permissions-Policy`, and upgrade-insecure-requests.
13. **Add ARIA attributes to mobile menu toggle** — `aria-label`, `aria-expanded`, `aria-controls`.
14. **Add `aria-modal="true"` and focus trap to CookieBanner** and ConfirmDialog.
15. **Fix form label associations in `register/page.tsx`** — Add `htmlFor` attributes to labels and matching `id` attributes to selects.
16. **Replace inline hover handlers in `JobsClient.tsx`** with CSS `.card:hover` or a dedicated `.job-row` class.
17. **Use EmptyState component in JobsClient** instead of inline markup.
18. **Mount ToastContainer in `app/layout.tsx`** so toasts are globally available.
19. **Consolidate Zod schemas** — Move all step schemas to `lib/validation/schemas.ts` and import them in `ApplicationForm.tsx`.
20. **Extract inline form components** from `ApplicationForm.tsx` into `components/forms/` or `components/ui/`. Make them typed and testable.
21. **Reduce inline styles** in page components. Create reusable components for repeated patterns.
22. **Add unit tests** for `lib/auth.ts` (session lifecycle), `lib/api-utils.ts` (sanitization functions), and extracted form components.
23. **Unify auth strategy** — Decide: Supabase Auth OR local JWT, not both.
24. **Add Zod validation** to `app/api/admin/applications/route.ts` PATCH handler with allow-list similar to `ALLOWED_UPDATE_KEYS`.

### P2 — Medium Priority (Next Sprint)

25. **Batch signed URL generation** — Fetch all signed URLs in parallel instead of sequential per-document calls.
26. **Add response caching** — Implement `Cache-Control` headers on read-only endpoints and Next.js `revalidate` tags for server components.
27. **Replace `select('*')` with specific columns** in admin list endpoints.
28. **Add `output: 'standalone'`** to `next.config.js` for optimized Docker deployments.
29. **Implement structured logging** — Replace `console.error` with a logger that supports levels, redaction, and request correlation.
30. **Remove duplicate CSS blocks** in `globals.css`.
31. **Remove duplicate `--sp-5` declaration** in `lib/design-tokens.css`.
32. **Align login page design system** — Update to use careers portal's CSS component classes.
33. **Add responsive breakpoint to deployment preference grid** in `ApplicationForm.tsx`.
34. **Add accessible labels to file upload zones**.
35. **Add loading skeletons** for async data pages (jobs, stats).
36. **Add salary ranges or compensation statements** to job cards and detail pages.
37. **Add save-and-resume (draft applications)** — Store form state in `localStorage` or database, send resume link via email.
38. **Add simple FAQ page** — Address common questions (fees, visas, review timeline, MRO definition).
39. **Correct Terms of Use fee language** — Remove "application fees are non-refundable" or add "no fees charged" statement.
40. **Consolidate contact emails** — Use `careers@aerojet-aviation.com` everywhere, or add routing explanation.

### P3 — Low Priority / Technical Debt

41. **Reduce Framer Motion bundle impact** — Consider code-splitting animation libraries or using CSS transitions for simpler animations.
42. **Add input sanitization library** — Implement DOMPurify or similar for any future rich-text features.
43. **Add column name validation to query builder `or()` parser** — Whitelist allowed columns to prevent SQL injection.
44. **Implement database query logging in non-production** — Add query duration logging to identify slow queries.
45. **Add automated dependency scanning** — Configure `bun audit` or `npm audit` in CI pipeline.
46. **Add multi-browser E2E tests** (Firefox, WebKit).
47. **Enable `fullyParallel: true`** in Playwright config.
48. **Extract AdminLayout sub-components** (sidebar, topbar, user menu) into separate files.
49. **Add social media links** to footer.
50. **Add company timeline or "Our story" page**.

---

## Appendix: Files Analyzed

### Core Application
- `package.json`, `next.config.js`, `tsconfig.json`, `vercel.json`
- `app/layout.tsx`, `app/page.tsx`, `app/globals.css`
- `app/jobs/page.tsx`, `app/jobs/JobsClient.tsx`
- `app/skilled-training/page.tsx`, `app/graduate-program/page.tsx`
- `app/register/page.tsx`, `app/login/page.tsx`, `app/login/LoginClient.tsx`
- `app/apply/[slug]/page.tsx`, `app/not-found.tsx`
- `app/(public)/terms/page.tsx`, `app/(public)/privacy/page.tsx`, `app/(public)/cookies/page.tsx`

### Admin Application
- `app/admin/layout.tsx`, `app/admin/dashboard/page.tsx`
- `app/admin/applications/page.tsx`, `app/admin/applications/[id]/page.tsx`
- `app/admin/jobs/page.tsx`, `app/admin/people/page.tsx`
- `app/admin/settings/page.tsx`, `app/admin/talent/page.tsx`
- `app/admin/documents/page.tsx`, `app/admin/organization/page.tsx`

### API Routes
- `app/api/admin/jobs/route.ts`, `app/api/admin/applications/route.ts`
- `app/api/admin/applications/[id]/route.ts`, `app/api/admin/people/create/route.ts`
- `app/api/admin/departments/route.ts`, `app/api/admin/settings/route.ts`
- `app/api/applications/route.ts`, `app/api/register/route.ts`
- `app/api/auth/login/route.ts`, `app/api/auth/me/route.ts`
- `app/api/upload/route.ts`, `app/api/upload/talent/route.ts`
- `app/api/stats/route.ts`, `app/api/metadata/route.ts`
- `app/api/files/route.ts`

### Components
- `components/layout/SiteNav.tsx`, `components/layout/SiteFooter.tsx`
- `components/ui/PageHero.tsx`, `components/ui/NoticeBanner.tsx`
- `components/ui/FormCard.tsx`, `components/ui/StatusPill.tsx`
- `components/ui/CTAButtons.tsx`, `components/ui/EmptyState.tsx`
- `components/ui/CookieBanner.tsx`, `components/ui/ToastContainer.tsx`
- `components/ui/index.tsx`
- `components/forms/ApplicationForm.tsx`, `components/apply/JobApplyContent.tsx`

### Libraries
- `lib/auth.ts`, `lib/api-utils.ts`, `lib/rate-limit.ts`
- `lib/supabase.ts`, `lib/supabase-admin.ts`, `lib/supabase-server.ts`
- `lib/domain-config.ts`, `lib/validation/schemas.ts`
- `lib/db.ts`, `lib/email-service.ts`, `lib/toast.ts`

### Configuration & Types
- `types/index.ts`, `proxy.ts`, `vitest.config.ts`, `playwright.config.ts`

---

*Report generated by LLM Council audit framework. All file references include line numbers for direct navigation.*
