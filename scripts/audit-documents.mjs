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

console.log('=== document_folders ===')
const folders = await client.query('SELECT id, name, description FROM document_folders ORDER BY name')
folders.rows.forEach(r => console.log(`  ${r.id} | ${r.name} | ${r.description || ''}`))

console.log('\n=== staff_documents ===')
const staffDocs = await client.query('SELECT COUNT(*) as cnt FROM staff_documents')
console.log('  count:', staffDocs.rows[0].cnt)
const staffDocsSample = await client.query('SELECT id, staff_id, folder_id, file_name, file_url FROM staff_documents LIMIT 5')
staffDocsSample.rows.forEach(r => console.log(`  ${r.id} | staff: ${r.staff_id} | folder: ${r.folder_id} | ${r.file_name} | ${r.file_url}`))

console.log('\n=== application_documents ===')
const appDocs = await client.query('SELECT COUNT(*) as cnt FROM application_documents')
console.log('  count:', appDocs.rows[0].cnt)
const appDocsSample = await client.query('SELECT id, application_id, document_type, file_name, file_path, storage_bucket FROM application_documents LIMIT 5')
appDocsSample.rows.forEach(r => console.log(`  ${r.id} | app: ${r.application_id} | ${r.document_type} | ${r.file_name} | ${r.file_path} | bucket: ${r.storage_bucket}`))

console.log('\n=== talent_pool (cv_path) ===')
const talent = await client.query("SELECT id, first_name, last_name, cv_path FROM talent_pool WHERE cv_path IS NOT NULL AND cv_path != ''")
console.log('  count with cv_path:', talent.rows.length)
talent.rows.forEach(r => console.log(`  ${r.id} | ${r.first_name} ${r.last_name} | ${r.cv_path}`))

console.log('\n=== storage_objects ===')
const buckets = await client.query('SELECT bucket, COUNT(*) as cnt FROM storage_objects GROUP BY bucket ORDER BY bucket')
buckets.rows.forEach(r => console.log(`  bucket: ${r.bucket} | count: ${r.cnt}`))
const talentFiles = await client.query("SELECT bucket, path, content_type, size FROM storage_objects WHERE path ILIKE 'talent-pool/%' ORDER BY created_at DESC LIMIT 10")
console.log('  talent-pool paths:')
talentFiles.rows.forEach(r => console.log(`    ${r.bucket} | ${r.path} | ${r.content_type} | ${r.size}`))

console.log('\n=== staff_profiles ===')
const staff = await client.query('SELECT id, first_name, last_name, email FROM staff_profiles ORDER BY created_at DESC LIMIT 5')
staff.rows.forEach(r => console.log(`  ${r.id} | ${r.first_name} ${r.last_name} | ${r.email}`))

await client.release()
await pool.end()