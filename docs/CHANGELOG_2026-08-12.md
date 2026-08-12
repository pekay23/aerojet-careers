# Aerojet Aviation Careers Portal — Session Changelog

**Date:** 2026-08-12  
**Branch:** main  
**Purpose:** Record UI/UX improvements, form validation enhancements, and code quality fixes applied in this session.

---

## Form Validation UX Overhaul

### Inline Error Messages Removed

Removed visible inline error text (`<p className="field-error">`) from all form inputs across the application. Error messaging is now communicated through:

1. **Red border on touched invalid fields** — `aria-invalid` is set only after a field has been interacted with (`onBlur`) or the user attempts to submit/proceed.
2. **Field-level hint text** — `field-hint` remains for helper text where appropriate.
3. **Server-level error banners** — API validation failures still surface as top-level error boxes (e.g., registration server errors).

**Files changed:**
- `components/forms/FormField.tsx` — removed `field-error` render
- `components/forms/TextArea.tsx` — removed `field-error` render
- `app/register/page.tsx` — removed all inline `<p className="field-error">` elements
- `components/forms/BtnRow.tsx` — removed "Please fix the following:" error banner and `validationErrors` prop

### Touched-State Validation

Added `touched` state tracking to form components so validation feedback only appears after user interaction:

- **`components/forms/FormField.tsx`** — accepts optional `touched?: boolean` prop
- **`components/forms/TextInput.tsx`** — accepts optional `touched?: boolean` prop, passes to `aria-invalid`
- **`components/forms/TextArea.tsx`** — accepts optional `touched?: boolean` prop, passes to `aria-invalid`
- **`components/forms/Select.tsx`** — accepts optional `touched?: boolean` and `onBlur?: () => void` props

**Application form (`components/forms/ApplicationForm.tsx`):**
- Added `touchedFields` state and `touch()` helper
- Every `TextInput`, `Select`, and `TextArea` now has an `onBlur` handler
- `next()` and `submit()` call `markAllTouched()` when validation fails, so all errors appear on attempt to proceed

**Register page (`app/register/page.tsx`):**
- Added `touchedFields` state and `touch()` helper
- Every input and select has an `onBlur` handler
- `handleSubmit()` marks all fields touched when `!canSubmit`

### Friendly Validation Messages

Updated Zod schema error messages from generic text to actionable, field-specific prompts:

| Field | Old Message | New Message |
|-------|-------------|-------------|
| First name | "First name is required" | "Input your first name" |
| Last name | "Last name is required" | "Input your last name" |
| Email | "Invalid email address" | "Enter a valid email" |
| Phone | "Phone number is required" | "Enter your phone number" |
| Nationality | "Nationality is required" | "Select your nationality" |
| Country | "Country of residence is required" | "Select your country of residence" |
| Licence type | "Licence type is required" | "Select your licence type" |
| Current employer | "Current employer is required" | "Enter your current employer" |

**Files changed:**
- `lib/validation/schemas.ts` — updated all `WizardStep*Schema` and `ApplicationStep*Schema` messages
- `app/register/page.tsx` — updated inline `RegistrationSchema` messages

---

## Text Alignment Fixes

Standardized text alignment across the site:

1. **Removed `textAlign: 'justify'`** from job description summary in `components/apply/JobApplyContent.tsx` — justified text creates uneven word spacing on screens.
2. **Centered headings via Tailwind classes** — replaced inline `textAlign: 'center'` with `text-center` in:
   - `app/page.tsx` — "Why Join Aerojet Aviation?"
   - `app/skilled-training/page.tsx` — "Entry Requirements"
3. **Card body text left-aligned** — removed `textAlign: 'center'` from card containers in `app/page.tsx`; only the `<h4>` title remains centered.
4. **Removed redundant `textAlign: 'center'`** from step wizard labels in `components/forms/ApplicationForm.tsx` — parent flex container already centers children.

---

## Link Styling

Added `.text-link` CSS class in `app/globals.css` for consistent underlined links:

```css
a.text-link {
  text-decoration: underline;
  text-underline-offset: 2px;
  border-bottom: none;
}
```

Applied to inline links in `app/graduate-program/page.tsx` that previously used conflicting inline styles.

---

## Mobile Navigation Improvements

**File:** `components/layout/SiteNav.tsx`

- ESC key closes mobile menu
- Backdrop tap closes mobile menu
- Body scroll is locked (`overflow: 'hidden'`) while mobile menu is open

---

## iOS Safari Input Zoom Fix

**Files:** `app/globals.css`, `app/register/page.tsx`, `components/forms/*`

- Raised minimum `font-size` on form inputs to `16px` to prevent iOS Safari auto-zoom on focus.
- Applied `16px` font-size to `.field-input` base class and ensured all inline-styled inputs meet the minimum.

---

## Check Status Responsive Fix

**File:** `app/(public)/check-status/CheckStatusClient.tsx`

- Reduced grid `min-width` from `180px` to `150px` to prevent horizontal overflow on smaller screens.

---

## Job Card Press Feedback

**File:** `app/jobs/JobsClient.tsx`

- Added `.job-card:active` state with `transform: scale(0.985)` and reduced shadow for tactile press feedback on mobile.

---

## Lint & Build Fixes

Fixed 7 pre-existing ESLint errors that would have failed CI:

1. **`components/admin/DashboardStats.tsx`** — renamed imported type to `DashboardStatsType` to resolve `no-redeclare` conflict with component function name.
2. **`scripts/*.mjs`** (6 files) — replaced empty `catch {}` blocks with `catch { /* no-op */ }` to satisfy `no-empty` rule:
   - `scripts/audit-documents.mjs`
   - `scripts/build-docs-html.mjs`
   - `scripts/check-db.mjs`
   - `scripts/fix-recruitment-folder.mjs`
   - `scripts/test-db.mjs`
   - `scripts/verify-documents-route.mjs`

---

## Verification Status

| Check | Result |
|-------|--------|
| TypeScript (`tsc --noEmit`) | Pass |
| ESLint (`eslint .`) | 0 errors (109 pre-existing warnings) |
| Production build (`bun run build`) | Pass |
| Tests (`npx vitest run`) | Pass (49 tests) |

---

## Next Steps

1. Review and merge this branch
2. Address remaining P1 items from `AUDIT_REPORT_2026-08-11.md`:
   - Extract inline form components from `ApplicationForm.tsx`
   - Reduce inline styles across page components
   - Add unit tests for `lib/auth.ts` and `lib/api-utils.ts`
3. Address P0 security items:
   - Rotate `.env.local` secrets
   - Add auth to `/api/upload/talent`
   - Implement CSRF protection
