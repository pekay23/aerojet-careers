import { notFound } from 'next/navigation'
import Link from 'next/link'
import { MapPin, Building2, Clock, Users, ArrowLeft } from 'lucide-react'
import SiteNav from '@/components/layout/SiteNav'

import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero, StatusPill, NoticeBanner } from '@/components/ui'
import ApplicationForm from '@/components/forms/ApplicationForm'
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
  const { data: job } = await supabaseAdmin.from('jobs').select('title,summary').eq('slug', slug).single()
  return {
    title: job?.title || 'Apply',
    description: job?.summary || 'Apply for a role at Aerojet Aviation.',
  }
}

export default async function ApplyPage({ params }: Props) {
  const { slug } = await params
  const { data: job } = await supabaseAdmin
    .from('jobs')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'open')
    .single()

  if (!job) notFound()

  const j = job as Job

  const CAT_LABELS: Record<string, string> = {
    experienced_professional: 'Experienced Professional',
    graduate_program:         'Graduate Program',
    skilled_training:         'Skilled Training',
    general_application:      'General Application',
  }

  return (
    <>
      <SiteNav activePath={`/apply/${slug}`} />
      
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
        <div className="max-w-content mx-auto px-8" style={{ position: 'relative', zIndex: 1, paddingTop: '3rem' }}>
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

          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <section style={{ background: 'white', padding: '3rem 1rem' }}>
        <div className="max-w-content mx-auto">
          <Link href="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--blue)', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: '2rem' }}>
            <ArrowLeft size={15} aria-hidden="true" /> Back to All Vacancies
          </Link>


          <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '3rem', alignItems: 'start' }}>

            {/* Job description */}
            <div>
              {j.summary && (
                <Section title="About the Role">
                  <p style={{ color: 'var(--muted)', lineHeight: 1.8, textAlign: 'justify' }}>{j.summary}</p>
                </Section>
              )}
              {j.responsibilities && (
                <Section title="Key Responsibilities">
                  <div style={{ color: 'var(--muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{j.responsibilities}</div>
                </Section>
              )}
              {j.requirements && (
                <Section title="Requirements">
                  <div style={{ color: 'var(--muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{j.requirements}</div>
                </Section>
              )}
              {j.what_we_offer && (
                <Section title="What We Offer">
                  <div style={{ color: 'var(--muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>{j.what_we_offer}</div>
                </Section>
              )}
              {j.tags && j.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '1.5rem' }}>
                  {j.tags.map((tag: string) => (
                    <span key={tag} style={{ background: '#eaf3fa', color: 'var(--navy)', border: '1px solid #c5dff0', padding: '0.25rem 0.7rem', borderRadius: 20, fontSize: 11, fontWeight: 500 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside style={{ position: 'sticky', top: 80 }}>
              {/* Apply CTA */}
              <div className="card" style={{ marginBottom: '1.25rem', overflow: 'hidden' }}>
                <div style={{ background: 'var(--navy)', padding: '1rem 1.5rem' }}>
                  <h3 style={{ color: 'white', fontSize: '0.95rem', margin: 0 }}>Apply for This Role</h3>
                </div>
                <div style={{ padding: '1.25rem 1.5rem' }}>
                  <a href="#apply-now" className="btn btn-blue" style={{ width: '100%', marginBottom: '0.875rem' }}>
                    Apply Now
                  </a>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {[
                      { label: 'LinkedIn', href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL}/apply/${j.slug}`)}`, bg: '#0a66c2' },
                      { label: 'Email',    href: `mailto:?subject=${encodeURIComponent(j.title + ' - Aerojet Aviation')}&body=${encodeURIComponent(`Apply here: ${process.env.NEXT_PUBLIC_APP_URL}/apply/${j.slug}`)}`, bg: '#555' },
                      { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(j.title + ': ' + process.env.NEXT_PUBLIC_APP_URL + '/apply/' + j.slug)}`, bg: '#25d366' },
                    ].map(s => (
                      <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textAlign: 'center', padding: '0.4rem', borderRadius: 3, fontSize: 11, fontWeight: 600, color: 'white', background: s.bg, textDecoration: 'none' }}>
                        {s.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Role summary */}
              <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ background: 'var(--navy)', padding: '1rem 1.5rem' }}>
                  <h3 style={{ color: 'white', fontSize: '0.95rem', margin: 0 }}>Role Summary</h3>
                </div>
                <div style={{ padding: '0.5rem 1.5rem' }}>
                  {[
                    ['Location',   j.location],
                    ['Department', j.department],
                    ['Category',   CAT_LABELS[j.category] || j.category],
                    ['Contract',   j.employment_type?.replace(/_/g, ' ')],
                    ['Vacancies',  j.target_count ? String(j.target_count) : 'Multiple'],
                    ['Ref',        j.ref_code],
                    ['Closes',     j.closes_at ? new Date(j.closes_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Rolling'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.65rem 0', borderBottom: '1px solid var(--border)', fontSize: 13, gap: '0.5rem' }}>
                      <span style={{ color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
                      <span style={{ color: 'var(--navy)', fontWeight: 600, textAlign: 'right' }}>{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="apply-now" style={{ background: 'var(--bg)', borderTop: '3px solid var(--blue)', padding: '4rem 1rem' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>
          <h2 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Apply — {j.title}</h2>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: '2rem', lineHeight: 1.6 }}>
            Complete all five steps. Fields marked <span style={{ color: 'var(--blue)' }}>*</span> are required.
            All information is treated in strict confidence.
          </p>
          <ApplicationForm jobId={j.id} jobTitle={j.title} />
        </div>
      </section>

      <SiteFooter />
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <h2 style={{
        fontSize: '1.35rem', marginBottom: '0.875rem',
        paddingBottom: '0.5rem', borderBottom: '2px solid var(--border)',
      }}>
        {title}
      </h2>
      {children}
    </div>
  )
}
