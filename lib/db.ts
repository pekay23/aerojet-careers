import { Pool } from 'pg'

/**
 * Neon (plain PostgreSQL) connection pool + a small Supabase-compatible
 * query-builder shim.
 *
 * The rest of the app was written against the supabase-js PostgREST query
 * builder (`.from().select().eq()...`). Rather than rewrite ~30 route files,
 * this module re-implements the subset of that API the app actually uses,
 * backed by node-postgres against Neon.
 *
 * Supported chain methods:
 *   from(table)
 *   select(cols?, { count, head })   — supports nested embeds `rel:table(*)`
 *   insert(values)                   — single object or array
 *   update(values)
 *   upsert(values, { onConflict })
 *   delete()
 *   eq / neq / is / in / gt / gte / lt / lte / ilike
 *   or('a.ilike.%x%,b.eq.y')         — PostgREST-style OR string
 *   order(col, { ascending })
 *   range(from, to)                  — inclusive, like PostgREST
 *   limit(n)
 *   single() / maybeSingle()
 *   then(...)                        — thenable, resolves { data, error, count }
 */

const globalForPool = globalThis as unknown as { __neonPool?: Pool }

function getConnectionString(): string {
  const cs =
    process.env.DATABASE_URL ||
    process.env.NEON_DATABASE_URL ||
    process.env.POSTGRES_URL
  if (!cs) {
    throw new Error(
      '[db] Missing DATABASE_URL (Neon connection string). Set it in .env.local'
    )
  }
  return cs
}

export const pool: Pool =
  globalForPool.__neonPool ??
  new Pool({
    connectionString: getConnectionString(),
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPool.__neonPool = pool
}

export async function query<T = any>(text: string, params: any[] = []) {
  const res = await pool.query(text, params)
  return res.rows as T[]
}

// ── Identifier quoting ────────────────────────────────────────
function qi(ident: string): string {
  // quote a single identifier (table or column), allowing already-safe names
  return '"' + ident.replace(/"/g, '""') + '"'
}

type Filter = {
  kind: 'eq' | 'neq' | 'is' | 'in' | 'gt' | 'gte' | 'lt' | 'lte' | 'ilike' | 'or' | 'contains'
  column?: string

  value?: any
  raw?: string // for `or`
}

type OrderSpec = { column: string; ascending: boolean }

type EmbedSpec = {
  alias: string
  table: string
  columns: string // raw column list inside the embed, e.g. '*' or 'first_name, last_name'
}

type ParsedSelect = {
  baseColumns: string[] // top-level column names ('*' allowed)
  embeds: EmbedSpec[]
}

/**
 * Parse a PostgREST select string into base columns + embedded relations.
 * Handles forms like:
 *   '*'
 *   'title,summary'
 *   '*, qualifications:application_qualifications(*)'
 *   'id, staff_profiles ( first_name, last_name )'
 *   '*, application:applications(first_name, last_name)'
 */
function parseSelect(sel: string): ParsedSelect {
  const baseColumns: string[] = []
  const embeds: EmbedSpec[] = []

  let i = 0
  const n = sel.length
  let token = ''

  const flushToken = () => {
    const t = token.trim()
    token = ''
    if (!t) return
    if (t) baseColumns.push(t)
  }

  while (i < n) {
    const ch = sel[i]
    if (ch === '(') {
      // token so far is `alias:table` or `table`
      // find matching close paren
      let depth = 1
      let inner = ''
      i++
      while (i < n && depth > 0) {
        const c = sel[i]
        if (c === '(') depth++
        else if (c === ')') {
          depth--
          if (depth === 0) break
        }
        if (depth > 0) inner += c
        i++
      }
      // consume the ')'
      i++
      const head = token.trim()
      token = ''
      let alias = head
      let table = head
      if (head.includes(':')) {
        const [a, tb] = head.split(':')
        alias = a.trim()
        table = tb.trim()
      }
      embeds.push({ alias, table, columns: inner.trim() })
    } else if (ch === ',') {
      flushToken()
      i++
    } else {
      token += ch
      i++
    }
  }
  flushToken()

  return { baseColumns, embeds }
}

function buildSelectColumns(parsed: ParsedSelect): string {
  const cols = parsed.baseColumns
    .filter((c) => c && c !== '*')
    .map((c) => qi(c))
  if (parsed.baseColumns.includes('*') || parsed.baseColumns.length === 0) {
    return 't.*'
  }
  return cols.map((c) => `t.${c}`).join(', ')
}

class QueryBuilder implements PromiseLike<any> {
  private table: string
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select'
  private selectStr = '*'
  private countMode: 'exact' | null = null
  private headOnly = false
  private filters: Filter[] = []
  private orders: OrderSpec[] = []
  private rangeFrom: number | null = null
  private rangeTo: number | null = null
  private limitN: number | null = null
  private payload: any = null
  private onConflict: string | null = null
  private returnRows = false
  private single_ = false
  private maybeSingle_ = false

  constructor(table: string) {
    this.table = table
  }

  select(sel = '*', opts?: { count?: 'exact'; head?: boolean }) {
    if (this.op === 'insert' || this.op === 'update' || this.op === 'upsert') {
      // `.insert(...).select()` — request returning rows
      this.returnRows = true
      if (sel && sel !== '*') this.selectStr = sel
      return this
    }
    this.op = 'select'
    this.selectStr = sel || '*'
    if (opts?.count) this.countMode = opts.count
    if (opts?.head) this.headOnly = true
    return this
  }

  insert(values: any) {
    this.op = 'insert'
    this.payload = values
    return this
  }

  update(values: any) {
    this.op = 'update'
    this.payload = values
    return this
  }

  upsert(values: any, opts?: { onConflict?: string }) {
    this.op = 'upsert'
    this.payload = values
    this.onConflict = opts?.onConflict ?? null
    return this
  }

  delete() {
    this.op = 'delete'
    return this
  }

  eq(column: string, value: any) {
    this.filters.push({ kind: 'eq', column, value })
    return this
  }
  neq(column: string, value: any) {
    this.filters.push({ kind: 'neq', column, value })
    return this
  }
  is(column: string, value: any) {
    this.filters.push({ kind: 'is', column, value })
    return this
  }
  in(column: string, value: any[]) {
    this.filters.push({ kind: 'in', column, value })
    return this
  }
  gt(column: string, value: any) {
    this.filters.push({ kind: 'gt', column, value })
    return this
  }
  gte(column: string, value: any) {
    this.filters.push({ kind: 'gte', column, value })
    return this
  }
  lt(column: string, value: any) {
    this.filters.push({ kind: 'lt', column, value })
    return this
  }
  lte(column: string, value: any) {
    this.filters.push({ kind: 'lte', column, value })
    return this
  }
  ilike(column: string, value: string) {
    this.filters.push({ kind: 'ilike', column, value })
    return this
  }
  contains(column: string, value: any[]) {
    // Postgres array/jsonb containment (@>)
    this.filters.push({ kind: 'contains', column, value })
    return this
  }
  or(raw: string) {

    this.filters.push({ kind: 'or', raw })
    return this
  }

  order(column: string, opts?: { ascending?: boolean }) {
    this.orders.push({ column, ascending: opts?.ascending !== false })
    return this
  }

  range(from: number, to: number) {
    this.rangeFrom = from
    this.rangeTo = to
    return this
  }

  limit(n: number) {
    this.limitN = n
    return this
  }

  single() {
    this.single_ = true
    return this
  }

  maybeSingle() {
    this.maybeSingle_ = true
    return this
  }

  // ── WHERE builder ───────────────────────────────────────────
  private buildWhere(params: any[], alias = ''): string {
    const prefix = alias ? `${alias}.` : ''
    const clauses: string[] = []

    for (const f of this.filters) {
      if (f.kind === 'or' && f.raw) {
        const ors = splitTopLevel(f.raw, ',').map((expr) => {
          const parsed = parseOrExpr(expr)
          if (!parsed) return null
          const { col, opr, val } = parsed
          if (opr === 'ilike') {
            params.push(val.replace(/\*/g, '%'))
            return `${prefix}${qi(col)} ILIKE $${params.length}`
          }
          if (opr === 'eq') {
            params.push(val)
            return `${prefix}${qi(col)} = $${params.length}`
          }
          if (opr === 'neq') {
            params.push(val)
            return `${prefix}${qi(col)} <> $${params.length}`
          }
          return null
        }).filter(Boolean)
        if (ors.length) clauses.push('(' + ors.join(' OR ') + ')')
        continue
      }

      const col = `${prefix}${qi(f.column!)}`
      switch (f.kind) {
        case 'eq':
          params.push(f.value)
          clauses.push(`${col} = $${params.length}`)
          break
        case 'neq':
          if (f.value === null) {
            clauses.push(`${col} IS NOT NULL`)
          } else {
            params.push(f.value)
            clauses.push(`${col} <> $${params.length}`)
          }
          break
        case 'is':
          if (f.value === null) clauses.push(`${col} IS NULL`)
          else if (f.value === true) clauses.push(`${col} IS TRUE`)
          else if (f.value === false) clauses.push(`${col} IS FALSE`)
          else {
            params.push(f.value)
            clauses.push(`${col} IS NOT DISTINCT FROM $${params.length}`)
          }
          break
        case 'in':
          params.push(f.value)
          clauses.push(`${col} = ANY($${params.length})`)
          break
        case 'gt':
          params.push(f.value)
          clauses.push(`${col} > $${params.length}`)
          break
        case 'gte':
          params.push(f.value)
          clauses.push(`${col} >= $${params.length}`)
          break
        case 'lt':
          params.push(f.value)
          clauses.push(`${col} < $${params.length}`)
          break
        case 'lte':
          params.push(f.value)
          clauses.push(`${col} <= $${params.length}`)
          break
        case 'ilike':
          params.push((f.value as string).replace(/\*/g, '%'))
          clauses.push(`${col} ILIKE $${params.length}`)
          break
        case 'contains':
          params.push(f.value)
          clauses.push(`${col} @> $${params.length}`)
          break
      }

    }

    return clauses.length ? 'WHERE ' + clauses.join(' AND ') : ''
  }

  // ── Execute ─────────────────────────────────────────────────
  private async run(): Promise<{ data: any; error: any; count: number | null }> {
    const start = process.env.NODE_ENV !== 'production' ? Date.now() : 0
    try {
      if (this.op === 'select') return await this.runSelect()
      if (this.op === 'insert') return await this.runInsert()
      if (this.op === 'update') return await this.runUpdate()
      if (this.op === 'upsert') return await this.runUpsert()
      if (this.op === 'delete') return await this.runDelete()
      return { data: null, error: new Error('Unknown op'), count: null }
    } catch (e: any) {
      // Mimic supabase error shape (message + code)
      return {
        data: this.single_ ? null : null,
        error: { message: e.message, code: e.code, details: e.detail },
        count: null,
      }
    } finally {
      if (start > 0) {
        const duration = Date.now() - start
        if (duration > 100) {
          console.warn(`[DB SLOW] ${this.op} ${this.table} took ${duration}ms`)
        }
      }
    }
  }

  private async runSelect() {
    const parsed = parseSelect(this.selectStr)
    const params: any[] = []
    const baseCols = buildSelectColumns(parsed)

    // embedded relations become correlated json subqueries
    const embedCols = parsed.embeds.map((emb) => {
      const embInner =
        emb.columns === '*' || emb.columns === ''
          ? 'e.*'
          : emb.columns
              .split(',')
              .map((c) => `e.${qi(c.trim())}`)
              .join(', ')
      // Guess FK: embed table has <base_singular>_id, OR base has <embed>_id.
      // For this app the relationships are:
      //   applications 1—* application_qualifications/experience/compensation (child has application_id)
      //   application_documents *—1 applications (child has application_id -> parent)
      //   admin_users 1—1 staff_profiles (child staff_profiles has admin_user_id)
      // We resolve via a join predicate table below.
      const rel = resolveRelationship(this.table, emb.table)
      const jsonExpr =
        rel.cardinality === 'many'
          ? `COALESCE((SELECT json_agg(row_to_json(sub)) FROM (SELECT ${embInner} FROM ${qi(
              emb.table
            )} e WHERE ${rel.predicate}) sub), '[]'::json)`
          : `(SELECT row_to_json(sub) FROM (SELECT ${embInner} FROM ${qi(
              emb.table
            )} e WHERE ${rel.predicate} LIMIT 1) sub)`
      return `${jsonExpr} AS ${qi(emb.alias)}`
    })

    const selectList = [baseCols, ...embedCols].filter(Boolean).join(', ')

    const where = this.buildWhere(params, 't')
    const orderBy = this.orders.length
      ? 'ORDER BY ' +
        this.orders
          .map((o) => `t.${qi(o.column)} ${o.ascending ? 'ASC' : 'DESC'}`)
          .join(', ')
      : ''

    let limitOffset = ''
    if (this.rangeFrom !== null && this.rangeTo !== null) {
      const lim = this.rangeTo - this.rangeFrom + 1
      params.push(lim)
      const limIdx = params.length
      params.push(this.rangeFrom)
      const offIdx = params.length
      limitOffset = `LIMIT $${limIdx} OFFSET $${offIdx}`
    } else if (this.limitN !== null) {
      params.push(this.limitN)
      limitOffset = `LIMIT $${params.length}`
    }

    let count: number | null = null
    if (this.countMode === 'exact') {
      const countParams: any[] = []
      const countWhere = this.buildWhere(countParams, 't')
      const cRes = await pool.query(
        `SELECT COUNT(*)::int AS n FROM ${qi(this.table)} t ${countWhere}`,
        countParams
      )
      count = cRes.rows[0]?.n ?? 0
    }

    if (this.headOnly) {
      return { data: null, error: null, count }
    }

    const sql = `SELECT ${selectList} FROM ${qi(
      this.table
    )} t ${where} ${orderBy} ${limitOffset}`.trim()
    const res = await pool.query(sql, params)
    let rows: any = res.rows

    if (this.single_ || this.maybeSingle_) {
      if (rows.length === 0) {
        if (this.single_) {
          return {
            data: null,
            error: { message: 'No rows found', code: 'PGRST116' },
            count,
          }
        }
        return { data: null, error: null, count }
      }
      return { data: rows[0], error: null, count }
    }

    return { data: rows, error: null, count }
  }

  private normalizeRows(): any[] {
    return Array.isArray(this.payload) ? this.payload : [this.payload]
  }

  private async runInsert() {
    const rows = this.normalizeRows()
    if (rows.length === 0) return { data: [], error: null, count: null }
    const cols = Array.from(
      rows.reduce((set: Set<string>, r: any) => {
        Object.keys(r).forEach((k) => set.add(k))
        return set
      }, new Set<string>())
    )
    const params: any[] = []
    const valuesSql = rows
      .map((r: any) => {
        const placeholders = cols.map((c) => {
          params.push(serializeValue(r[c]))
          return `$${params.length}`
        })
        return '(' + placeholders.join(', ') + ')'
      })
      .join(', ')

    const returning = 'RETURNING *'
    const sql = `INSERT INTO ${qi(this.table)} (${cols
      .map(qi)
      .join(', ')}) VALUES ${valuesSql} ${returning}`
    const res = await pool.query(sql, params)
    return this.finalizeWrite(res.rows)
  }

  private async runUpsert() {
    const rows = this.normalizeRows()
    if (rows.length === 0) return { data: [], error: null, count: null }
    const cols = Array.from(
      rows.reduce((set: Set<string>, r: any) => {
        Object.keys(r).forEach((k) => set.add(k))
        return set
      }, new Set<string>())
    )
    const params: any[] = []
    const valuesSql = rows
      .map((r: any) => {
        const placeholders = cols.map((c) => {
          params.push(serializeValue(r[c]))
          return `$${params.length}`
        })
        return '(' + placeholders.join(', ') + ')'
      })
      .join(', ')

    const conflictCols = (this.onConflict || '')
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)
    const conflictTarget = conflictCols.length
      ? `(${conflictCols.map(qi).join(', ')})`
      : ''
    const updateSet = cols
      .filter((c) => !conflictCols.includes(c))
      .map((c) => `${qi(c)} = EXCLUDED.${qi(c)}`)
      .join(', ')

    const conflictClause = conflictTarget
      ? `ON CONFLICT ${conflictTarget} DO UPDATE SET ${updateSet || conflictCols
          .map((c) => `${qi(c)} = EXCLUDED.${qi(c)}`)
          .join(', ')}`
      : ''

    const sql = `INSERT INTO ${qi(this.table)} (${cols
      .map(qi)
      .join(', ')}) VALUES ${valuesSql} ${conflictClause} RETURNING *`
    const res = await pool.query(sql, params)
    return this.finalizeWrite(res.rows)
  }

  private async runUpdate() {
    const params: any[] = []
    const setSql = Object.keys(this.payload)
      .map((k) => {
        params.push(serializeValue(this.payload[k]))
        return `${qi(k)} = $${params.length}`
      })
      .join(', ')
    const where = this.buildWhere(params) // no alias for update
    const sql = `UPDATE ${qi(this.table)} SET ${setSql} ${where} RETURNING *`
    const res = await pool.query(sql, params)
    return this.finalizeWrite(res.rows)
  }

  private async runDelete() {
    const params: any[] = []
    const where = this.buildWhere(params)
    const sql = `DELETE FROM ${qi(this.table)} ${where} RETURNING *`
    const res = await pool.query(sql, params)
    return this.finalizeWrite(res.rows)
  }

  private finalizeWrite(rows: any[]) {
    if (this.single_ || this.maybeSingle_) {
      if (rows.length === 0) {
        if (this.single_) {
          return {
            data: null,
            error: { message: 'No rows returned', code: 'PGRST116' },
            count: null,
          }
        }
        return { data: null, error: null, count: null }
      }
      return { data: rows[0], error: null, count: null }
    }
    // supabase returns null data for write ops without .select(); but many
    // callers ignore data in that case, so returning rows is harmless.
    return { data: this.returnRows ? rows : rows, error: null, count: null }
  }

  // ── thenable ────────────────────────────────────────────────
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?:
      | ((value: { data: any; error: any; count: number | null }) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): PromiseLike<TResult1 | TResult2> {
    return this.run().then(onfulfilled, onrejected)
  }
}

// ── Relationship resolution for embeds ────────────────────────
function resolveRelationship(
  baseTable: string,
  embedTable: string
): { cardinality: 'one' | 'many'; predicate: string } {
  // applications.job:jobs(...) — applications.job_id -> jobs.id (many-to-one)
  if (baseTable === 'applications' && embedTable === 'jobs') {
    return { cardinality: 'one', predicate: `e.job_id = t.id` }
  }

  // child tables that hold application_id and belong to applications (one parent -> many children,
  // but in practice these are 1:1 detail tables; the app reads them as single objects
  // via app.qualifications?.x — so treat as ONE).
  const oneToOneOfApplication = [
    'application_qualifications',
    'application_experience',
    'application_compensation',
  ]
  if (
    baseTable === 'applications' &&
    oneToOneOfApplication.includes(embedTable)
  ) {
    return { cardinality: 'one', predicate: `e.application_id = t.id` }
  }

  // application_documents.application:applications(...) — child references parent
  if (baseTable === 'application_documents' && embedTable === 'applications') {
    return { cardinality: 'one', predicate: `e.id = t.application_id` }
  }

  // admin_users.staff_profiles(...) — staff_profiles.admin_user_id -> admin_users.id (1:1 here)
  if (baseTable === 'admin_users' && embedTable === 'staff_profiles') {
    return { cardinality: 'one', predicate: `e.admin_user_id = t.id` }
  }

  // Generic fallback: assume embed table has <base_singular>_id
  const singular = baseTable.replace(/s$/, '')
  return {
    cardinality: 'many',
    predicate: `e.${singular}_id = t.id`,
  }
}

// ── Helpers ───────────────────────────────────────────────────
function serializeValue(v: any): any {
  if (v === undefined) return null
  // Arrays: let pg handle TEXT[] natively; but JSON columns need stringify.
  // We can't know column type here, so: plain JS arrays of primitives -> pg array;
  // objects / arrays-of-objects -> JSON string.
  if (Array.isArray(v)) {
    const hasObjects = v.some((x) => x !== null && typeof x === 'object')
    if (hasObjects) return JSON.stringify(v)
    return v // node-postgres maps JS arrays to Postgres arrays
  }
  if (v !== null && typeof v === 'object' && !(v instanceof Date)) {
    return JSON.stringify(v)
  }
  return v
}

function splitTopLevel(s: string, delim: string): string[] {
  const out: string[] = []
  let depth = 0
  let cur = ''
  for (const ch of s) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === delim && depth === 0) {
      out.push(cur)
      cur = ''
    } else cur += ch
  }
  if (cur) out.push(cur)
  return out
}

const ALLOWED_OR_COLUMNS = new Set([
  'first_name', 'last_name', 'email', 'ref_code',
  'title', 'slug', 'department', 'location', 'status',
  'name', 'code', 'full_name', 'job_title',
  'metric_name', 'snapshot_date',
  'setting_key', 'setting_value',
])

function parseOrExpr(
  expr: string
): { col: string; opr: string; val: string } | null {
  // format: column.operator.value  e.g. first_name.ilike.%john%
  const first = expr.indexOf('.')
  if (first === -1) return null
  const second = expr.indexOf('.', first + 1)
  if (second === -1) return null
  const col = expr.slice(0, first).trim()
  const opr = expr.slice(first + 1, second).trim()
  const val = expr.slice(second + 1)
  if (!ALLOWED_OR_COLUMNS.has(col)) return null
  return { col, opr, val }
}

// ── Public client (Supabase-like) ─────────────────────────────
export function createDbClient() {
  return {
    from(table: string) {
      return new QueryBuilder(table)
    },
  }
}

export type DbClient = ReturnType<typeof createDbClient>
