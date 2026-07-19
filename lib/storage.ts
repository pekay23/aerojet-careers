import { pool } from './db'

/**
 * Local file storage (replaces Supabase Storage) backed by the
 * `storage_objects` table on Neon. Files are stored as BYTEA and served
 * through /api/files.
 */

export interface StoredObject {
  bucket: string
  path: string
  contentType: string | null
  size: number
}

export async function putObject(
  bucket: string,
  path: string,
  data: Buffer,
  contentType?: string
): Promise<void> {
  await pool.query(
    `INSERT INTO storage_objects (bucket, path, content, content_type, size)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (bucket, path)
     DO UPDATE SET content = EXCLUDED.content,
                   content_type = EXCLUDED.content_type,
                   size = EXCLUDED.size,
                   created_at = NOW()`,
    [bucket, path, data, contentType ?? null, data.length]
  )
}

export async function getObject(
  bucket: string,
  path: string
): Promise<{ content: Buffer; contentType: string | null } | null> {
  const res = await pool.query(
    'SELECT content, content_type FROM storage_objects WHERE bucket = $1 AND path = $2 LIMIT 1',
    [bucket, path]
  )
  const row = res.rows[0]
  if (!row) return null
  return { content: row.content as Buffer, contentType: row.content_type }
}

export async function removeObjects(
  bucket: string,
  paths: string[]
): Promise<void> {
  if (!paths.length) return
  await pool.query(
    'DELETE FROM storage_objects WHERE bucket = $1 AND path = ANY($2)',
    [bucket, paths]
  )
}

/**
 * Build the internal URL used to read a stored object. Because access is
 * gated by /api/files (which checks the session), this replaces both
 * Supabase public URLs and signed URLs.
 */
export function objectUrl(bucket: string, path: string): string {
  return `/api/files?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}`
}
