# Email System Audit Report

**Date:** 2026-08-13  
**Project:** aerojet-careers  
**Auditor:** Kilo (CLI)  
**Scope:** Email templates, email service implementation, API routes, logging, configuration, and delivery reliability

---

## Executive Summary

The email system is **functional but minimal**. It uses Resend as the sole transactional email provider with a single hardcoded HTML template for application acknowledgments and one hardcoded template for staff welcome emails. There is no template management UI, no fallback provider, no unsubscribe handling, and limited error observability beyond console logging.

**Overall Grade: C+ (Functional, but needs hardening for production scale)**

| Domain | Grade | Notes |
|--------|-------|-------|
| Delivery | B- | Resend is reliable; no fallback provider |
| Templates | C | Only 2 templates, both hardcoded in TS files |
| Observability | C+ | Email logs table exists but is basic |
| Error handling | C | Failures are logged but not retried automatically |
| Compliance | C | No unsubscribe mechanism, no explicit From name consistency |
| Security | B- | No sensitive data in templates; secrets server-only |

---

## 1. Email Service Implementation

**File:** `lib/email-service.ts`

### Functions

#### `sendWelcomeEmail(email, fullName, tempPassword)`
- **Purpose:** Sends credentials to newly hired staff
- **Template:** Hardcoded HTML inline string
- **From:** `EMAIL_FROM` env var (fallback: `onboarding@aerojet-aviation.com`)
- **Subject:** "Welcome to Aerojet Aviation - Your Staff Account is Ready"
- **Retry:** None — single attempt
- **Logging:** Console.error only (`console.error('Resend error:', error)`)
- **Return:** `{ success: boolean, error?: string }`

**Issues:**
- No retry/backoff on failure (unlike the documented 3-attempt backoff in CLAUDE.md)
- Password sent in plaintext email — acceptable for onboarding but should be flagged as a security consideration
- No template versioning or editing capability

#### `sendAcknowledgmentEmail(to, firstName, lastName, refCode, jobTitle)`
- **Purpose:** Sent automatically when a candidate submits an application
- **Template:** Hardcoded HTML inline string
- **From:** `EMAIL_FROM` env var (fallback: `recruitment@aerojet-aviation.com`)
- **Subject:** `Application received – ${jobTitle} [${refCode}]`
- **Retry:** None — single attempt
- **Logging:** Inserts into `email_logs` table
- **Return:** `{ success: boolean, error?: string }`

**Issues:**
- No retry/backoff
- Template is minimal — no branding, no company logo, no footer with contact details
- No tracking/opens/clicks (not critical for recruitment)

---

## 2. Email Templates

### Current Templates

| Template | Location | Type | Editable? |
|----------|----------|------|-----------|
| Staff Welcome | `lib/email-service.ts:6-52` | Hardcoded HTML | No |
| Application Acknowledgment | `lib/email-service.ts:54-121` | Hardcoded HTML | No |

### Template Gaps

1. **No status change notification template** — When an admin updates an application status (e.g., shortlisted → interview), the candidate should receive a notification email. No template exists for this.
2. **No rejection email template** — Candidates never receive a rejection notification.
3. **No offer letter template** — No template for sending job offers.
4. **No bulk email template** — `sendBulkEmails()` is documented but not implemented.
5. **No email preview in admin UI** — There is an `app/admin/settings/email-templates/` directory referenced in docs but it appears to be empty or non-functional.

### Template Quality

**Staff Welcome Email:**
- ✅ Includes temporary password in a styled box
- ✅ Has login CTA button
- ✅ Has security warning about password sharing
- ❌ No company logo/header image
- ❌ No contact/support information
- ❌ No plain-text alternative (resend SDK may handle this)

**Application Acknowledgment:**
- ✅ Includes reference code and job title
- ✅ Has check-status CTA
- ❌ No branding/logo
- ❌ No footer with company details
- ❌ Minimal styling — looks like a plain email
- ❌ No mention of next steps or timeline

---

## 3. Email API Routes

### `/api/email/acknowledge`
- **File:** `app/api/email/acknowledge/route.ts`
- **Purpose:** Trigger application acknowledgment email after submit
- **Auth:** Not explicitly protected — should verify the application exists and the caller is authorized
- **Implementation:** Calls `sendAcknowledgmentEmail()` directly

### `/api/admin/people/create`
- **File:** `app/api/admin/people/create/route.ts`
- **Purpose:** Creates staff and sends welcome email
- **Auth:** Protected by `verifyRole(['admin', 'hr_manager'])`
- **Implementation:** Calls `sendWelcomeEmail()` after creating the user

### Other email-related routes
- No dedicated route for status change notifications
- No route for bulk emails
- No route for template management

---

## 4. Email Logging

**Table:** `email_logs`

**Columns:**
- `id` (uuid)
- `recipient` (text)
- `subject` (text)
- `template` (text) — only used for acknowledgments (`application_acknowledgement`)
- `status` (text) — `sent` or `failed`
- `provider_id` (text) — Resend message ID
- `error` (text) — error message if failed
- `sent_at` (timestamptz)

**Issues:**
- `template` field is not populated for welcome emails
- No `admin_user_id` to track who triggered the email
- No `application_id` to link emails to applications
- No query/index on `sent_at` for time-range lookups
- No admin UI to view/manage email logs

---

## 5. Configuration

### Environment Variables

| Variable | Required | Used In | Notes |
|----------|----------|---------|-------|
| `RESEND_API_KEY` | Yes | `lib/email-service.ts` | Server-only |
| `EMAIL_FROM` | Yes | `lib/email-service.ts` | Fallbacks differ between functions |
| `NEXT_PUBLIC_APP_URL` | Yes | `lib/email-service.ts` | Used for links in emails |

**Issues:**
- `EMAIL_FROM` fallback is inconsistent:
  - `sendWelcomeEmail`: `onboarding@aerojet-aviation.com`
  - `sendAcknowledgmentEmail`: `recruitment@aerojet-aviation.com`
- No `EMAIL_REPLY_TO` configuration
- No `RESEND_WEBHOOK_SECRET` for delivery webhooks

---

## 6. Security & Compliance

### Positive Findings
- ✅ API keys are server-only (not exposed to browser)
- ✅ No sensitive data logged to console in production paths
- ✅ Resend SDK handles DKIM/DMARC automatically
- ✅ No user passwords or tokens in email templates

### Concerns
- ⚠️ Temporary passwords sent via email — acceptable for onboarding but should force reset on first login
- ⚠️ No unsubscribe mechanism — required for marketing emails, less critical for transactional
- ⚠️ No rate limiting on email sending — a bug could trigger mass emails
- ⚠️ No bounce/complaint handling — Resend can send webhooks for these

---

## 7. Recommendations

### High Priority
1. **Implement retry/backoff** — Add 3-attempt retry to `sendWelcomeEmail` to match the documented behavior
2. **Add status change email template** — Notify candidates when their application status changes
3. **Add rejection email template** — Professional rejection notification
4. **Populate `template` field in welcome email logs** — For consistency with acknowledgment logs

### Medium Priority
5. **Add email template management UI** — Allow admins to edit templates without code changes
6. **Add reply-to header** — Set `reply_to` to `careers@aerojet-aviation.com`
7. **Add Resend webhook handler** — Track bounces, deliveries, and complaints
8. **Add rate limiting** — Prevent mass email abuse

### Low Priority
9. **Improve email branding** — Add company logo and better styling
10. **Add plain-text alternatives** — For accessibility and email clients that block HTML
11. **Consolidate `EMAIL_FROM` fallback** — Use a single default across all functions

---

## 8. Email Logs Schema

```sql
-- Current schema (from neon-schema.sql)
CREATE TABLE IF NOT EXISTS email_logs (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  recipient   TEXT NOT NULL,
  subject     TEXT NOT NULL,
  template    TEXT,
  status      TEXT NOT NULL DEFAULT 'pending',
  provider_id TEXT,
  error       TEXT,
  sent_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Recommended additions:**
```sql
  admin_user_id UUID REFERENCES admin_users(id),  -- who triggered it
  application_id UUID REFERENCES applications(id), -- linked application
  category TEXT DEFAULT 'transactional',  -- transactional vs notification vs system
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

---

## 9. Testing Status

- No unit tests for `lib/email-service.ts`
- No E2E tests for email delivery
- No mock Resend client in tests

**Recommended tests:**
- Unit test: `sendAcknowledgmentEmail` with mock Resend client
- Unit test: `sendWelcomeEmail` with mock Resend client
- Integration test: Verify `email_logs` insertion after send

---

## Appendix: Current Email Flow

```
Application Submit
  → POST /api/applications
  → POST /api/email/acknowledge
  → sendAcknowledgmentEmail()
  → Resend API
  → email_logs insert

Staff Hire
  → POST /api/admin/hire
  → sendWelcomeEmail()
  → Resend API
  → (no email_logs insert)
```
