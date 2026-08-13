import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Building2, Clock, Users } from 'lucide-react'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import JobApplyContent from '@/components/apply/JobApplyContent'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Metadata } from 'next'
import type { Job } from '@/types'

export const revalidate = 300

type Props = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const { data: job, error } = await supabaseAdmin.from('jobs').select('title,summary').eq('slug', slug).single()

  if (error || !job) {
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
  const { data: job, error } = await supabaseAdmin
    .from('jobs')
    .select('id, ref_code, title, slug, department, category, employment_type, location, status, target_count, summary, responsibilities, requirements, what_we_offer, salary_range_min, salary_range_max, tags, closes_at, published_at, created_at, updated_at')
    .eq('slug', slug)
    .eq('status', 'live')
    .single()

  if (error || !job) notFound()

  const j = job as Job

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
            {j.closes_at && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Clock size={15} aria-hidden="true" /> Closes {new Date(j.closes_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
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
