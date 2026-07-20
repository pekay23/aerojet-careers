// One-off migration: copy every object in the Supabase `application-documents`
// bucket into the Neon `storage_objects` table (the app's current storage
// backend, read via lib/storage.ts → /api/files). Idempotent: re-running
// upserts on (bucket, path), so it's safe to run more than once.
import { createClient } from '@supabase/supabase-js'
import pg from 'pg'
import fs from 'node:fs'
import path from 'node:path'

// ── Minimal .env.local loader (avoids a dotenv dependency) ──────────────────
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
loadEnv('.env')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nojszntucwdivxurrphf.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const DATABASE_URL = process.env.DATABASE_URL

if (!SERVICE_KEY) { console.error('Missing SUPABASE_SERVICE_ROLE_KEY'); process.exit(1) }
if (!DATABASE_URL) { console.error('Missing DATABASE_URL'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)
const pool = new pg.Pool({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } })

const BUCKET = 'application-documents'

async function walk(prefix = '') {
  const out = []
  const { data, error } = await supabase.storage.from(BUCKET).list(prefix, { limit: 1000 })
  if (error) { console.error(`  ! list ${prefix}: ${error.message}`); return out }
  for (const entry of data || []) {
    const full = prefix ? `${prefix}/${entry.name}` : entry.name
    if (entry.id === null) out.push(...(await walk(full)))
    else out.push({ path: full, mime: entry.metadata?.mimetype ?? null })
  }
  return out
}

async function main() {
  const files = await walk()
  console.log(`Found ${files.length} files in Supabase bucket "${BUCKET}".`)
  let migrated = 0, skipped = 0, failed = 0

  for (const f of files) {
    // Skip if already present in Neon with a non-empty body.
    const existing = await pool.query(
      'SELECT size FROM storage_objects WHERE bucket = $1 AND path = $2 LIMIT 1',
      [BUCKET, f.path]
    )
    if (existing.rows[0]) { console.log(`  = skip (exists): ${f.path}`); skipped++; continue }

    const { data, error } = await supabase.storage.from(BUCKET).download(f.path)
    if (error || !data) { console.error(`  ! download failed: ${f.path} — ${error?.message}`); failed++; continue }

    const buf = Buffer.from(new Uint8Array(await data.arrayBuffer()))
    const contentType = f.mime || data.type || 'application/octet-stream'

    await pool.query(
      `INSERT INTO storage_objects (bucket, path, content, content_type, size)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (bucket, path)
       DO UPDATE SET content = EXCLUDED.content, content_type = EXCLUDED.content_type,
                     size = EXCLUDED.size, created_at = NOW()`,
      [BUCKET, f.path, buf, contentType, buf.length]
    )
    console.log(`  + migrated: ${f.path} (${buf.length} bytes, ${contentType})`)
    migrated++
  }

  console.log(`\nDone. migrated=${migrated} skipped=${skipped} failed=${failed}`)
  await pool.end()
  if (failed) process.exitCode = 1
}

main().catch(e => { console.error('FATAL', e.message); process.exit(1) })
