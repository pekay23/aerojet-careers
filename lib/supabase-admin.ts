import { createDbClient } from './db'
import { storageCompat } from './storage-compat'
import {
  createAuthUser,
  deleteAuthUser,
  updateAuthUserPassword,
  updateAuthUserMetadata,
  findAuthUserByEmail,
} from './auth-admin'


/**
 * Neon-backed replacement for the Supabase service-role admin client.
 *
 * This preserves the supabase-js surface the app depends on:
 *   supabaseAdmin.from(table)...        → Neon query builder (lib/db)
 *   supabaseAdmin.storage.from(bucket)  → Neon storage (storage_objects)
 *   supabaseAdmin.auth.admin.*          → auth_users management
 *
 * Server-only. Never import from a Client Component.
 */

const db = createDbClient()

export const supabaseAdmin = {
  from: db.from.bind(db),
  storage: storageCompat,
  auth: {
    admin: {
      async createUser(input: {
        email: string
        password: string
        email_confirm?: boolean
        user_metadata?: Record<string, any>
      }) {
        const { user, error } = await createAuthUser(input)
        if (error || !user) {
          return { data: { user: null }, error }
        }
        return { data: { user }, error: null }
      },

      async deleteUser(id: string) {
        const { error } = await deleteAuthUser(id)
        return { data: null, error }
      },

      async updateUserById(
        id: string,
        attrs: { password?: string; user_metadata?: Record<string, any> }
      ) {
        if (attrs.password) {
          const { error } = await updateAuthUserPassword(id, attrs.password)
          if (error) return { data: null, error }
        }
        if (attrs.user_metadata) {
          const { error } = await updateAuthUserMetadata(id, attrs.user_metadata)
          if (error) return { data: null, error }
        }
        return { data: null, error: null }
      },


      async listUsers() {
        // Provided for the seed script's fallback path.
        const { pool } = await import('./db')
        const res = await pool.query(
          'SELECT id, email, user_metadata FROM auth_users ORDER BY created_at'
        )
        return { data: { users: res.rows }, error: null }
      },
    },
  },
  // exposed for callers that need direct lookups
  _findAuthUserByEmail: findAuthUserByEmail,
}
