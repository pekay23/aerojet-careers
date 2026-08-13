import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero } from '@/components/ui'
import JobsClient from './JobsClient'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Current Vacancies',
  description:
    "Browse all open roles at Aerojet Aviation — Engineering, IT, Operations, HR, Customer Support, Sales, Logistics and Quality positions in Accra, Ghana.",
}

export const revalidate = 60

export default async function JobsPage() {
  const { data: jobs } = await supabaseAdmin
    .from('jobs')
    .select('id, ref_code, title, slug, department, category, employment_type, location, status, target_count, summary, responsibilities, requirements, what_we_offer, salary_range_min, salary_range_max, tags, closes_at, published_at, created_at, updated_at')
    .eq('status', 'live')
    .order('created_at', { ascending: false })

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
          <JobsClient initialJobs={jobs || []} loading={!jobs} />
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
