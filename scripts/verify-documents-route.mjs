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

// 1. Find the Recruitment Scans folder (what the folders API returns)
const folder = await client.query("SELECT id, name FROM document_folders WHERE name = 'Recruitment Scans'")
console.log('=== Step 1: Recruitment Scans folder ===')
if (folder.rows.length === 0) {
  console.log('  MISSING — folder does not exist!')
} else {
  console.log(`  FOUND: ${folder.rows[0].id} | ${folder.rows[0].name}`)
}

// 2. Simulate the documents route: application_documents + applications embed
console.log('\n=== Step 2: application_documents (with application embed) ===')
const appDocs = await client.query(
  `SELECT d.id, d.document_type, d.file_name, d.file_path, d.storage_bucket, d.uploaded_at,
          a.first_name, a.last_name
   FROM application_documents d
   LEFT JOIN applications a ON a.id = d.application_id
   ORDER BY d.uploaded_at DESC`
)
console.log(`  rows: ${appDocs.rows.length}`)
appDocs.rows.forEach(r => console.log(`  ${r.document_type.toUpperCase()} - ${r.first_name} ${r.last_name} | ${r.file_path}`))

// 3. Simulate the documents route: talent_pool.cv_path (Source 1)
console.log('\n=== Step 3: talent_pool.cv_path (Source 1) ===')
const talent = await client.query(
  "SELECT id, first_name, last_name, cv_path, created_at FROM talent_pool WHERE cv_path IS NOT NULL AND cv_path != '' ORDER BY created_at DESC"
)
console.log(`  rows: ${talent.rows.length}`)
talent.rows.forEach(r => console.log(`  CV - ${r.first_name} ${r.last_name} | ${r.cv_path}`))

// 4. Simulate the documents route: storage_objects fallback (Source 2)
console.log('\n=== Step 4: storage_objects talent-pool fallback (Source 2) ===')
const storage = await client.query(
  "SELECT path, content_type, size, created_at FROM storage_objects WHERE bucket = 'application-documents' AND path ILIKE 'talent-pool/%' ORDER BY created_at DESC"
)
console.log(`  rows: ${storage.rows.length}`)
storage.rows.forEach(r => console.log(`  ${r.path} | ${r.content_type} | ${r.size}`))

// 5. Verify the storage objects actually have content (downloadable)
console.log('\n=== Step 5: storage content check ===')
for (const r of storage.rows) {
  const obj = await client.query(
    'SELECT LENGTH(content) as bytes FROM storage_objects WHERE bucket = $1 AND path = $2',
    ['application-documents', r.path]
  )
  console.log(`  ${r.path} → ${obj.rows[0]?.bytes ?? 0} bytes stored`)
}

// 6. Verify the application document storage objects exist too
console.log('\n=== Step 6: application document storage check ===')
for (const r of appDocs.rows) {
  const obj = await client.query(
    'SELECT LENGTH(content) as bytes FROM storage_objects WHERE bucket = $1 AND path = $2',
    [r.storage_bucket, r.file_path]
  )
  console.log(`  ${r.file_path} → ${obj.rows[0]?.bytes ?? 0} bytes stored`)
}

await client.release()
await pool.end()