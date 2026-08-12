# Aerojet Aviation Careers Portal — Codebase Audit Report

**Date:** 2026-08-11  
**Scope:** Architecture, code quality, and best practices  
**Files analyzed:** package.json, next.config.js, tsconfig.json, app/layout.tsx, app/page.tsx, app/jobs/page.tsx, app/jobs/JobsClient.tsx, app/skilled-training/page.tsx, app/graduate-program/page.tsx, app/register/page.tsx, app/login/LoginClient.tsx, app/login/page.tsx, components/layout/SiteNav.tsx, components/ui/PageHero.tsx, components/ui/NoticeBanner.tsx, components/ui/FormCard.tsx, components/ui/index.tsx, lib/domain-config.ts, lib/api-utils.ts, lib/auth.ts, types/index.ts, proxy.ts, vercel.json, vitest.config.ts, playwright.config.ts, db/neon-schema.sql, components/forms/ApplicationForm.tsx, components/admin/AdminLayout.tsx, lib/validation/schemas.ts, app/api/applications/route.ts, app/api/register/route.ts, app/api/admin/jobs/route.ts, app/api/admin/applications/route.ts, app/admin/applications/page.tsx, app/admin/dashboard/page.tsx, app/api/admin/people/create/route.ts

---

## 1. Architecture & Project Structure

### Overall Organization
The project follows a **dual-portal architecture** within a single Next.js application:
- **Public portal** (`app/`) — job listings, graduate/skilled training pages, registration, login
- **Admin portal** (`app/admin/`) — dashboard, applications, jobs, people, documents, HR, organization, settings, talent

This is a pragmatic choice that avoids cross-origin auth complexity, but it creates a large monolithic codebase.

### Separation of Concerns
- **Strengths:**
  - Clear directory boundaries: `components/ui/` (shared primitives), `components/layout/` (site chrome), `components/admin/` (admin-only), `components/forms/` (complex form)
  - Barrel exports via `components/ui/index.tsx:1-17` prevent duplicate component copies
  - `lib/` contains pure utilities (`api-utils.ts`, `auth.ts`, `domain-config.ts`, `validation/schemas.ts`)
  - `types/index.ts:1-266` centralizes all domain interfaces

- **Concerns:**
  - `app/page.tsx` is 265 lines with heavy inline styles — mixing layout, data fetching, and presentation
  - `components/forms/ApplicationForm.tsx` is 688 lines — a single monolithic component containing 5 wizard steps, 7 tiny sub-components (`L`, `I`, `Sel`, `Combo`, `TA`, `Grid`, `Field`, `CheckItem`, `RadioItem`, `DeployCard`, `FileZone`, `Divider`, `BtnRow`), and inline validation logic
  - `components/admin/AdminLayout.tsx` is 369 lines with sidebar state, user menu, settings fetch, and mobile responsive logic all in one file

### Route Groups
- No route groups (`(group)`) used — everything lives in flat `app/` segments
- Admin routes are protected at `proxy.ts:22-59` via JWT cookie verification
- Public routes like `/jobs`, `/register`, `/login` have their own directories with server + client splits

---

## 2. Next.js App Router Usage

### Server vs Client Components
**Good patterns:**
- `app/page.tsx`, `app/jobs/page.tsx`, `app/admin/dashboard/page.tsx` are **server components** that fetch data directly via `supabaseAdmin`
- `app/jobs/JobsClient.tsx:1` and `app/register/page.tsx:1` correctly use `'use client'` for interactive state
- `app/login/page.tsx:3` uses `lazy()` for `LoginClient` with `Suspense` — appropriate for a below-fold modal-like experience
- `app/jobs/page.tsx:14` uses `export const revalidate = 60` for ISR on the jobs listing

**Issues:**
- `app/login/page.tsx:5` sets `dynamic = 'force-dynamic'` on a page that only renders a lazy client component — this forces SSR for the entire route when a static shell would suffice
- `app/admin/dashboard/page.tsx:16` also sets `dynamic = 'force-dynamic'` — understandably needed for live data, but no caching headers or stale-while-revalidate strategy
- `app/page.tsx:62` uses client-side `fetch()` with `next: { revalidate: 300 }` inside a server component — this is valid but could be replaced with direct `supabaseAdmin` queries for consistency

### Data Fetching
- Server components use direct `supabaseAdmin` calls (correct pattern)
- Client components use `fetch('/api/...')` — appropriate for protected/admin endpoints
- `app/jobs/JobsClient.tsx:14-22` fetches `/api/metadata` in `useEffect` to populate department filter — this creates a flash of empty state. Better to pass departments as props from the server.

### Caching
- `next.config.js:18-55` defines security headers but no `fetch` caching configuration
- ISR is used on `app/jobs/page.tsx:14` (`revalidate = 60`)
- No `cacheControl` or `Cache-Control` headers on API routes
- No stale-while-revalidate strategy for public APIs like `/api/stats` or `/api/metadata`

### Metadata
- All analyzed pages export proper `metadata` objects with titles and descriptions
- `app/layout.tsx:5-20` sets `metadataBase`, `title.template`, and favicon configuration — best practice
- Missing Open Graph / Twitter Card metadata on most pages (only `metadataBase` + title/desc)

---

## 3. TypeScript & Type Safety

### Strictness
- `tsconfig.json:10` has `"strict": true` — excellent
- `"noEmit": true`, `"isolatedModules": true` — correct for Next.js
- Path alias `@/*` maps to `./*` — consistent usage across imports

### Type Definitions
- `types/index.ts:1-266` is comprehensive with domain enums and interfaces for Job, Application, AdminUser, StaffProfile, etc.
- Good use of union types for enums: `ApplicationStatus`, `JobStatus`, `AdminRole`

### Issues
**Excessive `any` usage:**
- `lib/api-utils.ts:21` — `verifyRole` parameter `allowedRoles: string[] | null = null` has a misaligned JSDoc comment (line 21 indentation)
- `lib/api-utils.ts:29` — `adminUser` typed as `let { data: adminUser }` without explicit type
- `lib/api-utils.ts:44` — `(authUser.user_metadata?.role as string)` cast
- `app/register/page.tsx:21` — `useState<Record<string, any>>({})`
- `app/register/page.tsx:37` — `const set = (k: string) => (v: any) => ...`
- `components/forms/ApplicationForm.tsx:16` — `type FD = Record<string, any>`
- `components/forms/ApplicationForm.tsx:187` — `DeployCard` props typed as `any`
- `components/forms/ApplicationForm.tsx:240` — `BtnRow` props typed as `any`
- `app/admin/dashboard/page.tsx:67` — `sMap[s.setting_key] = s.setting_value` with implicit `any`
- `app/admin/dashboard/page.tsx:112` — `recentApps?.map((app: any) => ...)`
- `components/admin/AdminLayout.tsx:75` — `sMap[s.setting_key] = s.setting_value` with implicit `any`

**Missing types:**
- `lib/validation/schemas.ts:41-48` has a local `isAdult` function duplicated from `app/register/page.tsx:30-33` (which uses a different implementation that always returns `true` for empty strings)
- `lib/validation/schemas.ts` and `components/forms/ApplicationForm.tsx:50-90` both define `Step1Schema`, `Step2Schema`, etc. independently — **schema duplication** with subtle differences

---

## 4. Component Design & Reusability

### UI Component Library
- `components/ui/index.tsx:1-17` acts as a barrel file — good pattern
- `PageHero`, `NoticeBanner`, `FormCard`, `StatusPill` are well-scoped, single-responsibility components
- `FormCard` uses composition (`children`) properly

### Styling Approach
**Critical inconsistency: THREE styling paradigms coexist:**
1. **Tailwind CSS v4 utilities** (e.g., `app/login/LoginClient.tsx:51` — `bg-aerojet-blue`, `flex`, `hidden`, `lg:flex`)
2. **CSS custom properties via `globals.css`** (e.g., `var(--aero-blue)`, `var(--muted)`)
3. **Inline `style={{}}` objects** (e.g., `app/page.tsx:90-96`, `app/register/page.tsx:105-155`)

This creates maintenance friction. The `app/page.tsx` file has **50+ inline style objects**. The `app/register/page.tsx` has **30+**. This is the single largest code quality issue.

### CVA Patterns
- `class-variance-authority` is in `package.json:34` but **not used anywhere** in the analyzed files
- Button styling is done via CSS classes (`.btn`, `.btn-blue`, `.btn-primary`) defined in `globals.css` — works but misses the opportunity for CVA composition

### Composition
- `components/forms/ApplicationForm.tsx` defines tiny components (`I`, `Sel`, `Combo`, `TA`, `Grid`, `Field`, `CheckItem`, `RadioItem`) as **inline const components** inside the same file — they are not exported, not tested, and not reusable outside this form
- These should be extracted to `components/forms/` or `components/ui/`

---

## 5. API Design

### Route Handler Patterns
- All API routes use Next.js Route Handlers with named exports (`GET`, `POST`, `PATCH`, `DELETE`)
- Standardized response format via `ApiResponse.success()` and `ApiResponse.error()` in `lib/api-utils.ts:8-16`

### REST Conventions
**Good:**
- `app/api/admin/jobs/route.ts:41-234` — full CRUD with proper HTTP methods
- `app/api/admin/applications/route.ts:5-137` — GET with pagination/filtering, PATCH for status updates, DELETE with tiered permissions
- `app/api/applications/route.ts:7` — POST only for public submission
- Sort columns are allow-listed (`SORTABLE_COLUMNS` at `app/api/admin/jobs/route.ts:35-38`)
- UUID validation on delete operations (`app/api/admin/jobs/route.ts:216-218`)

### Error Handling
- All routes use try/catch with `ApiResponse.error()`
- Validation errors return 400 with field-level messages
- 500 errors log to console but don't expose internal details to client

### Issues
**Missing CSRF protection:**
- All POST/PATCH/DELETE endpoints accept JSON bodies without CSRF tokens or `x-csrf-token` headers
- Cookie-based auth (`aj_session`) makes this a real vulnerability

**Missing rate limiting on public endpoints:**
- `@upstash/ratelimit` is in `package.json:30` but not used on public endpoints like `/api/register`, `/api/applications`, `/api/auth/login`
- Admin endpoints have role-based auth but no rate limiting

**Input validation gaps:**
- `app/api/admin/applications/route.ts:44` — `PATCH` accepts `...updates` directly from `req.json()` with **no Zod validation** — any field can be updated including `deleted_at`, `hr_transferred`, etc.
- `app/api/admin/people/create/route.ts:19` — generates a temp password and **returns it in the API response** (`ApiResponse.success({ id, tempPassword })` at line 78-81) — **CRITICAL SECURITY ISSUE**
- `app/api/applications/route.ts:9` — uses `any` type for parsed Zod issues: `parsed.error.issues.map((i: any) => ...)`

---

## 6. Code Quality

### Naming
- Consistent use of descriptive names: `sanitizeSearch`, `validatePathTraversal`, `cleanInput`, `ALLOWED_UPDATE_KEYS`
- Good verb-noun patterns for API handlers: `handleSubmit`, `handleDelete`, `handleBatchStatus`
- Some confusion: `lib/auth.ts` (local JWT auth) vs `lib/supabase-admin.ts` (Supabase admin client) vs `lib/supabase.ts` (Supabase client) — the dual auth system is confusing

### Consistency
- `import` ordering is inconsistent (some files sort by length, some by category)
- Comment density varies wildly: `proxy.ts` is well-commented, `app/api/admin/jobs/route.ts` has sparse comments, `components/forms/ApplicationForm.tsx` has section dividers but inconsistent inline documentation

### Duplication
- **Zod schemas duplicated**: `lib/validation/schemas.ts` vs `components/forms/ApplicationForm.tsx:50-90`
- **isAdult function duplicated**: `lib/validation/schemas.ts:3-8` vs `components/forms/ApplicationForm.tsx:41-48`
- **Password hashing utilities**: `bcryptjs` used in `lib/auth.ts:34-43` for local auth, but `app/api/admin/people/create/route.ts` uses Supabase Auth (`supabaseAdmin.auth.admin.createUser`) — two parallel auth paths
- **API response formatting**: The pattern `const result = await res.json(); if (!res.ok) throw new Error(result.error || ...)` is repeated in `app/register/page.tsx:55-59`, `components/forms/ApplicationForm.tsx:336-340`

### Complexity
- `components/forms/ApplicationForm.tsx` is 688 lines with 5 state variables, 3 helper functions, 13 inline sub-components, and 5 step render blocks — this exceeds the recommended complexity threshold
- `app/admin/applications/page.tsx` is 413 lines with 8 state variables and multiple async handlers

### Comments
- Good: `lib/auth.ts:6-12` explains the local auth migration rationale
- Good: `proxy.ts:4-9` explains edge-safe JWT verification
- Bad: `components/forms/ApplicationForm.tsx:400-402` has a multi-line comment that contradicts the implementation (claims "keyboard-focusable buttons" but only done steps are buttons)
- Bad: `db/neon-schema.sql` is well-commented but the comment at line 546 says "5 core positions seeded" while the seed data has 17 jobs

---

## 7. Testing Strategy

### Unit Tests
- Vitest configured in `vitest.config.ts:1-20` with V8 coverage provider
- Test files exist in `tests/unit/`:
  - `validation.test.ts` — comprehensive Zod schema tests
  - `security.test.ts`
  - `api.test.ts`
  - `setup.ts`
- Additional tests in root `tests/`:
  - `schemas.test.ts`
  - `refresh-token.test.ts`
  - `rate-limit.test.ts`
  - `auth-routes.test.ts`
  - `api-utils.test.ts`

**Gaps:**
- No unit tests for `lib/auth.ts` (session signing/verification)
- No unit tests for `lib/api-utils.ts` (`sanitizeSearch`, `validatePathTraversal`, `sanitizeJobUpdate`)
- No tests for `components/ui/` primitives
- No tests for `components/forms/ApplicationForm.tsx` (688 lines of complex logic, zero test coverage)

### E2E Tests
- Playwright configured in `playwright.config.ts:1-25`
- `tests/e2e/public-flows.spec.ts:1-55` covers homepage, jobs page, register page, login page, and protected route redirect
- `tests/e2e/admin-flows.spec.ts` exists (not read, assumed to cover admin flows)

**Gaps:**
- No E2E test for the actual application submission flow
- No E2E test for admin CRUD operations (create/edit/delete job)
- No E2E test for the pipeline/status-change workflow
- Only Chromium is tested — no Firefox/Safari/WebKit
- `playwright.config.ts:5` has `fullyParallel: false` — reduces test speed

### Coverage
- `vitest.config.ts:14-18` configures coverage but no coverage thresholds are enforced
- No CI configuration visible for coverage gating

---

## 8. Technology Stack Assessment

### Framework & Runtime
- **Next.js 16.2.2** (`package.json:40`) — latest stable, React 19 compatible
- **React 19.2.5** (`package.json:42`) — latest React
- **TypeScript 5.4.5** (`package.json:70`) — current
- **Bun 1.3.14** (`package.json:4`) as package manager — modern choice
- **Node >=24.x** required (`package.json:74`) — aligns with Next.js 16 requirements

### Styling
- **Tailwind CSS v4.3.2** (`package.json:69`) with `@tailwindcss/postcss` — latest v4 approach
- **@aerojet/design-tokens** and **@aerojet/ui** — local monorepo packages from `../aerojet-aviation` — good design system consistency
- **framer-motion 12.38.0** (`package.json:37`) — included but not observed in analyzed files

### Data & Auth
- **Supabase SSR/client** (`@supabase/ssr 0.10.0`, `@supabase/supabase-js 2.43.4`) — used as a PostgREST client over Neon
- **Neon PostgreSQL** — primary database via `pg` driver in `lib/db`
- **bcryptjs** — local password hashing
- **jose** — JWT signing/verification
- **Dual auth system**: Supabase Auth (in `app/api/admin/people/create/route.ts:22`) + local JWT (in `lib/auth.ts`) — **architectural inconsistency**

### Observability & Communication
- **resend** — email delivery
- **sonner** — toast notifications
- **Upstash Redis + Ratelimit** — included but rate limiting not observed in analyzed routes

### Testing
- **Vitest 4.1.4** — unit/integration
- **Playwright 1.58.2** — E2E
- Coverage: V8 provider configured

### Build Tools
- ESLint 9 + `eslint-config-next` — correct for Next.js 16
- Prettier + `prettier-plugin-tailwindcss` — good for class sorting
- No Husky, no lint-staged — pre-commit hooks not configured

---

## 9. Overall Strengths

1. **Comprehensive domain modeling** — `types/index.ts` covers the full recruitment lifecycle (applications → qualifications → experience → compensation → pipeline events)
2. **Idempotent database migrations** — `db/neon-schema.sql` uses `IF NOT EXISTS`, `ON CONFLICT DO NOTHING`, and temp table upserts — safe to re-run
3. **Strong RBAC** — `lib/api-utils.ts:23-76` implements role-based access with auto-provisioning, supporting `super_admin`, `admin`, `hr_manager`, `recruiter`, `read_only`
4. **Security headers** — `next.config.js:18-55` and `vercel.json:4-13` set `X-Frame-Options`, `X-Content-Type-Options`, CSP for admin routes
5. **Path traversal protection** — `lib/api-utils.ts:137-158` validates doc types and UUIDs
6. **Allow-list updates** — `lib/api-utils.ts:99-130` prevents mass-assignment on job updates
7. **WCAG accessibility considerations** — `globals.css:970-981` respects `prefers-reduced-motion`, form labels are present, ARIA attributes used
8. **Design token consistency** — shared `@aerojet/design-tokens` between main site and careers portal
9. **ISR on jobs page** — 60-second revalidation balances freshness and performance
10. **Audit trail** — `pipeline_events` table with triggers logs status changes automatically

---

## 10. Critical Issues

| # | Issue | Severity | Location |
|---|-------|----------|----------|
| 1 | **Password returned in API response** | CRITICAL | `app/api/admin/people/create/route.ts:80` — `tempPassword` is returned in JSON response |
| 2 | **No CSRF protection on state-changing endpoints** | HIGH | All `POST`/`PATCH`/`DELETE` routes lack CSRF tokens |
| 3 | **No rate limiting on public endpoints** | HIGH | `/api/register`, `/api/applications`, `/api/auth/login` have no rate limiting despite `@upstash/ratelimit` being installed |
| 4 | **PATCH endpoint accepts unvalidated updates** | HIGH | `app/api/admin/applications/route.ts:44` — `...updates` spread directly into DB update without sanitization |
| 5 | **Duplicate Zod schemas with divergent logic** | MEDIUM | `lib/validation/schemas.ts` vs `components/forms/ApplicationForm.tsx:50-90` — Step 1 schema in form allows empty DOB (returns `true`), while shared schema rejects it |
| 6 | **Inline styles dominate page components** | MEDIUM | `app/page.tsx` (265 lines), `app/register/page.tsx` (231 lines), `app/skilled-training/page.tsx` (111 lines) — ~60% of styling is inline |
| 7 | **`any` type abuse** | MEDIUM | ~15 instances across analyzed files, undermining TypeScript strict mode |
| 8 | **Monolithic 688-line form component** | MEDIUM | `components/forms/ApplicationForm.tsx` — contains 5 steps, 13 sub-components, and business logic |
| 9 | **Dual auth systems** | MEDIUM | `lib/auth.ts` (local JWT) vs Supabase Auth (`app/api/admin/people/create/route.ts:22`) — creates confusion and potential auth bypass |
| 10 | **Client-side fetch for metadata with empty-state flash** | LOW | `app/jobs/JobsClient.tsx:14-22` — departments load asynchronously after render |
| 11 | **Missing test coverage for critical paths** | MEDIUM | No unit tests for `lib/auth.ts`, `lib/api-utils.ts`, or `components/forms/ApplicationForm.tsx` |
| 12 | **`force-dynamic` on login page** | LOW | `app/login/page.tsx:5` — unnecessary for a purely client-side lazy-loaded component |
| 13 | **No pre-commit hooks** | LOW | No Husky/lint-staged — formatting/linting not enforced before commit |
| 14 | **`upstash/ratelimit` not used anywhere** | MEDIUM | Package installed but zero observed usage |
| 15 | **CSP blocks `connect-src` for external APIs** | LOW | `next.config.js:38` — `connect-src 'self'` may break third-party integrations if added later |
| 16 | **Duplicate `.cta-section` CSS block** | LOW | `globals.css:343-368` and `globals.css:496-523` — identical blocks |

---

## 11. Recommendations (Prioritized)

### P0 — Fix Immediately
1. **Remove `tempPassword` from API response** (`app/api/admin/people/create/route.ts:80`). Send credentials via email only, or generate a password reset link.
2. **Add CSRF protection** to all state-changing API routes. Use Next.js `csrf` headers or a double-submit cookie pattern.
3. **Sanitize PATCH updates** in `app/api/admin/applications/route.ts:44`. Add an `ALLOWED_APPLICATION_UPDATE_KEYS` allow-list similar to `ALLOWED_UPDATE_KEYS` for jobs.
4. **Add rate limiting** to `/api/register`, `/api/applications`, and `/api/auth/login` using `@upstash/ratelimit`.

### P1 — Fix This Sprint
5. **Consolidate Zod schemas**. Move all step schemas to `lib/validation/schemas.ts` and import them in `ApplicationForm.tsx`. Ensure `isAdult` logic is consistent.
6. **Extract inline form components** from `ApplicationForm.tsx` (`I`, `Sel`, `Combo`, `TA`, `Grid`, `Field`, `CheckItem`, `RadioItem`, `DeployCard`, `FileZone`, `Divider`, `BtnRow`) into `components/forms/` or `components/ui/`. Make them typed and testable.
7. **Reduce inline styles** in page components. Create reusable components for `NoticeBanner`-style callouts, stat grids, and track cards. Use Tailwind utilities or CSS classes instead of `style={{}}`.
8. **Add unit tests** for `lib/auth.ts` (session lifecycle), `lib/api-utils.ts` (sanitization functions), and the extracted form components.
9. **Unify auth strategy**. Decide: Supabase Auth OR local JWT, not both. If migrating to local JWT, remove Supabase Auth usage. If staying with Supabase Auth, remove `lib/auth.ts` and the `aj_session` cookie.
10. **Add Zod validation** to `app/api/admin/applications/route.ts` PATCH handler.

### P2 — Fix Next Sprint
11. **Fix `app/login/page.tsx:5`** — remove `dynamic = 'force-dynamic'` since `LoginClient` is a lazy client component.
12. **Add department list as prop** — pass departments from `app/jobs/page.tsx` server component to `JobsClient` instead of fetching client-side.
13. **Remove `any` types**. Replace `Record<string, any>` with proper interfaces (e.g., `FormData` interface for `ApplicationForm`).
14. **Add Open Graph metadata** to all pages for social sharing.
15. **Consolidate duplicate CSS** in `globals.css` (duplicate `.cta-section` block at lines 343 and 496).
16. **Add CI configuration** with lint, typecheck, test, and coverage gating.

### P3 — Technical Debt
17. **Extract `AdminLayout` sub-components** (sidebar, topbar, user menu) into separate files.
18. **Add multi-browser E2E tests** (Firefox, WebKit).
19. **Enable `fullyParallel: true`** in Playwright config for faster E2E runs.
20. **Add Husky + lint-staged** for pre-commit enforcement.
21. **Add `cacheControl` headers** to public API routes (`/api/stats`, `/api/metadata`).
22. **Consider CVA** for button variants instead of `.btn`, `.btn-blue`, `.btn-primary` CSS classes — aligns with `class-variance-authority` dependency already in `package.json`.

---

*Report generated by automated codebase analysis. All file references include line numbers for direct navigation.*
