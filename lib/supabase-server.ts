import { createDbClient } from './db'
import { storageCompat } from './storage-compat'
import { getServerUser } from './auth'

/**
 * Neon-backed replacement for the Supabase server client.
 *
 * Preserves the surface used by server components / route handlers:
 *   const supabase = await createSupabaseServer()
 *   const { data: { user } } = await supabase.auth.getUser()
 *   supabase.from(table)...
 *
 * Auth is resolved from the JWT session cookie (see lib/auth).
 */

export async function createSupabaseServer() {
  const db = createDbClient()
  const user = await getServerUser()

  return {
    from: db.from.bind(db),
    storage: storageCompat,
    auth: {
      async getUser() {
        return { data: { user }, error: null }
      },
      async getSession() {
        return {
          data: { session: user ? { user } : null },
          error: null,
        }
      },
    },
  }
}
