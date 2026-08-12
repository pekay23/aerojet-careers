# Testing

The portal uses **Vitest** for unit/component tests and **Playwright** for E2E
tests.

## Running tests

```bash
bun run test         # Unit tests (Vitest)
bun run test:e2e     # E2E tests (Playwright)
```

## Test structure

```
tests/
  unit/
    auth.test.ts             # Session + JWT validation
    api-utils.test.ts        # ApiResponse, sanitizeErrorMessage, validateOrigin
    validation.test.ts       # Zod schema validation
    security.test.ts         # Input sanitization, SQL injection checks
    refresh-token.test.ts    # Refresh token lifecycle
    rate-limit.test.ts       # Rate limiting logic
    setup.ts                 # Test setup (env, mocks)
  e2e/
    public-flows.spec.ts     # Public site flows (jobs, apply, register)
    admin-flows.spec.ts      # Admin dashboard flows
  auth-routes.test.ts        # Auth route integration tests
```

## Configuration

- **Vitest:** `vitest.config.ts` — V8 coverage, jsdom environment
- **Playwright:** `playwright.config.ts` — Chromium only, baseURL `http://localhost:3000`

## Writing tests

### Unit tests

```ts
import { describe, it, expect } from 'vitest'
import { RegistrationSchema } from '@/lib/validation/schemas'

describe('RegistrationSchema', () => {
  it('accepts valid data', () => {
    const result = RegistrationSchema.safeParse({ first_name: 'John', ... })
    expect(result.success).toBe(true)
  })
})
```

### E2E tests

```ts
import { test, expect } from '@playwright/test'

test('public flow — apply to job', async ({ page }) => {
  await page.goto('/jobs')
  await page.click('[data-testid="job-card"]:first-child')
  await page.click('text=Apply Now')
  await page.fill('[name="first_name"]', 'Test')
  // ...
})
```

## Coverage

Current test suite: **49 unit tests** + **2 E2E specs**.

## CI

Tests run in CI via `bun run test` and `bun run test:e2e`. Both must pass
before merge.
