import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter', 'employee'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { searchParams } = new URL(req.url)
    let staffId = searchParams.get('staffId')
    const folderId = searchParams.get('folderId')

    // SECURITY: If role is 'employee', they can ONLY see their own docs.
    if (auth.role === 'employee') {
      const { data: profile } = await supabaseAdmin
        .from('staff_profiles')
        .select('id')
        .eq('auth_user_id', auth.user.id)
        .maybeSingle()
      
      if (!profile) return ApiResponse.error('Staff profile not found', 404)
      
      // Override any requested staffId with their own ID
      staffId = profile.id
    }

    // 1. Check if we are looking at the "Recruitment Scans" folder
    if (folderId) {
      const { data: folder } = await supabaseAdmin
        .from('document_folders')
        .select('name')
        .eq('id', folderId)
        .single()
      
      if (folder?.name === 'Recruitment Scans') {
        let appDocsQuery = supabaseAdmin
          .from('application_documents')
          .select('*, application:applications(first_name, last_name)')
          .order('created_at', { ascending: false })
        
        // If staffId is provided, only show docs for that specific person's application
        if (staffId) {
          const { data: staff } = await supabaseAdmin
            .from('staff_profiles')
            .select('application_id')
            .eq('id', staffId)
            .maybeSingle()
          
          if (staff?.application_id) {
            appDocsQuery = appDocsQuery.eq('application_id', staff.application_id)
          } else {
            // Staff exists but no linked application - return empty
            return ApiResponse.success([])
          }
        }

        const { data: appDocs, error: appDocsErr } = await appDocsQuery
        if (appDocsErr) throw appDocsErr

        // Map application_documents to the format expected by FileManagement
        const mapped = await Promise.all(appDocs.map(async (d: any) => {
          const { data: signed } = await supabaseAdmin.storage
            .from(d.storage_bucket)
            .createSignedUrl(d.file_path, 3600) // 1 hour

          return {
            id: d.id,
            file_name: `${d.document_type.toUpperCase()} - ${d.application?.first_name} ${d.application?.last_name}`,
            file_url: signed?.signedUrl,
            file_type: d.mime_type,
            file_size: d.file_size,
            created_at: d.uploaded_at,
            folder_id: folderId,
            is_external: true
          }
        }))

        // Also surface talent pool CVs. Files live in the
        // `application-documents` bucket under `talent-pool/` paths.
        // Query storage_objects directly so we find ALL uploaded talent
        // files even if talent_pool.cv_path was never populated.
        if (!staffId) {
          const { data: talentFiles } = await supabaseAdmin
            .from('storage_objects')
            .select('path, content_type, size, created_at')
            .eq('bucket', 'application-documents')
            .ilike('path', 'talent-pool/%')
            .order('created_at', { ascending: false })

          if (talentFiles) {
            for (const f of talentFiles) {
              // Derive the talent's name from the path: talent-pool/{id}/{file}
              const seg = f.path.split('/')
              const talentId = seg[1]
              const fileName = seg[seg.length - 1] || 'CV'

              // Look up the talent's name for a friendly label
              const { data: talent } = await supabaseAdmin
                .from('talent_pool')
                .select('first_name, last_name')
                .eq('id', talentId)
                .maybeSingle()

              const { data: signed } = await supabaseAdmin.storage
                .from('application-documents')
                .createSignedUrl(f.path, 3600)

              mapped.push({
                id: `talent-${talentId}-${f.path}`,
                file_name: talent
                  ? `CV - ${talent.first_name} ${talent.last_name}`
                  : `CV - ${fileName}`,
                file_url: signed?.signedUrl || '',
                file_type: f.content_type || 'application/pdf',
                file_size: f.size,
                created_at: f.created_at,
                folder_id: folderId,
                is_external: true
              })
            }
          }
        }

        // Sort combined list by created_at desc
        mapped.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        return ApiResponse.success(mapped)
      }
    }

    let query = supabaseAdmin
      .from('staff_documents')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (staffId) query = query.eq('staff_id', staffId)
    if (folderId) query = query.eq('folder_id', folderId)

    const p = new URL(req.url).searchParams
    const page = Math.max(1, parseInt(p.get('page') || '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(p.get('limit') || '50', 10)))
    if (!staffId && !folderId) {
      const from = (page - 1) * limit
      const to = from + limit - 1
      query = query.range(from, to)
    }

    const { data: documents, error, count } = await query
    if (error) throw error

    if (folderId) {
      return ApiResponse.success({ data: documents, total: count, page, limit })
    }
    return ApiResponse.success(documents)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'employee'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const body = await req.json()
    const { staff_id, folder_id, file_name, file_url, file_type, file_size } = body

    if (!staff_id || !folder_id || !file_name || !file_url) {
      return ApiResponse.error('Missing required fields', 400)
    }

    // Security: Employee can only upload to their own profile
    if (auth.role === 'employee') {
      const { data: profile } = await supabaseAdmin
        .from('staff_profiles')
        .select('id')
        .eq('auth_user_id', auth.user.id)
        .maybeSingle()
      
      if (profile?.id !== staff_id) {
        return ApiResponse.error('Unauthorized: You can only upload to your own profile', 403)
      }
    }

    const { data: document, error } = await supabaseAdmin
      .from('staff_documents')
      .insert({
        staff_id,
        folder_id,
        file_name,
        file_url,
        file_type,
        file_size
      })
      .select()
      .single()

    if (error) throw error

    return ApiResponse.success(document)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'employee'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return ApiResponse.error('Document ID is required', 400)

    // 1. Get the document
    const { data: doc, error: fetchError } = await supabaseAdmin
      .from('staff_documents')
      .select('staff_id, file_url')
      .eq('id', id)
      .single()

    if (fetchError || !doc) return ApiResponse.error('Document not found', 404)

    // Security: Employee can only delete their own docs
    if (auth.role === 'employee') {
      const { data: profile } = await supabaseAdmin
        .from('staff_profiles')
        .select('id')
        .eq('auth_user_id', auth.user.id)
        .maybeSingle()
      
      if (profile?.id !== doc.staff_id) {
        return ApiResponse.error('Unauthorized', 403)
      }
    }

    // 2. Delete from storage
    const filePath = doc.file_url.split('/').pop()
    if (filePath) {
      await supabaseAdmin.storage.from('staff-documents').remove([filePath])
    }

    // 3. Delete from DB
    const { error: deleteError } = await supabaseAdmin
      .from('staff_documents')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    return ApiResponse.success({ message: 'Document deleted successfully' })
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
