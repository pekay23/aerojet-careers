import { pool } from './db'
import { hashPassword } from './auth'

/**
 * Admin user management (replaces supabaseAdmin.auth.admin.*).
 * Operates directly on the auth_users table.
 */

export interface CreateUserInput {
  email: string
  password: string
  email_confirm?: boolean
  user_metadata?: Record<string, any>
}

export interface CreatedUser {
  id: string
  email: string
  user_metadata: Record<string, any>
}

export async function createAuthUser(
  input: CreateUserInput
): Promise<{ user: CreatedUser | null; error: { message: string; status?: number } | null }> {
  try {
    const existing = await pool.query(
      'SELECT id FROM auth_users WHERE lower(email) = lower($1) LIMIT 1',
      [input.email]
    )
    if (existing.rows[0]) {
      return { user: null, error: { message: 'A user with this email already exists', status: 422 } }
    }

    const hash = await hashPassword(input.password)
    const res = await pool.query(
      `INSERT INTO auth_users (email, password_hash, user_metadata, email_confirmed)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, user_metadata`,
      [input.email, hash, input.user_metadata ?? {}, input.email_confirm ?? true]
    )
    const row = res.rows[0]
    return {
      user: { id: row.id, email: row.email, user_metadata: row.user_metadata ?? {} },
      error: null,
    }
  } catch (e: any) {
    return { user: null, error: { message: e.message } }
  }
}

export async function updateAuthUserPassword(
  id: string,
  password: string
): Promise<{ error: { message: string } | null }> {
  try {
    const hash = await hashPassword(password)
    await pool.query('UPDATE auth_users SET password_hash = $1 WHERE id = $2', [
      hash,
      id,
    ])
    return { error: null }
  } catch (e: any) {
    return { error: { message: e.message } }
  }
}

export async function updateAuthUserMetadata(
  id: string,
  metadata: Record<string, any>
): Promise<{ error: { message: string } | null }> {
  try {
    await pool.query(
      `UPDATE auth_users
       SET user_metadata = COALESCE(user_metadata, '{}'::jsonb) || $1::jsonb
       WHERE id = $2`,
      [JSON.stringify(metadata), id]
    )
    return { error: null }
  } catch (e: any) {
    return { error: { message: e.message } }
  }
}


export async function deleteAuthUser(
  id: string
): Promise<{ error: { message: string } | null }> {
  try {
    await pool.query('DELETE FROM auth_users WHERE id = $1', [id])
    return { error: null }
  } catch (e: any) {
    return { error: { message: e.message } }
  }
}

export async function findAuthUserByEmail(email: string) {
  const res = await pool.query(
    'SELECT id, email, user_metadata FROM auth_users WHERE lower(email) = lower($1) LIMIT 1',
    [email]
  )
  return res.rows[0] ?? null
}
