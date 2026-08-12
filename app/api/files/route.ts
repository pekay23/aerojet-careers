import { NextRequest, NextResponse } from 'next/server'
import { getObject } from '@/lib/storage'
import { getServerUser } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Serves stored files (replaces Supabase public/signed storage URLs).
 * Requires a valid session — all buckets in this app hold private HR data.
 * Access is limited to files owned by the requesting user's applications or talent record.
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

  const filename = path.split('/').pop() || 'file'

  let allowed = false

  if (bucket === 'application-documents') {
    const [appDocCheck, talentCheck] = await Promise.all([
      supabaseAdmin
        .from('application_documents')
        .select('id, application_id')
        .eq('file_path', path)
        .eq('storage_bucket', bucket)
        .maybeSingle(),
      supabaseAdmin
        .from('talent_pool')
        .select('id')
        .eq('cv_path', path)
        .maybeSingle(),
    ])

    if (appDocCheck.data) {
      const { data: app } = await supabaseAdmin
        .from('applications')
        .select('email')
        .eq('id', appDocCheck.data.application_id)
        .maybeSingle()
      allowed = app?.email === user.email
    }

    if (!allowed && talentCheck.data) {
      const { data: talent } = await supabaseAdmin
        .from('talent_pool')
        .select('email')
        .eq('id', talentCheck.data.id)
        .maybeSingle()
      allowed = talent?.email === user.email
    }
  } else if (bucket === 'branding-assets') {
    const { data: asset } = await supabaseAdmin
      .from('branding_assets')
      .select('id')
      .eq('file_path', path)
      .maybeSingle()
    allowed = !!asset
  }

  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const obj = await getObject(bucket, path)
  if (!obj) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }

  return new NextResponse(new Uint8Array(obj.content), {
    headers: {
      'Content-Type': obj.contentType || 'application/octet-stream',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, max-age=60',
    },
  })
}
