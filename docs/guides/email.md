# Email

The portal uses **Resend** for transactional email. The email service is
wrapped in `lib/email-service.ts` with automatic retry and logging.

## Core functions

### `sendEmail(to, subject, html, from?)`

Sends a single email via Resend. Falls back to `EMAIL_FROM` if no sender is
specified.

### `sendBulkEmails(recipients, subject, html, from?)`

Sends the same email to multiple recipients. Processes in batches to avoid
rate limits.

## Retry strategy

Both functions implement a 3-attempt backoff:

1. First attempt: immediate
2. Second attempt: 1 second delay
3. Third attempt: 2 seconds delay

Failures after 3 attempts are returned to the caller.

## Templates

Email templates are stored as React components in
`app/admin/settings/email-templates/` and rendered server-side before sending.

Current templates:
- **Application acknowledgment** — sent automatically on application submit
- **Status change notification** — sent when admin updates application stage
- **Credentials** — sent when admin creates a new staff member

## Logging

Every send is logged to the `email_logs` table:

```sql
email_logs
  id          uuid
  recipient   text
  subject     text
  provider_id text       -- Resend message ID
  status      text       -- sent, delivered, bounced, failed
  error       text       -- provider error message
  sent_at     timestamptz
```

## Acknowledgment flow

```
POST /api/applications
  → validate + insert application
  → POST /api/email/acknowledge
    → render acknowledgment template
    → sendEmail(applicant.email, subject, html)
    → insert email_log
```

Email failures are non-blocking — the application is still created even if the
acknowledgment fails.

## Configuration

| Env var | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Default sender address |
