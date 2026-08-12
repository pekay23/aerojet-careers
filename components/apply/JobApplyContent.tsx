'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ApplicationForm from '@/components/forms/ApplicationForm'
import type { Job } from '@/types'

const CAT_LABELS: Record<string, string> = {
  experienced_professional: 'Experienced Professional',
  graduate_program:         'Graduate Program',
  skilled_training:         'Skilled Training',
  general_application:      'General Application',
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

/**
 * Client wrapper for the job detail + application form. The multi-step form
 * stays hidden until the applicant clicks "Apply Now", keeping the initial view
 * focused on the role itself. Both the sidebar CTA and the inline prompt reveal
 * the form with a single click and smooth-scroll to it.
 */
export default function JobApplyContent({ job }: { job: Job }) {
  const j = job
  const [showForm, setShowForm] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  const reveal = () => {
    setShowForm(true)
    // Wait a tick for the form to mount before scrolling to it.
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60)
  }

  return (
    <>
      {/* Two-column layout */}
      <section style={{ background: 'white', padding: '3rem 1rem' }}>
        <div className="container-max mx-auto">
          <Link href="/jobs" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--blue)', fontSize: 13, fontWeight: 500, textDecoration: 'none', marginBottom: '2rem' }}>
            <ArrowLeft size={15} aria-hidden="true" /> Back to All Vacancies
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8 lg:gap-12 items-start">
            {/* Job description */}
            <div style={{ minWidth: 0 }}>
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
                  <button
                    type="button"
                    onClick={reveal}
                    aria-expanded={showForm}
                    aria-controls="apply-now"
                    className="btn btn-blue"
                    style={{ width: '100%', marginBottom: '0.875rem' }}
                  >
                    {showForm ? 'Continue Your Application' : 'Apply Now'}
                  </button>

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
                    ['Salary',     j.salary_range_min !== null && j.salary_range_max !== null
                      ? `USD ${j.salary_range_min.toLocaleString()} – ${j.salary_range_max.toLocaleString()} per month`
                      : 'Competitive'],
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

      {/* Application form — hidden until "Apply Now" is clicked. */}
      {showForm ? (
        <section
          id="apply-now"
          ref={formRef}
          style={{ background: 'var(--bg)', borderTop: '3px solid var(--blue)', padding: '4rem 1rem', scrollMarginTop: '90px' }}
        >
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.4rem' }}>Apply — {j.title}</h2>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: '2rem', lineHeight: 1.6 }}>
              Complete all five steps. Fields marked <span style={{ color: 'var(--blue)' }}>*</span> are required.
              All information is treated in strict confidence.
            </p>
            <ApplicationForm jobId={j.id} jobTitle={j.title} />
          </div>
        </section>
      ) : (
        <section style={{ background: 'var(--bg)', borderTop: '3px solid var(--blue)', padding: '3rem 1rem', textAlign: 'center' }}>
          <div style={{ maxWidth: 560, margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Ready to Apply?</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, lineHeight: 1.7, marginBottom: '1.75rem' }}>
              Start your application for <strong>{j.title}</strong>. It takes about five minutes across five short steps, and everything you share stays confidential.
            </p>
            <button type="button" onClick={reveal} className="btn btn-blue btn-lg">
              Apply Now
            </button>
          </div>
        </section>
      )}
    </>
  )
}
