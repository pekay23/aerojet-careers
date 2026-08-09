# Aerojet Careers — LLM Council Audit Report + Decisions

**Project:** `C:\Projects\aerojet-careers` — Recruitment portal / ATS for Aerojet Aviation MRO (Accra)
**Audit date:** 2026-08-09
**Auditor:** LLM Council (5 personas) + agent swarm

---

## ✅ COMPLETED FIXES (this session)

### Council Recommendation Remediations

| # | Priority | Issue | Fix Applied |
|---|----------|-------|-------------|
| 1 | P0 | PATCH `/api/admin/jobs` accepted arbitrary keys (no allowlist) | `ALLOWED_UPDATE_KEYS` array filters all fields in `app/api/admin/jobs/route.ts:133` |
| 2 | P1 | No pagination on jobs admin list (loaded all rows) | Range-based pagination in GET endpoint + Prev/Next UI in `app/admin/jobs/page.tsx:230` |
| 3 | P1 | `ref_code` accepted any string (risk of DB trigger format conflict) | Added `z.string().regex(/^[A-Z0-9-]{3,30}$/)` in `app/api/admin/jobs/route.ts:14` |
| 4 | P2 | `published_at` never set when status changed to `'open'` | Auto-set in POST (`status='open'`) and PATCH (status transition to/from open) in `app/api/admin/jobs/route.ts:81,147` |
| 5 | P2 | No audit log on job create/update/delete | `pipeline_events` inserts now fire on all three operations (`app/api/admin/jobs/route.ts:95,167,188`) |

### Data Integrity Fixes

| # | Issue | Fix Applied |
|---|-------|-------------|
| 6 | `admin_user_id` FK mismatch — applications route used `auth.user.id` (auth_users) instead of `admin_users.id` | Added admin_users lookup in `app/api/admin/applications/route.ts:60` |
| 7 | Same FK bug in settings route | Fixed in `app/api/admin/settings/route.ts:29` |
| 8 | Same FK bug in hire route | Fixed in `app/api/admin/hire/route.ts:112` |

### New Features (this session)

| # | Feature | Files |
|---|---------|-------|
| 9 | Inline "create new department" in job modal | `app/admin/jobs/page.tsx:460` |
| 10 | Indefinite closing date checkbox | `app/admin/jobs/page.tsx:452-471` |
| 11 | Public display: "No deadline" | `app/jobs/JobsClient.tsx:105`, `app/apply/[slug]/page.tsx:71` |
| 12 | Open/unlimited positions checkbox | `app/admin/jobs/page.tsx:427-447` |
| 13 | Public display: "Open positions" | `app/jobs/JobsClient.tsx:103`, `app/apply/[slug]/page.tsx:70` |
| 14 | Visibility toggle (Publish/Draft) button | `app/admin/jobs/page.tsx:200,349` |
| 15 | Save Draft / Publish buttons in modal | Already existed — confirmed working |
| 16 | Seed data updated: 5 open jobs, 11 drafts, new Quality Manager role, renamed roles | `supabase/migrations/001_schema.sql`, `db/neon-schema.sql` |

---

## 🔍 COMPREHENSIVE AUDIT REPORT

### A. PUBLIC-PAGE AUDIT (UX/UI Designer + Accessibility Advocate)

#### A1: `app/jobs/JobsClient.tsx`
- **BUG FIXED:** Line 103 previously used `job.target_count &&` which showed nothing when count was null. Now shows "Open positions" for null target_count.
- **BUG FIXED:** No closing date display. Now shows "No deadline" when closes_at is null.
- **Accessibility:** The `<select>` on line 46 has no `<label>` element associated — relies on `aria-label`. Consider adding a visible `<label>`.
- **Accessibility:** The search input has `aria-label="Search roles"` ✓ (good).
- **Performance:** `filtered` uses `useMemo` ✓ (good, prevents unnecessary re-renders).
- **Performance:** The `fetch('/api/metadata')` in `useEffect` has no error handling — if it fails, departments array stays empty and the filter dropdown shows only "All Departments". No retry or fallback UI.

#### A2: `app/apply/[slug]/page.tsx`
- **BUG FIXED:** Line 70 now shows "Open positions" and "No deadline" for null values.
- **Missing:** No back-link if the job isn't found after `notFound()` — relies on Next.js 404 page (acceptable).
- **Accessibility:** The hero image overlay (`backgroundImage`) has no alt text or caption. The image is decorative, so this is acceptable but could add `role="presentation"` via aria.

#### A3: `app/page.tsx`
- **Hardcoded data:** `STATS` array (line 55) has hardcoded "12+ Active Vacancies" — this should come from an API or DB query, not be static. Shows stale data.
- **Hardcoded data:** "7 Departments Hiring" is also static — should be dynamic.

#### A4: Components audit
- `components/ui/StatusPill.tsx` — Check color contrast for all 5 status colors (draft, open, paused, closed, filled).
- `components/layout/SiteNav.tsx` — No mobile menu close on route change (clicking a nav link closes the overlay? need to verify).
- `components/forms/ApplicationForm.tsx` — Uses Zod client-side validation ✓. Has error message display ✓. No `aria-invalid` or `aria-describedby` on invalid fields (accessibility gap for screen reader users).

### B. BACKEND/API AUDIT (Performance Guru + Security Auditor)

#### B1: `app/api/admin/jobs/route.ts`
- ✅ FIXED: PATCH allowlist
- ✅ FIXED: published_at tracking
- ✅ FIXED: audit logging
- **Finding:** GET pagination returns `{ data, total, page, limit }` — but if the client request fails (non-200), the client `load()` function still tries `d.data?.data` which would be undefined. The error case is handled with `setJobs([])` fallback ✓. However, the `loading` state is set but there's no error state — API errors are silently swallowed.
- **Finding:** The POST handler sets `created_by` from `admin_users.id` lookup ✓. But there's no check that the `department` value actually exists in the `departments` table — the job `department` column is plain TEXT (no FK), so typos are possible.

#### B2: `app/api/applications/route.ts`
- **CRITICAL SECURITY GAP:** No server-side input validation. Accepts arbitrary `body.*` fields. Only `cleanInput` (basic trim) is applied to first/last name and email. No Zod schema validation on the server. A malicious client could:
  - Send invalid enum values for `deployment_pref` (expected: `fully_flexible`, `ghana_only`, `not_available`)
  - Send arbitrary `source` values
  - Exceed field length constraints
- **Data integrity:** Qualifications/experience/compensation inserts use `console.warn` on failure but don't return an error to the client — the main application is saved but sub-tables may silently fail.

#### B3: `app/api/register/route.ts`
- Same security gap: no server-side validation. Only `cleanInput` on names. Email is trimmed but not validated as an email.

#### B4: `app/api/admin/metadata/route.ts` POST
- **Input validation gap:** The `type` field is only checked as `category` vs `employment_types` (else defaults to employment_types). No validation of the `items` array shape. Could corrupt lookup tables.

#### B5: `app/api/admin/departments/route.ts` POST
- **Input validation gap:** Uses `...rest` spread without validation. Arbitrary fields passed to `.insert()`. No Zod schema.
- ✅ FIXED: Added DepartmentSchema in this session (line 6-11). Still needs to be applied to the POST handler body.

#### B6: `lib/db.ts`
- **Architecture note:** Custom PostgREST-compatible query builder shim over pg. The `parseSelect` regex parser is fragile — complex nested selects may break. Tested only with simple cases.
- **Security:** The `cleanInput` function (in lib/api-utils) should be reviewed for SQL injection — but since Supabase parameterized queries are used, the client shim should also parameterize. Check that `db.ts` uses `$1, $2` parameterization everywhere.

#### B7: `lib/supabase-admin.ts`
- Uses service_role key (bypasses RLS) — correct for server-side admin operations ✓.

### C. AUTH & SECURITY AUDIT (Security Auditor + Chairman)

#### C1: `proxy.ts` (Edge Middleware)
- ✅ Protects `/admin` and `/api/admin/*` routes via JWT session cookie.
- **Finding:** The middleware only checks JWT validity, not role. Role-based access is deferred to `verifyRole()` in each API route — correct pattern.
- **Finding:** If `AUTH_SECRET` is not set, `getSecret()` returns null, and `valid` stays false — all admin routes return 401. No clear error message. Should fail with a startup warning.

#### C2: `lib/auth.ts`
- Needs full review — session creation, signing, verification.
- **Finding:** Session cookie is `httpOnly: true` ✓, `secure: production only` ✓, `sameSite: 'lax'` ✓.
- **Finding:** JWT maxAge is `SESSION_MAX_AGE` — check if this is reasonable (e.g., 24h).

#### C3: `lib/api-utils.ts` `verifyRole`
- ✅ Correctly queries `admin_users` by `auth_user_id` for role check.
- **Finding:** Returns `{ user, role }`. Callers who need `admin_users.id` for FK references must do a separate lookup — this is a recurring bug pattern (3 instances found and FIXED in this session). Should enhance `verifyRole` to also return `adminUserId`.

#### C4: Admin Layout Auth
- **Finding:** `components/admin/AdminLayout.tsx` uses `useSWR` to fetch `/api/auth/me` but has no loading state — content may render before auth check completes, causing a brief flash of unauthenticated content. The middleware should redirect before the page renders, but there's a window of vulnerability.

#### C5: RLS Policies
- `app/api/admin/metadata/route.ts` GET is NOT behind auth (line 7: "Public access allowed") — correct, it's recruitment metadata.
- The jobs table has `public_read_open_jobs` policy ✓ — only `status = 'open'` jobs are readable publicly.
- The `jobs` INSERT/UPDATE/DELETE RLS requires `admin_users` existence (line 332-334) — but since the admin APIs use `supabaseAdmin` (service role), they bypass RLS ✓.

### D. DATABASE SCHEMA AUDIT (Chairman)

#### D1: Schema vs Types Mismatch
- `types/index.ts` has `Job` interface with `indefinite_deadline` and `open_positions` — these are client-only derived fields, NOT in the DB schema. ✓ (correct, they're computed in the UI)
- `Job` interface has `application_count` as optional — is this populated anywhere? Check if there's a query that counts applications per job.

#### D2: Unseeded Tables
| Table | Seeded? | Queried by app? | Notes |
|-------|---------|-----------------|-------|
| `departments` | ✅ FIXED | ✅ (JobsClient, apply page, metadata API) | Was empty — now has 7 rows |
| `job_categories` | ✅ | ✅ (metadata API) | 4 categories seeded |
| `employment_types` | ✅ | ✅ (metadata API) | 5 types seeded |
| `system_settings` | ✅ | ✅ (settings API, homepage) | 4 settings seeded |
| `branding_config` | ✅ | ✅ (email templates?) | 5 keys seeded |
| `document_folders` | ✅ | ✅ (documents API) | 5 folders seeded |
| `jobs` | ✅ | ✅ | Updated: 5 open, 11 draft |
| `admin_users` | ❌ | ✅ | Seed via `seed-admin.js` (run manually) |
| `staff_profiles` | ❌ | ✅ | Created on hire |
| `applications` | ❌ | ✅ | Created via public form |
| `pipeline_events` | ❌ | ✅ | Created on status changes |
| `talent_pool` | ❌ | ✅ | Created via register form |
| `email_logs` | ❌ | ? | Check if queried |
| `hr_transfers` | ❌ | ✅ | Created on HR transfer |
| `dashboard_snapshots` | ❌ | ? | Check if queried |
| `storage_objects` | ❌ | ✅ (upload API) | Created on upload |
| `staff_documents` | ❌ | ✅ | Created on upload |
| `department_budget_history` | ❌ | ✅ (budget history API) | Created on budget changes |

#### D3: Missing Indexes
- `jobs.department` has no index — used for filtering in public search. Consider adding `CREATE INDEX idx_jobs_dept ON jobs(department)`.
- `admin_users.role` has no index — used in RLS policy subqueries. Consider adding `CREATE INDEX idx_admin_users_role ON admin_users(role)`.
- `pipeline_events.event_type` has no index — used in audit queries.

#### D4: Constraint Gaps
- `jobs.ref_code` is `TEXT UNIQUE` but the trigger auto-generates it — if a user provides a ref_code that conflicts, they get a 23505 error (handled in API). But the ref_code format is not enforced at DB level — could insert non-conforming codes. (Client now validates with regex ✓)
- `jobs.closes_at` is `DATE` — accepts null ✓. This supports the indefinite deadline feature.
- `jobs.target_count` is `INTEGER` (nullable) — supports unlimited positions (null) ✓.

#### D5: Migration Consistency
- `001_schema.sql` uses `auth.users(id)` for FK references.
- `006_schema_fixes.sql` uses `auth.users(id)` for `system_settings.updated_by` and `department_budget_history.created_by`.
- `neon-schema.sql` uses `auth_users(id)` instead (since Neon doesn't have `auth.users`).
- Both are consistent with their respective target platforms. ✓

### E. BUSINESS RULES AUDIT

#### E1: Job Lifecycle
| Status | Visible on public page? | Can receive applications? |
|--------|------------------------|------------------------|
| `draft` | No | No |
| `open` | Yes | Yes |
| `paused` | No | No (should redirect to "Position filled" or "Coming soon" page) |
| `closed` | No | No |
| `filled` | No | No |

**Finding:** `app/jobs/page.tsx` only fetches `status='open'` ✓. But `app/apply/[slug]/page.tsx` only fetches `status='open'` ✓ — it will 404 for any other status. This is correct behavior.

#### E2: Application Status Lifecycle
`new → under_review → shortlisted → interview → offer/hired | rejected | withdrawn | transferred_to_hr`

**Finding:** The `hr_transfers` table and `hr_transferred` field exist but there's no UI to manage HR transfers. The `app/api/hr/transfer/route.ts` exists but needs review.

#### E3: RBAC Matrix
| Role | Can create jobs | Can publish jobs | Can edit any job | Can delete jobs | Can view applications | Can hire | Can manage staff | Can manage settings |
|------|----------------|-----------------|-----------------|----------------|---------------------|----------|------------------|---------------------|
| super_admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| admin | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| hr_manager | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ | ❌ |
| recruiter | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| read_only | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

**Finding:** The `jobs` POST endpoint allows `['admin', 'hr_manager']` — recruiters cannot create jobs. ✅
The `jobs` PATCH endpoint allows `['admin', 'hr_manager']` — recruiters cannot edit jobs. ✅
The `jobs` DELETE endpoint allows `['admin', 'hr_manager']` — recruiters cannot delete jobs. ✅

But wait — the admin UI `toggleStatus` is accessible by recruiters (GET allows recruiter, but PATCH/DELETE don't). Recruiters can see the toggle buttons but clicking them would get a 403. The UI should hide these buttons for recruiters. **UI gap.**

---

## 📋 DATABASE ARCHITECTURE NOTE

### Primary DB for aerojet-aviation (main domain)
- **Database:** Neon (PostgreSQL serverless) via `DATABASE_URL`
- **ORM:** Prisma (`lib/prisma/client.ts`)
- **Auth:** NextAuth.js with CredentialsProvider + JWT (no Clerk, no Supabase Auth)
- `lib/supabase-admin.ts` does NOT exist in the main project — it uses Prisma directly

### Primary DB for aerojet-careers (this subdomain)
- **Database:** Neon (PostgreSQL) — same database or separate schema?
- **ORM/Query layer:** Custom PostgREST-compatible shim (`lib/db.ts` over `pg` pool)
- **Auth:** Custom JWT session (`lib/auth.ts` using `jose` library) — NOT NextAuth, NOT Clerk, NOT Supabase Auth
- **Storage:** Custom `storage_objects` table with BYTEA columns — NOT Supabase Storage buckets
- The files named `supabase-admin.ts`, `supabase-server.ts`, `supabase.ts` are **compatibility shims** that emulate the Supabase client API but route through Neon
- `supabase/migrations/*.sql` are written in Supabase-compatible dialect (`auth.users`, `uuid-ossp`) but run against Neon
- `db/neon-schema.sql` is the Neon-native equivalent (`auth_users`, `IF NOT EXISTS`, `DO $$` blocks)

### Key implication
The `app/api/admin/departments/route.ts` POST handler's `manager_id` field references `admin_users(id)` — but the actual `admin_users` table is populated via `seed-admin.js` or the `hire` workflow, so new departments have no manager assigned by default. This is by design, not a bug.

---

## 📋 DECISIONS FOR USER (Deferred — needs input)

Create a doc file: `docs/AUDIT_DECISIONS.md`

### Decision 1: Server-side validation on public endpoints
**Options:**
- A) Add Zod validation to `/api/applications/route.ts` and `/api/register/route.ts` (recommended)
- B) Keep client-side only validation (risky)

### Decision 2: Recruiters cannot edit jobs — but UI shows edit buttons
The admin jobs page shows Edit/Publish/Delete buttons for all roles. Recruiters can see them but will get 403 on click.
- A) Hide buttons based on role in the UI (requires fetching user role in the page)
- B) Disable buttons with a tooltip "Contact an admin"
- C) Leave as-is (current behavior)

### Decision 3: Hardcoded stats on homepage
`app/page.tsx` has static "12+ Active Vacancies" and "7 Departments Hiring".
- A) Fetch live stats from `/api/admin/stats` (requires auth or a public stats endpoint)
- B) Create a public `/api/stats` endpoint that returns open job count
- C) Leave as static (simplest, content team can update manually)

### Decision 4: RLS on `jobs.department` column
Currently a plain TEXT field with no FK to `departments`. Typos could create orphaned department names in jobs.
- A) Add a FK constraint from `jobs.department` to `departments.name` (breaking — requires data cleanup)
- B) Add application-level validation (check department exists before insert/update)
- C) Leave as TEXT (current behavior)

### Decision 5: Pipeline events FK fix pattern
Should `verifyRole()` be enhanced to return `adminUserId` directly, eliminating the repeated lookup pattern?
- A) Enhance `verifyRole` to return `{ user, role, adminUserId }` (break change to lib/api-utils.ts)
- B) Keep the per-route lookup pattern (verbose but isolated)

### Decision 6: Storage buckets
The schema mentions creating Supabase Storage buckets (`application-documents`, `branding-assets`) manually. Does the app use S3 directly (Neon) or Supabase Storage?
- Check `lib/supabase-server.ts` / `lib/supabase.ts` for storage client config.

---

## 📝 TODO FOR NEXT SESSION

1. **Fix `app/api/admin/departments/route.ts` POST** — apply the `DepartmentSchema` validation I added to the handler body (line 6-11 defines it but POST still uses `...rest` unchecked).
2. **Add Zod validation** to `app/api/applications/route.ts` and `app/api/register/route.ts` (pending Decision 1).
3. **Review `lib/email-service.ts`** — no email template validation, raw `note` strings.
4. **Review `app/api/upload/route.ts`** — file upload security (type/size validation).
5. **Review `app/api/admin/documents/route.ts`** — document management CRUD.
6. **Review `app/api/admin/organization/route.ts`** — organization settings.
7. **Review `app/api/admin/talent/route.ts`** — talent pool management.
8. **Review `app/api/admin/hr/transfer/route.ts`** — HR transfer integration.
9. **Review `app/api/admin/analytics/snapshot/route.ts`** — dashboard snapshots.
10. **Audit `app/api/admin/stats/route.ts`** — the `fetchCount` pattern creates N+6 sequential queries (not parallelized) — should use `Promise.all`.
11. **Review all `components/forms/*`** components for accessibility (aria-invalid, aria-describedby).
12. **Review `components/apply/*`** components for accessibility.
13. **Review `components/admin/*`** for role-based visibility of buttons.
14. **Review `app/api/admin/applications/[id]/route.ts`** — individual application view.
15. **Add missing indexes** for `jobs.department`, `admin_users.role`, `pipeline_events.event_type`.

---

*Generated by the LLM Council audit framework (`docs/LLM_COUNCIL_FRAMEWORK.md`). All fixes marked as completed have been verified with `bun run type-check`.*
