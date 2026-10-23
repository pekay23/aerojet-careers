import { NextRequest } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { z } from 'zod'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { ApiResponse, verifyRole, sanitizeErrorMessage } from '@/lib/api-utils'
import { METADATA_CACHE_TAG, JOB_DETAIL_CACHE_TAG, STATS_CACHE_TAG, loadRecruitmentMetadata } from '@/lib/recruitment-data'

const MetadataTypeSchema = z.enum(['category', 'employment_type'])

const MetadataItemSchema = z.object({
  value: z.string().min(1, 'value is required'),
  label: z.string().min(1, 'label is required'),
  is_active: z.boolean().optional(),
})

const MetadataItemsSchema = z.array(MetadataItemSchema)

export async function GET(_req: NextRequest) {
  try {
    // Public access allowed for recruitment metadata.
    // Deliberately uncached: the admin job form needs fresh categories and
    // employment types.
    const { categories, employment_types, departments } = await loadRecruitmentMetadata()

    return ApiResponse.success({
      categories,
      employment_types,
      departments,
    })
  } catch (err) {
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRole(['admin', 'hr_manager'])
    if (!auth) return ApiResponse.error('Unauthorized', 403)

    const body = await req.json()

    const typeResult = MetadataTypeSchema.safeParse(body.type)
    if (!typeResult.success) {
      return ApiResponse.error(
        'Validation failed: ' +
          typeResult.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
        400
      )
    }

    const itemsResult = MetadataItemsSchema.safeParse(body.items)
    if (!itemsResult.success) {
      return ApiResponse.error(
        'Validation failed: ' +
          itemsResult.error.issues.map((i: any) => `${i.path.join('.') || 'root'}: ${i.message}`).join(', '),
        400
      )
    }

    const type = typeResult.data
    const items = itemsResult.data
    const table = type === 'category' ? 'job_categories' : 'employment_types'

    const { data, error } = await supabaseAdmin
      .from(table)
      .upsert(items, { onConflict: 'value' })
      .select()

    if (error) throw error

    // The write is committed — drop the cached public metadata so the change
    // is visible on /api/metadata immediately.
    // Next 16 requires the second argument: `{ expire: 0 }` expires the
    // tagged data now (updateTag is Server-Action only).
    revalidateTag(METADATA_CACHE_TAG, { expire: 0 })
    // The per-slug job cache is a separate entry per slug and is not covered
    // by the metadata cache, so it has to be dropped explicitly or
    // /apply/<slug> keeps serving the previous row for up to 300s.
    revalidateTag(JOB_DETAIL_CACHE_TAG, { expire: 0 })
    // The homepage counters are dropped alongside every other admin write so
    // a single mutation can never leave a stale counter behind.
    revalidateTag(STATS_CACHE_TAG, { expire: 0 })
    // revalidateTag only purges the Next.js Data Cache; the CDN copy of the
    // public endpoint is keyed by URL, so purge it by path too.
    revalidatePath('/api/metadata')
    revalidatePath('/api/stats')

    return ApiResponse.success(data)
  } catch (err) {
    return ApiResponse.error(sanitizeErrorMessage(err), 500)
  }
}
