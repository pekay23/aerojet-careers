# Aerojet Careers — Documentation

All project documentation lives here, organised by purpose. This is the careers
& recruitment portal for Aerojet Aviation (job listings, applications, and the
internal HR/admin dashboard).

## Folder layout

```
docs/
├── README.md                   This index
├── CHANGELOG_2026-08-12.md     Recent UI/UX, validation, and lint fixes
├── AUDIT_REPORT_2026-08-11.md  Full codebase audit report (with 2026-08-12 addendum)
├── AUDIT_DECISIONS.md          Decisions from the audit council
├── UNDONE_ISSUES_2026-08-11.md Tracked issues awaiting future sprints (updated 2026-08-12)
├── architecture/               System reference — overview, database, security, API
│   ├── refresh-tokens.md       Refresh token lifecycle and rotation
│   ├── validation.md           Zod validation patterns and conventions
│   ├── logging.md              Structured JSON logging with redaction
│   ├── rate-limiting.md        Upstash Redis + memory rate limiting
│   ├── sanitization.md         HTML sanitization (DOMPurify) and escapeHtml
│   └── file-storage.md         Custom BYTEA-backed file storage
├── guides/                     Operational how-tos — setup, deployment, migration, handover
│   ├── forms.md                Form component catalog and touched-state pattern
│   ├── testing.md              Vitest + Playwright test guide
│   ├── email.md                Resend email service and templates
│   └── troubleshooting.md      Common issues and debug commands
└── html/                       Generated HTML mirror (build with `bun run docs:html`)
```


## Naming conventions

- Filenames are lowercase `kebab-case` (`system-overview.md`, not `SYSTEM_OVERVIEW.md`).
- Architecture docs describe *how the system is built*; guides describe *how to do something*.

## Architecture

System reference — read these to understand how the portal is built.

- [System overview](./architecture/system-overview.md) — stack, route layout, auth layers
- [Database schema](./architecture/database.md) — tables, relationships, enums
- [Security model](./architecture/security-model.md) — auth flow, roles, route guard
- [API reference](./architecture/api.md) — endpoints + response conventions

## Guides

Operational how-tos — read these to *do* something.

- [Setup](./guides/setup.md) — install, env, schema, seed, run
- [Deployment](./guides/deployment.md) — Vercel deploy + env config
- [Neon migration](./guides/neon-migration.md) — Supabase → Neon runbook + data backup/restore
- [Handover](./guides/handover.md) — onboarding for a new developer

## Stack at a glance

- **Frontend:** Next.js 16 (App Router), React 19, Tailwind CSS 4, shadcn/ui + Radix, Framer Motion
- **Backend:** Next.js API routes (serverless)
- **Database:** PostgreSQL (**Neon**, primary) via `pg` + a Supabase-compatible query builder; **Supabase** retained as secondary/backup
- **Auth:** Local bcrypt + JWT session cookie (replaced Supabase Auth)
- **Storage:** `storage_objects` table served through `/api/files` (replaced Supabase Storage)
- **Email:** Resend
- **Hosting:** Vercel (region `lhr1`), edge route guard in `proxy.ts`

## Rebuilding the HTML mirror

```bash
bun run docs:html      # or: node scripts/build-docs-html.mjs
```

This regenerates every `.md` under `architecture/` and `guides/` into a styled HTML
page at `docs/html/<section>/<slug>.html`, plus a `docs/html/index.html` linking them
all. Internal `.md` links are rewritten to `.html` automatically. The generator lives
at [`scripts/build-docs-html.mjs`](../scripts/build-docs-html.mjs) and uses
[marked](https://marked.js.org/); it writes its own `design-tokens.css` + `docs.css`
into `docs/html/`, so there are no external dependencies. Open
[`docs/html/index.html`](./html/index.html) to browse.


