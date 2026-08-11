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
  } catch {}
}
loadEnv('.env.local')

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const client = await pool.connect()

try {
  const tables = await client.query("SELECT tablename FROM pg_tables WHERE tablename IN ('auth_users','admin_users','jobs','system_settings') ORDER BY tablename")
  console.log('Tables found:', tables.rows.map(r => r.tablename))

  const authUsers = await client.query('SELECT id, email, user_metadata FROM auth_users')
  console.log('auth_users count:', authUsers.rows.length)
  authUsers.rows.forEach(r => console.log('  ', r.email, JSON.stringify(r.user_metadata)))

  const adminUsers = await client.query('SELECT id, auth_user_id, email, full_name, role, is_active FROM admin_users')
  console.log('admin_users count:', adminUsers.rows.length)
  adminUsers.rows.forEach(r => console.log('  ', r.email, r.role, r.is_active, 'auth_id:', r.auth_user_id))

  const jobs = await client.query("SELECT id, title, slug, status FROM jobs WHERE status = 'open'")
  console.log('open jobs count:', jobs.rows.length)
  jobs.rows.forEach(r => console.log('  ', r.title, r.slug, r.status))

  const settings = await client.query('SELECT setting_key, setting_value FROM system_settings ORDER BY setting_key')
  console.log('system_settings:', JSON.stringify(settings.rows))
} catch (e) {
  console.error('DB error:', e.message)
} finally {
  client.release()
  await pool.end()
}
