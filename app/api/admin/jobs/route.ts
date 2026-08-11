import { NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole, ALLOWED_UPDATE_KEYS } from '@/lib/api-utils'

const JobStatusSchema = z.enum(['draft', 'open', 'paused', 'closed', 'filled'])
const JobCategorySchema = z.enum(['experienced_professional', 'graduate_program', 'skilled_training', 'general_application'])
const EmploymentTypeSchema = z.enum(['full_time', 'part_time', 'contract', 'trainee', 'internship'])

const JobCreateSchema = z.object({
  title: z.string().min(1, 'Job title is required'),
  ref_code: z.string().regex(/^[A-Z0-9-]{3,30}$/, 'Must be 3-30 uppercase letters, digits, or hyphens').optional(),
  department: z.string().min(1, 'Department is required'),
  category: JobCategorySchema.default('experienced_professional'),
  employment_type: EmploymentTypeSchema.default('full_time'),
  location: z.string().default('Accra, Ghana (AIA)'),
  status: JobStatusSchema.optional(),
  target_count: z.number().int().positive().nullable().optional(),
  summary: z.string().nullable().optional(),
  responsibilities: z.string().nullable().optional(),
  requirements: z.string().nullable().optional(),
  what_we_offer: z.string().nullable().optional(),
  salary_range_min: z.number().nullable().optional(),
  salary_range_max: z.number().nullable().optional(),
  tags: z.array(z.string()).optional(),
  closes_at: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
})

const JobUpdateSchema = JobCreateSchema.partial().extend({
  id: z.string().uuid('id must be a valid UUID'),
})


export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager', 'recruiter'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const p = new URL(req.url).searchParams
    const status  = p.get('status')
    const sortCol = p.get('sort')  || 'created_at'
    const sortDir = p.get('dir')  || 'desc'
    const page    = Math.max(1, parseInt(p.get('page') || '1', 10))
    const limit   = Math.min(100, Math.max(1, parseInt(p.get('limit') || '50', 10)))
    const from    = (page - 1) * limit
    const to      = from + limit - 1

    let q = supabaseAdmin
      .from('jobs')
      .select('*', { count: 'exact' })
      .order(sortCol, { ascending: sortDir === 'asc' })
      .range(from, to)
    if (status) q = q.eq('status', status)
    const { data, error, count } = await q
    if (error) throw error
    return ApiResponse.success({ data, total: count, page, limit })
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const body = await req.json()
    const parsed = JobCreateSchema.safeParse(body)
    if (!parsed.success) {
      return ApiResponse.error(
        'Validation failed: ' + parsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
        400
      )
    }

     const v = parsed.data

    // Validate department exists (FK at app level since departments table is independent)
    const { data: dept } = await supabaseAdmin
      .from('departments')
      .select('id')
      .eq('name', v.department)
      .maybeSingle()

    if (!dept) {
      return ApiResponse.error(`Department "${v.department}" does not exist. Create it first.`, 400)
    }
    const slug = v.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const isPublishing = v.status === 'open'

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .insert({
        ...v,
        slug,
        status: v.status || 'draft',
        published_at: isPublishing && !v.published_at ? new Date().toISOString() : v.published_at,
        created_by: auth.adminUserId,
      })
      .select()
      .single()

    if (error) throw error

    await supabaseAdmin.from('pipeline_events').insert({
      event_type: 'job_created',
      note: `Job "${v.title}" created (${v.status || 'draft'}) by ${auth.user.email}`,
      admin_user_id: auth.adminUserId,
    })

    return ApiResponse.success(data)
  } catch (err: any) {
    if (err?.code === '23505') {
      return ApiResponse.error('A job with this title or reference code already exists', 409)
    }
    return ApiResponse.error(err.message, 500)
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const body = await req.json()
    const parsed = JobUpdateSchema.safeParse(body)
    if (!parsed.success) {
      return ApiResponse.error(
        'Validation failed: ' + parsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
        400
      )
    }

    const { id, ...rawUpdates } = parsed.data as Record<string, any>

    const updates: Record<string, any> = {}
    for (const key of ALLOWED_UPDATE_KEYS) {
      if (key in rawUpdates && rawUpdates[key] !== undefined) {
        updates[key] = rawUpdates[key]
      }
    }

    // Validate department exists (FK at app level since departments table is independent)
    if (updates.department) {
      const { data: dept } = await supabaseAdmin
        .from('departments')
        .select('id')
        .eq('name', updates.department)
        .maybeSingle()

      if (!dept) {
        return ApiResponse.error(`Department "${updates.department}" does not exist. Create it first.`, 400)
      }
    }

    // Regenerate slug when title changes
    if (updates.title) {
      updates.slug = updates.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }

    const prev = await supabaseAdmin.from('jobs').select('status, published_at').eq('id', id).maybeSingle()
    const prevStatus = prev.data?.status
    const prevPublished = prev.data?.published_at

    if (updates.status === 'open' && !updates.published_at) {
      if (!prevPublished) updates.published_at = new Date().toISOString()
    }
    if (updates.status && updates.status !== 'open' && !('published_at' in updates)) {
      if (prevPublished) updates.published_at = null
    }

    updates.updated_at = new Date().toISOString()

    const { data, error } = await supabaseAdmin
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    if (updates.status && updates.status !== prevStatus) {
      await supabaseAdmin.from('pipeline_events').insert({
        event_type: 'job_status_change',
        from_status: prevStatus,
        to_status: updates.status,
         note: `Job "${data.title}" status changed from ${prevStatus || 'N/A'} to ${updates.status} by ${auth.user.email}`,
         admin_user_id: auth.adminUserId,
      })
    }

    return ApiResponse.success(data)
  } catch (err: any) {
    if (err?.code === '23505') {
      return ApiResponse.error('A job with this title or reference code already exists', 409)
    }
    return ApiResponse.error(err.message, 500)
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const id = new URL(req.url).searchParams.get('id')
    if (!id) return ApiResponse.error('id required', 400)
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      return ApiResponse.error('id must be a valid UUID', 400)
    }

    const { data: job } = await supabaseAdmin.from('jobs').select('title').eq('id', id).maybeSingle()
    const { error } = await supabaseAdmin.from('jobs').delete().eq('id', id)
    if (error) throw error

    await supabaseAdmin.from('pipeline_events').insert({
      event_type: 'job_deleted',
      note: `Job "${job?.title || id}" deleted by ${auth.user.email}`,
       admin_user_id: auth.adminUserId,
    })

    return ApiResponse.success({ message: 'Job deleted' })
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
