# Structured Logging

`lib/logger.ts` provides JSON-line structured logging with sensitive-key
redaction. All server-side logs should use this instead of `console.*`.

## Format

Each log line is a JSON object:

```json
{
  "ts": "2026-08-12T22:00:00.000Z",
  "level": "info",
  "msg": "Application submitted",
  "prefix": "applications",
  "correlationId": "abc-123",
  "meta": { "applicationId": "uuid" }
}
```

## Levels

- `debug` — verbose development info (not emitted in production)
- `info` — general informational messages
- `warn` — recoverable issues
- `error` — errors with stack traces

## Redaction

Keys matching `password`, `token`, `secret`, `api_key`, `authorization`,
`cookie`, `set_cookie`, `x-api-key` are automatically redacted to `***` in
`meta` objects.

## Usage

```ts
import { createLogger, withCorrelationId } from '@/lib/logger'

const log = createLogger('my-feature')

log.info('operation started', { userId: '123' })
log.error('operation failed', { error: err.message })
```

## Correlation IDs

Wrap async operations with `withCorrelationId()` to attach a request-scoped
ID to all log lines:

```ts
await withCorrelationId('req-123', async () => {
  // all logs inside here include correlationId: 'req-123'
})
```

## Current usage

- `lib/api-utils.ts` — logs auth failures and rate limit blocks
- `app/api/admin/documents/route.ts` — logs document operations
- API route error handlers — logs unhandled exceptions
