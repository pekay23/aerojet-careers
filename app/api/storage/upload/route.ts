import { NextRequest, NextResponse } from 'next/server'
import { putObject } from '@/lib/storage'
import { getServerUser } from '@/lib/auth'
import { sanitizeErrorMessage } from '@/lib/api-utils'

/**
 * Generic authenticated upload endpoint used by the browser storage shim
 * (lib/supabase.ts). Stores bytes in the Neon storage_objects table.
 */
export async function POST(req: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const form = await req.formData()
    const bucket = form.get('bucket') as string | null
    const path = form.get('path') as string | null
    const file = form.get('file') as File | null

    if (!bucket || !path || !file) {
      return NextResponse.json({ error: 'bucket, path and file required' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 10 MB' }, { status: 400 })
    }

    const buf = Buffer.from(new Uint8Array(await file.arrayBuffer()))
    await putObject(bucket, path, buf, file.type)

    return NextResponse.json({ success: true, path })
  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 })
  }
}
