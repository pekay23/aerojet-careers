# HTML Sanitization

`lib/sanitize.ts` provides XSS prevention utilities for the portal.

## Functions

### `sanitizeHtml(html: string): string`

Cleans HTML using DOMPurify. Allowed tags and attributes are configured for
safe rich-text rendering:

- **Allowed tags:** `p`, `br`, `strong`, `em`, `u`, `ul`, `ol`, `li`, `a`,
  `h1`–`h6`, `blockquote`, `code`, `pre`
- **Allowed attributes:** `href` (with protocol whitelist), `title`, `class`
- **Removed:** all `on*` event handlers, `javascript:` URLs, `data:` URLs in
  `href`/`src`

```ts
import { sanitizeHtml } from '@/lib/sanitize'
const clean = sanitizeHtml(userInput)
```

### `escapeHtml(text: string): string`

Escapes a plain-text string for safe insertion into HTML:

```ts
import { escapeHtml } from '@/lib/sanitize'
const safe = escapeHtml(userInput) // & → &amp;, < → &lt;, etc.
```

## When to use

- **`sanitizeHtml()`** — when rendering user-generated rich text (future feature)
- **`escapeHtml()`** — when inserting plain user input into HTML contexts
- **React JSX** — React automatically escapes `{value}` insertions, so explicit
  escaping is only needed for `dangerouslySetInnerHTML` (currently unused)

## Current usage

- `lib/api-utils.ts` — `sanitizeSearch()` strips PostgREST/ILIKE special
  characters before building `or()` filters
- `components/ui/` — no current `dangerouslySetInnerHTML` usage

## Future

If rich-text features are added (email templates, job descriptions with markup),
use `sanitizeHtml()` on all server-side input before storage.
