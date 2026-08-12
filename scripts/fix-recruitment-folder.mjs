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

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
const client = await pool.connect()

// Test the exact upsert the folders API runs
try {
  const r = await client.query(
    `INSERT INTO document_folders (name, description, icon)
     VALUES ($1, $2, $3)
     ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description, icon = EXCLUDED.icon
     RETURNING id, name, description, icon`,
    ['Recruitment Scans', 'CVs, licence scans and passport scans from applications and talent pool', 'file-search']
  )
  console.log('upsert OK:', JSON.stringify(r.rows[0]))
} catch (e) {
  console.log('upsert ERROR:', e.message)
}

// Verify all folders now
const folders = await client.query('SELECT id, name FROM document_folders ORDER BY name')
console.log('\nAll folders:')
folders.rows.forEach(r => console.log(`  ${r.id} | ${r.name}`))

await client.release()
await pool.end()