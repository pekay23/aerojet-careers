/**
 * Safe schema migration script for Neon.
 * Applies only the new indexes added during the second-pass audit.
 * Uses CREATE INDEX IF NOT EXISTS — idempotent and safe to re-run.
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

const INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_jobs_department    ON jobs(department)',
  'CREATE INDEX IF NOT EXISTS idx_admin_users_role   ON admin_users(role)',
  'CREATE INDEX IF NOT EXISTS idx_admin_users_auth   ON admin_users(auth_user_id)',
  'CREATE INDEX IF NOT EXISTS idx_pipeline_events_type  ON pipeline_events(event_type)',
  'CREATE INDEX IF NOT EXISTS idx_pipeline_events_admin ON pipeline_events(admin_user_id)',
  'CREATE INDEX IF NOT EXISTS idx_auth_users_email   ON auth_users(LOWER(email))',
  'CREATE INDEX IF NOT EXISTS idx_talent_pool_email  ON talent_pool(email)',
]

async function main() {
  console.log('Connecting to Neon database...')
  const client = await pool.connect()
  try {
    console.log('Applying indexes...')
    for (const sql of INDEXES) {
      try {
        await client.query(sql)
        console.log(`  + ${sql.split(' ')[3]}`)
      } catch (e) {
        console.warn(`  ! ${sql.split(' ')[3]}: ${e.message}`)
      }
    }

    const res = await client.query(
      'SELECT indexname FROM pg_indexes WHERE indexname LIKE \'idx_jobs_department\' OR indexname LIKE \'idx_auth_users_email\' OR indexname LIKE \'idx_talent_pool_email\' OR indexname LIKE \'idx_pipeline_events_type\' OR indexname LIKE \'idx_pipeline_events_admin\' OR indexname LIKE \'idx_admin_users_role\' OR indexname LIKE \'idx_admin_users_auth\''
    )
    console.log(`\nVerification: ${res.rowCount} indexes confirmed in database.`)
  } finally {
    client.release()
    await pool.end()
  }
}

main().catch((e) => {
  console.error('FATAL:', e.message)
  process.exit(1)
})
