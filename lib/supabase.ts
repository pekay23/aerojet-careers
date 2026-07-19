'use client'

/**
 * Neon-backed browser client shim.
 *
 * The old browser client talked to Supabase directly (auth + a couple of
 * `from('admin_users')` role lookups + storage uploads). None of that works
 * against Neon, so this shim routes those calls through our own API endpoints:
 *   - auth.signInWithPassword → POST /api/auth/login
 *   - auth.signOut            → POST /api/auth/logout
 *   - auth.getUser/getSession → GET  /api/auth/me
 *   - from('admin_users').select('role'[, 'full_name']).eq('auth_user_id', id)
 *                             → derived from GET /api/auth/me
 *   - storage.from(bucket).upload/getPublicUrl → POST /api/storage/upload
 *
 * Only the subset the client actually uses is implemented.
 */

interface MeResponse {
  user: { id: string; email: string; user_metadata?: Record<string, any> } | null
  admin: { id: string; role: string; full_name: string; is_active: boolean } | null
}

async function fetchMe(): Promise<MeResponse> {
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store' })
    if (!res.ok) return { user: null, admin: null }
    return (await res.json()) as MeResponse
  } catch {
    return { user: null, admin: null }
  }
}

// ── admin_users select shim ───────────────────────────────────
class AdminUsersQuery {
  private columns: string[] = []
  constructor(columnsStr: string) {
    this.columns = columnsStr
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
  }
  // filters are accepted but ignored — the API always scopes to the
  // current session user, which is what every caller wants.
  eq(_col: string, _val: any) {
    return this
  }
  private async resolve() {
    const { admin, user } = await fetchMe()
    if (!admin && !user) return { data: null, error: null }
    const row: Record<string, any> = {
      role: admin?.role ?? 'employee',
      full_name: admin?.full_name ?? user?.email?.split('@')[0] ?? 'User',
      id: admin?.id,
      status: admin?.is_active ? 'active' : 'inactive',
      is_active: admin?.is_active,
    }
    return { data: row, error: null }
  }
  async single() {
    return this.resolve()
  }
  async maybeSingle() {
    return this.resolve()
  }
  then(onfulfilled: any, onrejected?: any) {
    return this.resolve().then(onfulfilled, onrejected)
  }
}

class TableQuery {
  constructor(private table: string) {}
  select(columns = '*') {
    if (this.table === 'admin_users') return new AdminUsersQuery(columns)
    // Other client-side table reads are not supported; callers should use
    // dedicated API routes. Return an empty result rather than throwing.
    return {
      eq() {
        return this
      },
      single: async () => ({ data: null, error: { message: 'unsupported' } }),
      maybeSingle: async () => ({ data: null, error: null }),
      then: (f: any) => Promise.resolve({ data: null, error: null }).then(f),
    } as any
  }
}

// ── storage shim (client upload) ──────────────────────────────
class ClientBucket {
  constructor(private bucket: string) {}
  async upload(path: string, file: File | Blob, _opts?: any) {
    try {
      const form = new FormData()
      form.set('bucket', this.bucket)
      form.set('path', path)
      form.set('file', file)
      const res = await fetch('/api/storage/upload', { method: 'POST', body: form })
      const body = await res.json()
      if (!res.ok) return { data: null, error: { message: body.error || 'Upload failed' } }
      return { data: { path: body.path }, error: null }
    } catch (e: any) {
      return { data: null, error: { message: e.message } }
    }
  }
  getPublicUrl(path: string) {
    return {
      data: {
        publicUrl: `/api/files?bucket=${encodeURIComponent(this.bucket)}&path=${encodeURIComponent(path)}`,
      },
    }
  }
}

export const supabase = {
  auth: {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const body = await res.json()
        if (!res.ok) {
          return { data: { user: null, session: null }, error: { message: body.error || 'Invalid login credentials' } }
        }
        return { data: { user: body.user, session: { user: body.user } }, error: null }
      } catch (e: any) {
        return { data: { user: null, session: null }, error: { message: e.message } }
      }
    },
    async signOut() {
      try {
        await fetch('/api/auth/logout', { method: 'POST' })
        return { error: null }
      } catch (e: any) {
        return { error: { message: e.message } }
      }
    },
    async getUser() {
      const { user } = await fetchMe()
      return { data: { user }, error: null }
    },
    async getSession() {
      const { user } = await fetchMe()
      return { data: { session: user ? { user } : null }, error: null }
    },
  },
  from(table: string) {
    return new TableQuery(table)
  },
  storage: {
    from(bucket: string) {
      return new ClientBucket(bucket)
    },
  },
}
