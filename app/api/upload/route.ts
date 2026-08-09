import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse } from '@/lib/api-utils'

const ALLOWED_DOC_TYPES = ['cv', 'licence_scan', 'passport_scan', 'other'] as const
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]
const MAX_FILE_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return ApiResponse.error('file is required', 400)
    }

    const docType = formData.get('document_type') as string | null
    if (!docType || !ALLOWED_DOC_TYPES.includes(docType as any)) {
      return ApiResponse.error(`Invalid document_type. Must be one of: ${ALLOWED_DOC_TYPES.join(', ')}`, 400)
    }

    const appId = formData.get('application_id') as string | null
    if (!appId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(appId)) {
      return ApiResponse.error('Invalid application_id', 400)
    }

    if (file.size > MAX_FILE_SIZE) {
      return ApiResponse.error(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)} MB. Max allowed is 5 MB.`, 400)
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return ApiResponse.error(`Unsupported file type: "${file.type || 'unknown'}". Only PDF, DOC, DOCX and common images are permitted.`, 400)
    }

    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `applications/${appId}/${docType}/${Date.now()}-${safe}`

    const bytes = await file.arrayBuffer()
    const { error: uploadErr } = await supabaseAdmin.storage
      .from('application-documents')
      .upload(path, bytes, { contentType: file.type, upsert: false })

    if (uploadErr) {
      console.error('Storage upload error:', uploadErr)
      return ApiResponse.error('Upload failed', 500)
    }

    await supabaseAdmin.from('application_documents').insert({
      application_id: appId,
      document_type:  docType as 'cv' | 'licence_scan' | 'passport_scan' | 'other',
      file_name:      file.name,
      file_path:      path,
      file_size:      file.size,
      mime_type:      file.type,
      storage_bucket: 'application-documents',
    })

    return ApiResponse.success({ path })
  } catch (err: any) {
    console.error('Upload error:', err)
    return ApiResponse.error(err.message || 'Internal server error', 500)
  }
}
