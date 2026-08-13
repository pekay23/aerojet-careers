import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero } from '@/components/ui'
import JobsClient from './JobsClient'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Metadata } from 'next'
import type { Job } from '@/types'

export const metadata: Metadata = {
  title: 'Current Vacancies',
  description:
    "Browse all open roles at Aerojet Aviation — Engineering, IT, Operations, HR, Customer Support, Sales, Logistics and Quality positions in Accra, Ghana.",
}

export const revalidate = 60

export default async function JobsPage() {
  let jobs: Job[] = []
  let loadError: string | null = null

  try {
    const result = await supabaseAdmin
      .from('jobs')
      .select('id, ref_code, title, slug, department, category, employment_type, location, status, target_count, summary, responsibilities, requirements, what_we_offer, salary_range_min, salary_range_max, tags, closes_at, published_at, created_at, updated_at')
      .eq('status', 'live')
      .order('created_at', { ascending: false })

    if (result.error) {
      console.error('[jobs-page][db-error]', result.error)
      loadError = result.error.message || 'Failed to load job listings'
    } else {
      jobs = result.data || []
    }
  } catch (err: any) {
    console.error('[jobs-page][db-exception]', err)
    loadError = err.message || 'Unexpected error loading jobs'
  }

  return (
    <>
      <SiteNav />

      <PageHero
        title="Current Vacancies"
        subtitle="Join the team building West Africa's premier MRO facility"
        height={360}
      />

      <section className="section-white">
        <div className="container-max mx-auto">
          {loadError ? (
            <div className="card card-inner" style={{ border: '1px solid var(--error)', background: 'var(--error-bg)' }}>
              <p style={{ color: 'var(--error)', fontWeight: 600 }}>Unable to load job listings</p>
              <p style={{ color: 'var(--muted)', marginTop: 8 }}>{loadError}</p>
              <p style={{ color: 'var(--muted)', marginTop: 8, fontSize: 12 }}>
                Please try refreshing the page. If the problem persists, contact us at careers@aerojet-aviation.com.
              </p>
            </div>
          ) : (
            <JobsClient initialJobs={jobs} loading={false} />
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
