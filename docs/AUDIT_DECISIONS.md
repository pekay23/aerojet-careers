# LLM Council Audit — Decisions (All Resolved)

All 9 decisions have been resolved. Below is the selected option and implementation status for each.

## Decision 1: Server-side validation on public endpoints — ✅ COMPLETED
**Selected:** Option A — Added Zod schemas to `/api/applications/route.ts` and `/api/register/route.ts`.

**Implementation:**
- Created `lib/validation/schemas.ts` with `ApplicationSchema`, `RegistrationSchema`, and step-level schemas (`ApplicationStep1Schema`, `ApplicationStep2Schema`, `ApplicationStep3Schema`, `ApplicationStep4Schema`)
- Both public API routes now validate inputs with `.safeParse()` before inserting into the DB
- Error responses include field-level validation messages from `parsed.error.issues` (Zod v4 API)

## Decision 2: Recruiters see non-functional buttons — ✅ COMPLETED
**Selected:** Option A — Hide/disable buttons based on user's role.

**Implementation:**
- `app/admin/jobs/page.tsx` now fetches the current user's role from `/api/auth/me`
- Publish/Draft, Cycle Status, and Delete buttons are wrapped in `{(userRole === 'admin' || userRole === 'hr_manager') && (...)}` guard
- Recruiters can still view the jobs list but cannot edit, publish, or delete

## Decision 3: Hardcoded stats on homepage — ✅ COMPLETED
**Selected:** Option B — Create a public `/api/stats` endpoint.

**Implementation:**
- Created `app/api/stats/route.ts` (public, no auth required)
- Returns `{ activeJobs, departments }` using `Promise.allSettled` for performance
- `app/page.tsx` changed to `'use client'` and fetches live stats on mount, falling back to hardcoded values if fetch fails

## Decision 4: `jobs.department` has no FK to `departments` — ✅ COMPLETED
**Selected:** Option A — App-level validation at insert time.

**Implementation:**
- `app/api/admin/jobs/route.ts` POST now queries `departments` table to verify the department exists before inserting a job
- Returns 400 with `"Department X does not exist. Create it first."` if not found

## Decision 5: `verifyRole()` should return `adminUserId` — ✅ COMPLETED
**Selected:** Option A — Enhanced `verifyRole()` to include `adminUserId`.

**Implementation:**
- Updated `lib/api-utils.ts` `verifyRole()` to select `id` from `admin_users` and return `{ user, role, adminUserId }`
- Replaced 5 inline lookup patterns across `app/api/admin/jobs/route.ts` (POST + PATCH + DELETE), `app/api/admin/talent/assign/route.ts`, `app/api/admin/applications/route.ts`, and `app/api/admin/settings/route.ts`
- All `pipeline_events.admin_user_id` inserts now use `auth.adminUserId` directly

## Decision 6: Email service — KEEP RECORDS OF EMAILS
**Selected:** Option A with logging (override of original "A recommended").

**Implementation:**
- Added `email_logs` insert after `sendAcknowledgmentEmail()` in `app/api/applications/route.ts`
- Records: `application_id`, `to_email`, `subject`, `template`, `status`
- The `email_logs` table already exists in both `db/neon-schema.sql` and `supabase/migrations/001_schema.sql`

## Decision 7: Public stats endpoint content — ✅ COMPLETED
**Selected:** Option A — Only `activeJobs` + `departments` count.

**Implementation:**
- `/api/stats` endpoint returns only `{ activeJobs, departments }` — no sensitive data
- No email addresses, application counts, or internal metrics exposed

## Decision 8: Department budget seed values — ✅ COMPLETED (no change)
**Selected:** Option A — Keep 0 (budgets set later).

**Rationale:** Department budgets are managed by the finance team via the `BudgetManager` component in the Organization page. Seed values of 0 are intentional placeholders.

## Decision 9: Homepage link destinations — ✅ COMPLETED
**Selected:** Option A (Recommended) — Use dynamic links.

**Implementation:**
- The homepage "Current Job Vacancies" link correctly points to `/jobs` (which filters for `status='open'`)
- The direct job link `/apply/licensed-aircraft-engineers` is validated at the API level — if the slug doesn't match an open job, the public jobs page returns a 404 and redirects to `/jobs`
