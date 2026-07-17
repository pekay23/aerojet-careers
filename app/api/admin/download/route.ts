import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { searchParams } = new URL(req.url)
    const path   = searchParams.get('path')
    const bucket = searchParams.get('bucket') || 'application-documents'

    if (!path) return ApiResponse.error('path required', 400)

    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .download(path)

    if (error || !data) {
      return ApiResponse.error('File not found', 404)
    }

    const filename = path.split('/').pop() || 'download'
    const bytes    = await data.arrayBuffer()

    return new NextResponse(bytes, {
      headers: {
        'Content-Type':        data.type || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (err: any) {
    return ApiResponse.error(err.message || 'Download failed', 500)
  }
}
