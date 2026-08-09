import { NextRequest } from 'next/server'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole } from '@/lib/api-utils'

const DepartmentSchema = z.object({
  name: z.string().min(1, 'Department name is required'),
  code: z.string().min(1, 'Department code is required').max(20),
  current_budget: z.number().min(0).optional(),
  manager_id: z.string().uuid().nullable().optional(),
})

const DepartmentUpdateSchema = DepartmentSchema.extend({
  id: z.string().uuid('id must be a valid UUID'),
})

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const { data: depts, error } = await supabaseAdmin
      .from('departments')
      .select(`
        *,
        manager:admin_users!departments_manager_id_fkey (
          full_name,
          email
        )
      `)
      .order('name')

    if (error) throw error
    return ApiResponse.success(depts)
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
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
        .select('current_budget')
        .eq('id', id)
        .single()

      // 2. Update department
      const { data, error } = await supabaseAdmin
        .from('departments')
        .update({ ...updateParsed.data, current_budget, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error

      // 3. Log budget change if amount changed
      if (current_budget !== current?.current_budget) {
        await supabaseAdmin.from('department_budget_history').insert({
          department_id: id,
          amount: current_budget,
          prev_amount: current?.current_budget,
          change_reason: change_reason || 'Manual update',
          created_by: auth.user.id
        })
      }

      return ApiResponse.success(data)
    } else {
      // CREATE NEW
      const createParsed = DepartmentSchema.safeParse(rest)
      if (!createParsed.success) {
        return ApiResponse.error(
          'Validation failed: ' + createParsed.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
          400
        )
      }

      const { data, error } = await supabaseAdmin
        .from('departments')
        .insert(createParsed.data)
        .select()
        .single()

      if (error) throw error
      return ApiResponse.success(data)
    }
  } catch (err: any) {
    return ApiResponse.error(err.message, 500)
  }
}
