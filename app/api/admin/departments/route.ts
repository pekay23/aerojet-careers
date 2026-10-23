import { NextRequest } from 'next/server'
import { z } from 'zod'
import { revalidatePath, revalidateTag } from 'next/cache'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole, sanitizeErrorMessage } from '@/lib/api-utils'
import { DepartmentSchema as SharedDepartmentSchema } from '@/lib/validation/schemas'
import { JOBS_CACHE_TAG, JOB_DETAIL_CACHE_TAG, METADATA_CACHE_TAG, STATS_CACHE_TAG } from '@/lib/recruitment-data'

const DepartmentSchema = SharedDepartmentSchema.extend({
  code: z.string().min(1, 'Department code is required').max(20).nullish(),
  manager_id: z.string().uuid().nullable().optional(),
})

function generateDeptCode(name: string): string {
  const base = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 4)
  return base
}

const DepartmentUpdateSchema = DepartmentSchema.partial()
  .extend({
    id: z.string().uuid('id must be a valid UUID'),
  })
  .superRefine((data, ctx) => {
    if (
      data.name === undefined &&
      data.code === undefined &&
      data.manager_id === undefined &&
      data.current_budget === undefined
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'At least one of name, code, manager_id, or current_budget is required',
        path: ['root'],
      })
    }
  })

export async function GET(_req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { data: depts, error } = await supabaseAdmin
      .from('departments')
      .select(`
        id,
        name,
        code,
        manager_id,
        current_budget,
        updated_at,
        manager:admin_users!departments_manager_id_fkey (
          full_name,
          email
        )
      `)
      .order('name')

    if (error) throw error
    return ApiResponse.success(depts, 200, { 'Cache-Control': 'private, max-age=60' })
  } catch (err) {
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const body = await req.json()
    const { id, current_budget, change_reason, ...rest } = body

    if (id) {
      // UPDATE EXISTING
      const updateParsed = DepartmentUpdateSchema.safeParse({ id, ...rest })
      if (!updateParsed.success) {
        return ApiResponse.error(
          'Validation failed: ' + updateParsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
          400
        )
      }

      // 1. Get current budget for history tracking
      const { data: current } = await supabaseAdmin
        .from('departments')
        .select('current_budget, name')
        .eq('id', id)
        .single()

      // 2. Update department — only include current_budget if provided in body
      const updateData: any = { ...updateParsed.data, updated_at: new Date().toISOString() }
      if (current_budget !== undefined) {
        updateData.current_budget = current_budget
      }

      const { data, error } = await supabaseAdmin
        .from('departments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // Cascade a department rename to the denormalised jobs.department column
      // so existing jobs keep matching their department.
      const newName = updateParsed.data.name
      if (newName !== undefined && current && newName !== current.name) {
        const { error: jobsError } = await supabaseAdmin
          .from('jobs')
          .update({ department: newName })
          .eq('department', current.name)
        if (jobsError) throw jobsError
        // jobs.department is part of the cached public payload, so drop it too.
        revalidateTag(JOBS_CACHE_TAG, { expire: 0 })
        // The per-slug job payload embeds the department name, so the job
        // detail cache has to go as well.
        revalidateTag(JOB_DETAIL_CACHE_TAG, { expire: 0 })
        // ...and so does the rendered job detail page (Full Route Cache, keyed
        // by path rather than by tag).
        revalidatePath('/apply/[slug]', 'page')
      }

      // 3. Log budget change if amount changed
      if (current_budget !== undefined && current_budget !== current?.current_budget) {
        await supabaseAdmin.from('department_budget_history').insert({
          department_id: id,
          amount: current_budget,
          prev_amount: current?.current_budget,
          change_reason: change_reason || 'Manual update',
          created_by: auth.user.id
        })
      }

      // 4. The write is committed — the cached public metadata embeds the
      //    department name/code, so drop it.
      revalidateTag(METADATA_CACHE_TAG, { expire: 0 })
      // The per-slug job payload embeds the department name, so the job
      // detail cache has to go as well.
      revalidateTag(JOB_DETAIL_CACHE_TAG, { expire: 0 })
      // The "Departments Hiring" counter on the homepage is derived from this
      // table, so it has to be dropped too.
      revalidateTag(STATS_CACHE_TAG, { expire: 0 })
      // revalidateTag only purges the Next.js Data Cache; the CDN copy of the
      // public endpoint is keyed by URL, so purge it by path too.
      revalidatePath('/api/metadata')
      revalidatePath('/api/stats')
      // The job detail pages render the department name, so their rendered
      // (path-keyed) cache has to be dropped as well.
      revalidatePath('/apply/[slug]', 'page')

      return ApiResponse.success(data)
    } else {
       // CREATE NEW — strip empty/null code so auto-generation kicks in
       const cleanRest = { ...rest }
       if (!cleanRest.code || cleanRest.code === '') {
         delete cleanRest.code
       }

       const createParsed = DepartmentSchema.safeParse(cleanRest)
       if (!createParsed.success) {
         return ApiResponse.error(
           'Validation failed: ' + createParsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
           400
         )
       }

       const deptData: any = { ...createParsed.data }

       // Auto-generate code if none provided
       if (!deptData.code) {
         let code = generateDeptCode(deptData.name)
         const existing = await supabaseAdmin
           .from('departments')
           .select('code')
           .eq('code', code)
           .maybeSingle()
         if (existing.data) {
           const suffix = Math.floor(Math.random() * 9000) + 1000
           code = `${code}${suffix}`
         }
         deptData.code = code
       }

       // Strip null/undefined fields before insert
       Object.keys(deptData).forEach((k) => {
         if (deptData[k] === null || deptData[k] === undefined) delete deptData[k]
       })

       const { data, error } = await supabaseAdmin
         .from('departments')
         .insert(deptData)
         .select()
         .single()

        if (error) throw error

        // The write is committed — a new department changes the cached public
        // metadata, so drop it.
        revalidateTag(METADATA_CACHE_TAG, { expire: 0 })
        // The per-slug job payload embeds the department name, so the job
        // detail cache has to go as well.
        revalidateTag(JOB_DETAIL_CACHE_TAG, { expire: 0 })
        // The "Departments Hiring" counter on the homepage is derived from this
        // table, so it has to be dropped too.
        revalidateTag(STATS_CACHE_TAG, { expire: 0 })
        // revalidateTag only purges the Next.js Data Cache; the CDN copy of the
        // public endpoint is keyed by URL, so purge it by path too.
        revalidatePath('/api/metadata')
        revalidatePath('/api/stats')

        return ApiResponse.success(data)
    }
  } catch (err) {
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}
