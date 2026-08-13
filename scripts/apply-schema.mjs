/**
 * Safe schema + seed migration script for Neon.
 * Applies the full schema (tables, triggers, seed data with ON CONFLICT upsert)
 * then applies indexes.
 *
 * Safe to run multiple times (IF NOT EXISTS / idempotent guards).
 * Includes deduplication for document_folders to prevent duplicate entries.
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
  } catch (e) {
    console.warn('  ! Schema had errors (partial application):', e.message)
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

async function cleanupJobs(client) {
  console.log('Cleaning existing job postings...')
  const res = await client.query('DELETE FROM jobs')
  console.log(`  ✓ ${res.rowCount} job postings removed`)
}

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

    await applySchema(client)

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
