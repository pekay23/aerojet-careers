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
    .select('*')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  return (
    <>
      <SiteNav />

      <PageHero
        title="Current Vacancies"
        subtitle="Join the team building West Africa's premier MRO facility"
        height={360}
      />

      <section style={{ background: 'white', padding: '3rem 1rem 4rem' }}>
        <div className="max-w-content mx-auto">
          <JobsClient initialJobs={jobs || []} />
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
