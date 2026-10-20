/**
 * Seeds an initial admin user into Neon.
 *
 * Creates (or updates) an auth_users row with a bcrypt password and links
 * an admin_users row with the 'admin' role.
 *
 * Usage:  node seed-admin.js
 * Env:    DATABASE_URL (Neon), optional SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
 */

const { Pool } = require('pg')
const bcrypt = require('bcryptjs')
const fs = require('fs')
const path = require('path')

// Minimal .env.local loader (avoids a dotenv dependency)
function loadEnv(file) {
  try {
    const content = fs.readFileSync(path.join(process.cwd(), file), 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i)
      if (!m) continue
      let val = m[2].trim().replace(/^["']|["']$/g, '')
      if (!(m[1] in process.env)) process.env[m[1]] = val
    }
  } catch {
    /* file optional */
  }
}
loadEnv('.env.local')
loadEnv('.env')

const connectionString =
  process.env.DATABASE_URL ||
  process.env.NEON_DATABASE_URL ||
  process.env.POSTGRES_URL


if (!connectionString) {
  console.error('Missing DATABASE_URL (Neon connection string) in .env.local')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function createAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@aerojet-aviation.com'
  const password = process.env.SEED_ADMIN_PASSWORD
  if (!password) {
    console.error('FATAL: SEED_ADMIN_PASSWORD is not set.')
    console.error('Set it in .env.local or pass it as an environment variable before running this script.')
    console.error('Never use the default — a known password on a tracked script is a live credential leak.')
    process.exit(1)
  }
  const fullName = 'Admin User'

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    const hash = await bcrypt.hash(password, 10)

    // 1. Upsert auth user
    console.log('Creating/updating auth user...')
    const authRes = await client.query(
      `INSERT INTO auth_users (email, password_hash, user_metadata, email_confirmed)
       VALUES ($1, $2, $3, TRUE)
       ON CONFLICT (email)
       DO UPDATE SET password_hash = EXCLUDED.password_hash
       RETURNING id`,
      [email, hash, JSON.stringify({ full_name: fullName })]
    )
    const userId = authRes.rows[0].id
    console.log('Auth user id:', userId)

    // 2. Upsert admin_users row
    console.log('Linking admin_users record...')
    await client.query(
      `INSERT INTO admin_users (auth_user_id, email, full_name, role, is_active)
       VALUES ($1, $2, $3, 'admin', TRUE)
       ON CONFLICT (email)
       DO UPDATE SET auth_user_id = EXCLUDED.auth_user_id,
                     role = EXCLUDED.role,
                     is_active = TRUE`,
      [userId, email, fullName]
    )

    await client.query('COMMIT')
    console.log('\n✓ Admin seeded successfully')
    console.log(`  Email:    ${email}`)
    console.log(`  Password: ${password}`)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('Seed failed:', err.message)
    process.exitCode = 1
  } finally {
    client.release()
    await pool.end()
  }
}

createAdmin()
