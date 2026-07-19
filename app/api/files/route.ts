import { NextRequest, NextResponse } from 'next/server'
import { getObject } from '@/lib/storage'
import { getServerUser } from '@/lib/auth'

/**
 * Serves stored files (replaces Supabase public/signed storage URLs).
 * Requires a valid session — all buckets in this app hold private HR data.
 */
export async function GET(req: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const bucket = searchParams.get('bucket')
  const path = searchParams.get('path')

  if (!bucket || !path) {
    return NextResponse.json({ error: 'bucket and path required' }, { status: 400 })
  }

  const obj = await getObject(bucket, path)
  if (!obj) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  const filename = path.split('/').pop() || 'file'
  return new NextResponse(new Uint8Array(obj.content), {
    headers: {
      'Content-Type': obj.contentType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, max-age=60',
    },
  })
}
