import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file     = formData.get('file')           as File | null
    const talentId = formData.get('talent_pool_id') as string | null

    if (!file || !talentId) {
      console.warn('Talent Upload 400: Missing file or talent_pool_id', { file: !!file, talentId: !!talentId })
      return NextResponse.json({ error: 'file and talent_pool_id are required' }, { status: 400 })
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
      console.warn('Talent Upload 400: Invalid file type', { type: file.type })
      return NextResponse.json({ error: 'File type not permitted' }, { status: 400 })
    }

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `talent-pool/${talentId}/${Date.now()}-${safe}`

    const bytes = await file.arrayBuffer()
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('application-documents')
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (uploadErr) {
      console.error('Talent Storage upload error:', uploadErr)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // Update talent_pool table with cv_path
    const { error: dbErr } = await supabaseAdmin
      .from('talent_pool')
      .update({ cv_path: path })
      .eq('id', talentId)

    if (dbErr) {
      console.error('Talent DB update error:', dbErr)
      return NextResponse.json({ error: 'Failed to update talent record' }, { status: 500 })
    }

    return NextResponse.json({ success: true, path })

  } catch (err) {
    console.error('Talent upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
