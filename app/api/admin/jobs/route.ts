import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const status = new URL(req.url).searchParams.get('status')
    let q = supabaseAdmin.from('jobs').select('*').order('created_at', { ascending: false })
    if (status) q = q.eq('status', status)
    const { data, error } = await q
    if (error) throw error
    return ApiResponse.success(data)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const body = await req.json()
    const slug = (body.title as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert({ ...body, slug, status: body.status || 'draft' })
      .select()
      .single()

    if (error) throw error
    return ApiResponse.success(data)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { id, ...updates } = await req.json()
    if (!id) return ApiResponse.error('id required', 400)

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return ApiResponse.success(data)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return ApiResponse.error('id required', 400)

    const { error } = await supabaseAdmin.from('jobs').delete().eq('id', id)
    if (error) throw error
    return ApiResponse.success({ message: 'Job deleted' })
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
