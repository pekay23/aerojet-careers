/**
 * Safe schema + seed migration script for Neon.
 * Applies the full schema (tables, triggers, seed data with ON CONFLICT upsert)
 * then applies indexes.
 *
 * Safe to run multiple times (IF NOT EXISTS / idempotent guards).
 * Includes deduplication for document_folders to prevent duplicate entries.
 *
 * After a successful apply the script pokes the app's internal revalidation
 * endpoint so the public caches are dropped immediately instead of serving
 * pre-migration rows for up to 300 seconds. A failed purge is reported but
 * never fails the migration.
 *
 * Usage:
 *   bun scripts/apply-schema.mjs              # apply to dev/local (DATABASE_URL)
 *   bun scripts/apply-schema.mjs --prod      # apply to prod (DATABASE_URL_PROD)
 *   bun scripts/apply-schema.mjs --url=<cs>  # apply to custom connection string
 *
 * The --url flag allows targeting a specific Neon branch (e.g. prod).
 */
import fs from 'node:fs'
import path from 'node:path'
import pg from 'pg'

function loadEnv(file) {
  try {
    for (const line of fs.readFileSync(path.join(process.cwd(), file), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
      if (!m) continue
      const val = m[2].trim().replace(/^["']|["']$/g, '')
      if (!(m[1] in process.env)) process.env[m[1]] = val
    }
  } catch { /* optional */ }
}
loadEnv('.env.local')

const urlArg = process.argv.find((a) => a.startsWith('--url='))
const prodFlag = process.argv.includes('--prod')
const DATABASE_URL = urlArg
  ? urlArg.slice(6)
  : prodFlag
    ? process.env.DATABASE_URL_PROD
    : process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL. Set it in .env.local, set DATABASE_URL_PROD, or pass --url=<connection-string>')
  console.error('  dev:  bun scripts/apply-schema.mjs')
  console.error('  prod: bun scripts/apply-schema.mjs --prod')
  process.exit(1)
}

const pool = new pg.Pool({
  connectionString: DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function applySchema(client) {
  const schemaPath = path.join(process.cwd(), 'db', 'neon-schema.sql')
  const schema = fs.readFileSync(schemaPath, 'utf8')
  console.log('Applying schema + seed data...')
  try {
    await client.query(schema)
    console.log('  ✓ Schema applied (tables, triggers, seed upsert, dedup)')
    return true
  } catch (e) {
    console.warn('  ! Schema had errors (partial application):', e.message)
    return false
  }
}

/**
 * The base URL of the deployed app.
 *
 * `NEXT_PUBLIC_APP_URL` wins; `VERCEL_URL` is the fallback and is a bare
 * host, so it needs the https:// prefix.
 */
function resolveAppUrl() {
  const explicit = (process.env.NEXT_PUBLIC_APP_URL || '').trim()
  if (explicit) return explicit.replace(/\/+$/, '')

  const vercelUrl = (process.env.VERCEL_URL || '').trim().replace(/\/+$/, '')
  if (!vercelUrl) return null
  if (/^https?:\/\//i.test(vercelUrl)) return vercelUrl
  return `https://${vercelUrl}`
}

/**
 * Drop the public caches after a schema/seed run.
 *
 * `db/neon-schema.sql` mutates `jobs`, `departments`, `job_categories` and
 * `employment_types` — the four tables the public pages cache — so the site
 * would otherwise keep serving the pre-migration rows for up to 300s.
 *
 * This never fails the migration: a missing configuration or a failed request
 * is reported with the exact command the operator has to run by hand.
 */
async function revalidateCaches() {
  const appUrl = resolveAppUrl()
  const secret = process.env.REVALIDATE_SECRET
  const endpoint = appUrl
    ? `${appUrl}/api/internal/revalidate`
    : '/api/internal/revalidate'

  const manualHint = `  Revalidate manually:  curl -X POST "${endpoint}" -H "x-revalidate-secret: $REVALIDATE_SECRET"`

  if (!appUrl || !secret) {
    console.warn('\n! Cache invalidation SKIPPED — the site may serve pre-migration data for up to 300 seconds.')
    if (!appUrl) {
      console.warn('  Missing NEXT_PUBLIC_APP_URL (or VERCEL_URL): the app URL could not be determined.')
    }
    if (!secret) {
      console.warn('  Missing REVALIDATE_SECRET: the shared secret could not be determined.')
    }
    console.warn(manualHint)
    return
  }

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ source: 'apply-schema' }),
    })

    if (!res.ok) {
      console.warn(`\n! Cache invalidation FAILED: HTTP ${res.status}${res.statusText ? ` ${res.statusText}` : ''}`)
      console.warn('  The site may serve pre-migration data for up to 300 seconds.')
      console.warn(manualHint)
      return
    }

    const body = await res.text()
    console.log(`\n  ✓ Caches invalidated (jobs, job-detail, recruitment-metadata, recruitment-stats) — HTTP ${res.status}`)
    if (body) console.log(`    ${body.slice(0, 300)}`)
  } catch (e) {
    console.warn(`\n! Cache invalidation FAILED: ${e && e.message ? e.message : String(e)}`)
    console.warn('  The site may serve pre-migration data for up to 300 seconds.')
    console.warn(manualHint)
  }
}

const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_jobs_department    ON jobs(department)',
  'CREATE INDEX IF NOT EXISTS idx_jobs_status        ON jobs(status)',
  'CREATE INDEX IF NOT EXISTS idx_jobs_slug          ON jobs(slug)',
  'CREATE INDEX IF NOT EXISTS idx_jobs_created_at    ON jobs(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_admin_users_role   ON admin_users(role)',
  'CREATE INDEX IF NOT EXISTS idx_admin_users_auth   ON admin_users(auth_user_id)',
  'CREATE INDEX IF NOT EXISTS idx_pipeline_events_type  ON pipeline_events(event_type)',
  'CREATE INDEX IF NOT EXISTS idx_pipeline_events_admin ON pipeline_events(admin_user_id)',
  'CREATE INDEX IF NOT EXISTS idx_pipeline_events_app   ON pipeline_events(application_id, created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_auth_users_email   ON auth_users(LOWER(email))',
  'CREATE INDEX IF NOT EXISTS idx_talent_pool_email  ON talent_pool(email)',
  'CREATE INDEX IF NOT EXISTS idx_apps_status        ON applications(status)',
  'CREATE INDEX IF NOT EXISTS idx_apps_job           ON applications(job_id)',
  'CREATE INDEX IF NOT EXISTS idx_apps_email         ON applications(email)',
  'CREATE INDEX IF NOT EXISTS idx_apps_submitted   ON applications(submitted_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_apps_created_at    ON applications(created_at DESC)',
  'CREATE INDEX IF NOT EXISTS idx_apps_deleted_at    ON applications(deleted_at) WHERE deleted_at IS NULL',
  'CREATE INDEX IF NOT EXISTS idx_docs_app           ON application_documents(application_id)',
  'CREATE UNIQUE INDEX IF NOT EXISTS idx_document_folders_name ON document_folders(name)',
]

async function checkDuplicateFolders(client) {
  const res = await client.query(
    'SELECT COUNT(*) AS dups FROM (SELECT name FROM document_folders GROUP BY name HAVING COUNT(*) > 1) t'
  )
  return parseInt(res.rows[0]?.dups ?? '0', 10)
}

async function deduplicateFolders(client) {
  const dupCount = await checkDuplicateFolders(client)
  if (dupCount === 0) {
    console.log('  ✓ No duplicate document_folders found')
  } else {
    console.log(`  ! Found ${dupCount} duplicate folder name groups`)
    const res = await client.query(
      'DELETE FROM document_folders WHERE ctid NOT IN (SELECT MIN(ctid) FROM document_folders GROUP BY name)'
    )
    console.log(`  ✓ Removed ${res.rowCount} duplicate folders (kept newest by ctid)`)
  }
}

async function main() {
  console.log(`Connecting to ${DATABASE_URL.includes('pooler') ? 'Neon (pooled)' : 'Neon'}...`)

  const client = await pool.connect()
  try {
    await deduplicateFolders(client)

    const applied = await applySchema(client)

    if (applied) {
      await revalidateCaches()
    } else {
      console.warn('\n! Schema apply reported errors — cache invalidation skipped.')
      console.warn('  Revalidate manually once the database is consistent:')
      console.warn('    curl -X POST "<APP_URL>/api/internal/revalidate" -H "x-revalidate-secret: $REVALIDATE_SECRET"')
    }

    console.log('\nApplying indexes...')
    for (const sql of INDEXES) {
      try {
        await client.query(sql)
        const name = sql.match(/INDEX\s+IF\s+NOT\s+EXISTS\s+(\S+)/i)?.[1] ?? sql.split(' ').pop()?.replace(';', '')
        console.log(`  + ${name}`)
      } catch (e) {
        console.warn(`  ! ${sql.split(' ')[3]}: ${e.message}`)
      }
    }

    const indexRes = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE indexname IN (
        'idx_jobs_department','idx_jobs_status','idx_jobs_slug','idx_jobs_created_at',
        'idx_admin_users_role','idx_admin_users_auth',
        'idx_pipeline_events_type','idx_pipeline_events_admin','idx_pipeline_events_app',
        'idx_auth_users_email','idx_talent_pool_email',
        'idx_apps_status','idx_apps_job','idx_apps_email',
        'idx_apps_submitted','idx_apps_created_at','idx_apps_deleted_at',
        'idx_docs_app','idx_document_folders_name'
      )
    `)
    console.log(`\nVerification: ${indexRes.rowCount} indexes confirmed in database.`)

    const seedRes = await client.query(
      "SELECT slug, title, status FROM jobs WHERE status = 'live' ORDER BY created_at DESC"
    )
    console.log(`\nSeed verification: ${seedRes.rowCount} open jobs:`)
    seedRes.rows.forEach((r) => console.log(`  - ${r.title} (${r.slug})`))

    const deptRes = await client.query(
      'SELECT code, name, current_budget FROM departments ORDER BY name'
    )
    console.log(`\nDepartments: ${deptRes.rowCount} departments seeded:`)
    deptRes.rows.forEach((r) => console.log(`  - ${r.code}: ${r.name}`))

    const folderRes = await client.query(
      'SELECT name, icon FROM document_folders ORDER BY name'
    )
    console.log(`\nDocument folders: ${folderRes.rowCount} folders:`)
    folderRes.rows.forEach((r) => console.log(`  - ${r.name} (${r.icon})`))
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error('FATAL:', e.message)
  process.exit(1)
})
