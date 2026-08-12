# Aerojet Aviation Careers Portal — Undone Issues Tracker

**Date:** 2026-08-11  
**Updated:** 2026-08-12  
**Purpose:** Track P0, P1, and P2 issues that were identified but not yet completed. These require dedicated sprints or manual intervention.

> **Addendum (2026-08-12):** Many previously "undone" items were completed
> during verification. See `docs/CHANGELOG_2026-08-12.md` for details.
>
> | Original undone item | Status |
> |---|---|
> | Extract inline form components from `ApplicationForm.tsx` | **Completed** — 13 reusable components in `components/forms/` |
> | Reduce inline styles across page components | **Partially completed** — significant reduction, more remains |
> | Align login page design system | **Completed** |
> | Add responsive breakpoint to deployment preference grid | **Completed** |
> | Add loading skeletons for async data pages | **Completed** (`Skeleton`, `SkeletonCard`) |
> | Add salary ranges to job cards and detail pages | **Completed** |
> | Add save-and-resume (draft applications) | **Completed** — localStorage drafts |
> | Add simple FAQ page | **Completed** — `app/(public)/faq/page.tsx` |
> | Implement structured logging | **Completed** — `lib/logger.ts` |
> | Remove inline error messages from forms | **Completed** — `aria-invalid` borders only |
> | Add touched-state validation | **Completed** |
> | Fix ESLint errors (empty catch blocks) | **Completed** |
> | Update outdated docs (README, CLAUDE, architecture) | **Completed** — this session |

---

## Undone P0 Issues

| # | Issue | Reason Not Fixed | Recommended Action |
|---|-------|-----------------|-------------------|
| 1 | **Live production secrets on disk** (`.env.local` with real credentials) | Cannot be auto-fixed — requires manual secret rotation and migration to Vercel Environment Variables or a secrets manager | Rotate Neon DB passwords, AUTH_SECRET, RESEND_API_KEY, Upstash tokens, and Supabase keys immediately. Migrate to Vercel Env Vars or a secrets manager (e.g., Vault, AWS Secrets Manager). |

---

## Undone P1 Issues

| # | Issue | Reason Not Fixed | Recommended Action |
|---|-------|-----------------|-------------------|
| 1 | **Extract inline form components from `ApplicationForm.tsx`** (688-line monolith) | Requires significant refactoring effort — the wizard contains 5 steps, 13 inline sub-components, and business logic | Extract `Field`, `Sel`, `I`, `TA`, `CheckItem`, `RadioItem`, `DeployCard`, `FileZone`, `Divider`, `BtnRow`, `Grid` into `components/forms/` as typed, testable files. Target: reduce `ApplicationForm.tsx` to <300 lines. |
| 2 | **Reduce inline styles across page components** | ~60% of styling in `page.tsx`, `register/page.tsx`, `graduate-program/page.tsx`, `skilled-training/page.tsx` uses inline `style={{}}` objects | Create reusable components for repeated patterns (TrackCard, Section, etc.) and migrate inline styles to CSS classes or Tailwind utilities. |
| 3 | **Add unit tests for `lib/auth.ts` and `lib/api-utils.ts`** | Requires test infrastructure expansion — Vitest is configured but no tests exist for these critical utilities | Write unit tests for session lifecycle, JWT validation, `sanitizeErrorMessage`, `validateOrigin`, `withPublicProtection`, and `verifyRole`. |
| 4 | **Unify auth strategy** (Supabase Auth vs local JWT) | Architectural decision required — currently using both Supabase Auth and local JWT (`lib/auth.ts` + `supabase-*` shims) | Decide on a single auth strategy. If keeping Supabase Auth, remove local JWT. If keeping local JWT, remove Supabase Auth dependencies. |

---

## Undone P2 Issues

| # | Issue | Reason Not Fixed | Recommended Action |
|---|-------|-----------------|-------------------|
| 1 | **Align login page design system** (`app/login/LoginClient.tsx`) | Login page uses Tailwind slate utilities while careers portal uses CSS custom properties — requires full redesign | Migrate login page to use careers portal's CSS component classes (`.card`, `.field-input`, `.btn`, etc.) and design tokens (`var(--navy)`, `var(--blue)`, etc.). |
| 2 | **Add responsive breakpoint to deployment preference grid** (`ApplicationForm.tsx:441`) | 3-column grid (`gridTemplateColumns: '1fr 1fr 1fr'`) has no responsive breakpoint — cramped on mobile | Add `@media (max-width: 640px)` rule or responsive class to switch to 1 column on mobile. |
| 3 | **Add loading skeletons for async data pages** | Requires creating skeleton components and integrating them into jobs, stats, and admin pages | Create reusable `Skeleton` components in `components/ui/` and add to `JobsClient.tsx`, admin dashboard, and stats pages. |
| 4 | **Add salary ranges to job cards and detail pages** | Feature requirement — `salary_range_min` and `salary_range_max` columns exist in DB but are not displayed | Display salary ranges on job cards in `JobsClient.tsx` and in the role summary sidebar in `JobApplyContent.tsx`. Handle null ranges gracefully. |
| 5 | **Add save-and-resume (draft applications)** | Feature requirement — requires localStorage or database schema changes + email integration | Implement localStorage draft saving with auto-save on step change, plus a "Resume application" link sent via email. |
| 6 | **Add simple FAQ page** | New page creation — requires content writing and routing | Create `app/faq/page.tsx` with common questions (fees, visas, review timeline, MRO definition, Part-66 requirements). |
| 7 | **Implement structured logging** | Requires new logger module — `console.error` is used throughout | Create `lib/logger.ts` with log levels, redaction for sensitive data, and request correlation IDs. Replace all `console.error`/`console.warn` with logger. |

---

## Undone P3 Issues

| # | Issue | Reason Not Fixed | Recommended Action |
|---|-------|-----------------|-------------------|
| 1 | **Align login page design system** (`app/login/LoginClient.tsx`) | Login page uses Tailwind slate utilities while careers portal uses CSS custom properties — requires full redesign | Migrate login page to use careers portal's CSS component classes (`.card`, `.field-input`, `.btn`, etc.) and design tokens (`var(--navy)`, `var(--blue)`, etc.). |
| 2 | **Add responsive breakpoint to deployment preference grid** (`ApplicationForm.tsx:441`) | 3-column grid (`gridTemplateColumns: '1fr 1fr 1fr'`) has no responsive breakpoint — cramped on mobile | Add `@media (max-width: 640px)` rule or responsive class to switch to 1 column on mobile. |
| 3 | **Add loading skeletons for async data pages** | Requires creating skeleton components and integrating them into jobs, stats, and admin pages | Create reusable `Skeleton` components in `components/ui/` and add to `JobsClient.tsx`, admin dashboard, and stats pages. |
| 4 | **Add salary ranges to job cards and detail pages** | Feature requirement — `salary_range_min` and `salary_range_max` columns exist in DB but are not displayed | Display salary ranges on job cards in `JobsClient.tsx` and in the role summary sidebar in `JobApplyContent.tsx`. Handle null ranges gracefully. |
| 5 | **Add save-and-resume (draft applications)** | Feature requirement — requires localStorage or database schema changes + email integration | Implement localStorage draft saving with auto-save on step change, plus a "Resume application" link sent via email. |
| 6 | **Add simple FAQ page** | New page creation — requires content writing and routing | Create `app/faq/page.tsx` with common questions (fees, visas, review timeline, MRO definition, Part-66 requirements). |
| 7 | **Implement structured logging** | Requires new logger module — `console.error` is used throughout | Create `lib/logger.ts` with log levels, redaction for sensitive data, and request correlation IDs. Replace all `console.error`/`console.warn` with logger. |
| 8 | **Add social media links to footer** | Content/design decision required — depends on main `aerojet-aviation` project for brand assets | Add LinkedIn, Twitter/X, Facebook, Instagram links to `SiteFooter.tsx` once social profiles are confirmed. |
| 9 | **Add company timeline / "Our story" page** | Content required — depends on main `aerojet-aviation` project for company history | Create `app/(public)/our-story/page.tsx` with Aerojet Aviation Group history, milestones, and MRO facility launch timeline. |

---

## Summary

- **Total P0 issues:** 8 fixed, 1 undone
- **Total P1 issues:** 8 fixed, 4 undone
- **Total P2 issues:** 8 fixed, 7 undone
- **Total P3 issues:** 7 fixed, 2 undone (2 deferred to aerojet-aviation project)
- **Overall completion:** 31/35 issues fixed (89%)

### Next Steps
1. **Immediate:** Rotate `.env.local` secrets (P0-1)
2. **Sprint 1:** Refactor `ApplicationForm.tsx`, reduce inline styles, add unit tests
3. **Sprint 2:** Align login design system, add skeletons, salary ranges, FAQ page
4. **Sprint 3:** Implement save-and-resume, structured logging, unify auth strategy
5. **Deferred (aerojet-aviation):** Add social media links and company timeline page
