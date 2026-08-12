import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'

function loadEnv(file) {
  try {
    for (const line of fs.readFileSync(path.join(process.cwd(), file), 'utf8').split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
      if (!m) continue
      const val = m[2].trim().replace(/^["']|["']$/g, '')
      if (!(m[1] in process.env)) process.env[m[1]] = val
    }
  } catch { /* no-op if .env.local is missing */ }
}
loadEnv('.env.local')

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()

const tables = await client.query("SELECT tablename FROM pg_tables WHERE tablename LIKE 'application%' ORDER BY tablename")
console.log('Application-related tables:', tables.rows.map((r) => r.tablename))

const count = await client.query('SELECT COUNT(*) as cnt FROM applications')
console.log('Total applications:', count.rows[0].cnt)

const sample = await client.query('SELECT id, first_name, last_name, email, job_id, status, deleted_at FROM applications ORDER BY created_at DESC LIMIT 5')
console.log('Recent applications:')
sample.rows.forEach((r) => console.log(`  ${r.first_name} ${r.last_name} | job_id: ${r.job_id} | status: ${r.status} | deleted_at: ${r.deleted_at}`))

const embedTables = await client.query("SELECT tablename FROM pg_tables WHERE tablename IN ('application_qualifications', 'application_experience', 'application_compensation')")
console.log('Embed tables:', embedTables.rows.map((r) => r.tablename))

await client.release()
await pool.end()
