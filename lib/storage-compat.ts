import { getObject, putObject, removeObjects, objectUrl } from './storage'

/**
 * Supabase-Storage-compatible wrapper backed by the Neon `storage_objects`
 * table. Mirrors the subset of the supabase-js storage API the app uses:
 *   storage.from(bucket).upload(path, data, opts)
 *   storage.from(bucket).download(path)
 *   storage.from(bucket).remove(paths)
 *   storage.from(bucket).createSignedUrl(path, expiresIn)
 *   storage.from(bucket).getPublicUrl(path)
 */

function toBuffer(data: ArrayBuffer | Uint8Array | Buffer | Blob): Promise<Buffer> | Buffer {
  if (Buffer.isBuffer(data)) return data
  if (data instanceof Uint8Array) return Buffer.from(data)
  if (data instanceof ArrayBuffer) return Buffer.from(new Uint8Array(data))
  // Blob / File
  if (typeof (data as Blob).arrayBuffer === 'function') {
    return (data as Blob).arrayBuffer().then((ab) => Buffer.from(new Uint8Array(ab)))
  }
  return Buffer.from(data as any)
}

class BucketApi {
  constructor(private bucket: string) {}

  async upload(
    path: string,
    data: ArrayBuffer | Uint8Array | Buffer | Blob,
    opts?: { contentType?: string; upsert?: boolean }
  ) {
    try {
      const buf = await toBuffer(data)
      await putObject(this.bucket, path, buf, opts?.contentType)
      return { data: { path }, error: null }
    } catch (e: any) {
      return { data: null, error: { message: e.message } }
    }
  }

  async download(path: string) {
    try {
      const obj = await getObject(this.bucket, path)
      if (!obj) return { data: null, error: { message: 'Object not found' } }
      // Return a Blob so callers can use `.arrayBuffer()` and `.type`.
      const blob = new Blob([new Uint8Array(obj.content)], {
        type: obj.contentType || 'application/octet-stream',
      })

      return { data: blob, error: null }
    } catch (e: any) {
      return { data: null, error: { message: e.message } }
    }
  }

  async remove(paths: string[]) {
    try {
      await removeObjects(this.bucket, paths)
      return { data: null, error: null }
    } catch (e: any) {
      return { data: null, error: { message: e.message } }
    }
  }

  async createSignedUrl(path: string, _expiresIn: number) {
    // Access is gated by the /api/files route (session-checked), so we can
    // hand back an internal URL that behaves like a signed URL.
    return { data: { signedUrl: objectUrl(this.bucket, path) }, error: null }
  }

  getPublicUrl(path: string) {
    return { data: { publicUrl: objectUrl(this.bucket, path) } }
  }
}

export const storageCompat = {
  from(bucket: string) {
    return new BucketApi(bucket)
  },
}
