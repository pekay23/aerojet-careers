import { cache } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Building2, Clock, Users } from 'lucide-react'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import JobApplyContent from '@/components/apply/JobApplyContent'
import { getLiveJobBySlug } from '@/lib/recruitment-data'
import { formatCloseDate } from '@/lib/dates'
import type { Metadata } from 'next'
import type { Job } from '@/types'

// A role whose closing date has passed must disappear from the public site
// within a minute, so this page's revalidation window matches the job
// listing's. The per-slug data cache uses the same window, otherwise the
// expiry filter inside the cached query would not run again in time.
export const revalidate = 60

// Dedup the getLiveJobBySlug call within a single request so generateMetadata
// and the page body issue one DB query instead of two (unstable_cache does not
// dedupe within a request).
const getJob = cache((slug: string) => getLiveJobBySlug(slug))

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  // Only live jobs are ever exposed here — a draft job's title/summary must
  // not leak into the page metadata while the page itself 404s.
  let job: Job | null = null
  try {
    job = await getJob(slug)
  } catch (err) {
    console.error('[apply] metadata lookup failed for', slug, err)
    job = null
  }

  if (!job) {
    return {
      title: 'Apply',
      description: 'Apply for a role at Aerojet Aviation.',
    }
  }

  return {
    title: job.title || 'Apply',
    description: job.summary || 'Apply for a role at Aerojet Aviation.',
  }
}

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params

  let job: Job | null = null
  try {
    job = await getJob(slug)
  } catch (err) {
    // A database outage is NOT the same as a withdrawn role: re-throw so the
    // request renders a 500 with a "Try Again" affordance instead of telling
    // the candidate the job no longer exists.
    console.error('[apply] job lookup failed for', slug, err)
    throw err
  }

  if (!job) notFound()

  const j = job

  return (
    <>
        <SiteNav />

      {/* Hero */}
      <div
        className="relative text-white page-pad"
        style={{ background: 'var(--navy)', paddingBottom: '3rem' }}
      >
        {/* Background image overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: "url('/images/DSC00017-CKppWJie.jpg')",
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.18,
        }} />
        <div className="container-max mx-auto px-8" style={{ position: 'relative', zIndex: 1, paddingTop: '3rem' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', marginBottom: '1.25rem' }}>
            <Link href="/jobs" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Careers</Link>
            {' › '}
            <Link href="/jobs" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Current Vacancies</Link>
            {' › '}
            {j.title}
          </div>
          <h1 style={{ color: 'white', fontSize: '2rem', marginBottom: '0.875rem' }}>{j.title}</h1>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><MapPin size={15} aria-hidden="true" /> {j.location}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Building2 size={15} aria-hidden="true" /> {j.department}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={15} aria-hidden="true" /> {j.employment_type?.replace(/_/g, ' ')}</span>
            {j.target_count && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Users size={15} aria-hidden="true" /> {j.target_count} {j.target_count === 1 ? 'Vacancy' : 'Vacancies'}</span>}
            {!j.target_count && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Users size={15} aria-hidden="true" /> Open positions</span>}
            {j.closes_at && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={15} aria-hidden="true" /> Closes {formatCloseDate(j.closes_at)}</span>}
            {!j.closes_at && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={15} aria-hidden="true" /> No deadline</span>}
          </div>
        </div>
      </div>

      {/* Job detail + reveal-on-click application form (client). */}
      <JobApplyContent job={j} />

      <SiteFooter />
    </>
  )
}
