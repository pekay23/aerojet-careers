import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse } from '@/lib/api-utils'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file     = formData.get('file')         as File | null
    const appId    = formData.get('application_id') as string | null
    const docType  = formData.get('document_type')  as string | null

    if (!file || !appId || !docType) {
      console.warn('Upload 400: Missing required fields', { file: !!file, appId: !!appId, docType: !!docType })
      return ApiResponse.error(`Missing fields: ${!file ? 'file ' : ''}${!appId ? 'application_id ' : ''}${!docType ? 'document_type' : ''}`.trim(), 400)
    }

    if (file.size > 5 * 1024 * 1024) {
      return ApiResponse.error(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)} MB. Max allowed is 5 MB.`, 400)
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
      console.warn('Upload 400: Invalid file type', { type: file.type, name: file.name })
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
