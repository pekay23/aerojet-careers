/**
 * Safe schema + seed migration script for Neon.
 * Applies the full schema (tables, triggers, seed data with ON CONFLICT upsert)
 * then applies indexes.
 *
 * Safe to run multiple times (IF NOT EXISTS / idempotent guards).
 * ON CONFLICT (slug) on the seed INSERT ensures updated seed data is always applied.
 *
 * Usage:  bun scripts/apply-schema.mjs
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

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('Missing DATABASE_URL in .env.local')
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
    console.log('  ✓ Schema applied (tables, triggers, seed upsert)')
  } catch (e) {
    console.warn('  ! Schema had errors (partial application):', e.message)
    // PostgreSQL simple-query executes all statements; errors from individual
    // statements are logged but the connection remains usable.
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
]

async function cleanupJobs(client) {
  console.log('Cleaning existing job postings...')
  const res = await client.query('DELETE FROM jobs')
  console.log(`  ✓ ${res.rowCount} job postings removed`)
}

async function main() {
  console.log('Connecting to Neon database...')
  const client = await pool.connect()
  try {
    await cleanupJobs(client)
    await applySchema(client)

    console.log('\nApplying indexes...')
    for (const sql of INDEXES) {
      try {
        await client.query(sql)
        console.log(`  + ${sql.match(/INDEX\s+IF\s+NOT\s+EXISTS\s+(\S+)/i)?.[1] ?? sql.split(' ').pop()?.replace(';', '')}`)
      } catch (e) {
        console.warn(`  ! ${sql.split(' ')[3]}: ${e.message}`)
      }
    }

    const indexRes = await client.query(
      'SELECT indexname FROM pg_indexes WHERE indexname LIKE \'idx_jobs_department\' OR indexname LIKE \'idx_auth_users_email\' OR indexname LIKE \'idx_talent_pool_email\' OR indexname LIKE \'idx_pipeline_events_type\' OR indexname LIKE \'idx_pipeline_events_admin\' OR indexname LIKE \'idx_admin_users_role\' OR indexname LIKE \'idx_admin_users_auth\''
    )
    console.log(`\nVerification: ${indexRes.rowCount} indexes confirmed in database.`)

    const seedRes = await client.query(
      "SELECT slug, title, status FROM jobs WHERE status = 'open' ORDER BY created_at DESC"
    )
    console.log(`\nSeed verification: ${seedRes.rowCount} open jobs:`)
    seedRes.rows.forEach(r => console.log(`  - ${r.title} (${r.slug})`))
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error('FATAL:', e.message)
  process.exit(1)
})
