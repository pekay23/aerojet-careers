import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero } from '@/components/ui'
import JobsClient from './JobsClient'
import { getPublicJobs, getRecruitmentMetadata } from '@/lib/recruitment-data'
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
  let departments: string[] = []
  let loadError: string | null = null

  try {
    jobs = await getPublicJobs()
  } catch (err) {
    // The raw driver error (database host, port, role name) is logged
    // server-side; the public page only ever shows a generic message.
    console.error('[jobs] failed to load job listings', err)
    loadError = 'Job listings are temporarily unavailable. Please try again shortly.'
  }

  // The department filter is a nice-to-have: a metadata outage must not take
  // the job list down with it, so it degrades to an empty filter list.
  try {
    const metadata = await getRecruitmentMetadata()
    departments = metadata.departments.map(d => d.name).filter(Boolean)
  } catch (err) {
    console.error('[jobs] failed to load recruitment metadata', err)
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
            <JobsClient initialJobs={jobs} departments={departments} loading={false} />
          )}
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
