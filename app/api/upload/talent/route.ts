import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { verifyRole, sanitizeErrorMessage } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'], req)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 })
    }

    const talentId = formData.get('talent_pool_id') as string | null
    if (!talentId) {
      return NextResponse.json({ error: 'talent_pool_id is required' }, { status: 400 })
    }
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(talentId)) {
      return NextResponse.json({ error: 'talent_pool_id must be a valid UUID' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5 MB' }, { status: 400 })
    }

    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/webp'
    ]
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'File type not permitted' }, { status: 400 })
    }

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `talent-pool/${talentId}/${Date.now()}-${safe}`

    const bytes = await file.arrayBuffer()
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('application-documents')
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (uploadErr) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const { error: dbErr } = await supabaseAdmin
      .from('talent_pool')
      .update({ cv_path: path })
      .eq('id', talentId)

    if (dbErr) {
      return NextResponse.json({ error: 'Failed to update talent record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, path })

  } catch (err) {
    return NextResponse.json({ error: sanitizeErrorMessage(err) }, { status: 500 })
  }
}
