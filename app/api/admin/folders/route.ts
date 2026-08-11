import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter', 'employee'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    // Ensure the "Recruitment Scans" folder exists so application/talent
    // documents are always reachable, even if the schema seed hasn't run.
    // Upsert on name is idempotent and safe against concurrent requests.
    await supabaseAdmin.from('document_folders').upsert({
      name: 'Recruitment Scans',
      description: 'CVs, licence scans and passport scans from applications and talent pool',
      icon: 'file-search',
    }, { onConflict: 'name' })

    const { data: folders, error } = await supabaseAdmin
      .from('document_folders')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('not found')) {
        return ApiResponse.success([])
      }
      throw error
    }

    return ApiResponse.success(folders)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const body = await req.json()
    const { name, description, icon } = body

    if (!name) {
      return ApiResponse.error('Folder name is required', 400)
    }

    const { data: folder, error } = await supabaseAdmin
      .from('document_folders')
      .insert({ name, description, icon })
      .select()
      .single()

    if (error) throw error

    return ApiResponse.success(folder)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
