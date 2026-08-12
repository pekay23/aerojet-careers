import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/auth'
import { pool } from '@/lib/db'

/**
 * Returns the current session user plus their admin_users record
 * (role, full_name). Reads the local JWT session cookie.
 */
export async function GET() {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ user: null, admin: null }, { status: 200 })
  }

  let admin: any = null
  try {
    const res = await pool.query(
      'SELECT id, role, full_name, is_active FROM admin_users WHERE auth_user_id = $1 LIMIT 1',
      [user.id]
    )
    admin = res.rows[0] ?? null
  } catch {
    admin = null
  }

  return NextResponse.json({ user, admin })
}
