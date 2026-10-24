import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero, NoticeBanner } from '@/components/ui'
import GraduateProgramForm from '@/components/forms/GraduateProgramForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apply — Aerojet Graduate Program',
  description: 'Apply for the Aerojet Graduate Program — a structured pathway for early-career talent in African aviation.',
}

export default function GraduateProgramPage() {
  return (
    <>
      <SiteNav />
      <PageHero
        title="Aerojet Graduate Program"
        subtitle="A structured pathway into Africa's aviation future — for ambitious graduates ready to learn, grow, and contribute."
        height={360}
      />

      <section className="section-white">
        <div className="container-max mx-auto" style={{ maxWidth: 800 }}>
          <div style={{ marginBottom: '2rem' }}>
            <NoticeBanner>
              <strong>Programme status:</strong> Accepting expressions of interest for future graduate intake cohorts.
              Formal programme openings are published based on operational needs.
            </NoticeBanner>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
            <Link href="/graduate-program" style={{ color: 'var(--blue)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              <ArrowLeft size={15} aria-hidden="true" /> Back to Graduate Program
            </Link>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Who this is for</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, margin: 0 }}>
              Recent graduates and early-career applicants with strong academic foundations,
              motivation to build in a fast-growing organisation, and interest in aviation,
              operations, engineering, or corporate support functions.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginTop: '1rem' }}>
              Intended primarily for candidates with less than 3 years of work experience.
              Strong internships, industrial attachments, research projects, and relevant training
              will be considered positively.
            </p>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Programme Areas</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '1.25rem' }}>
              Select your preferred areas when applying:
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 8 }}>
              {['Engineering','Information Technology','Operations','Human Resources','Customer Support','Sales','Logistics','Quality'].map(area => (
                <div key={area} style={{ padding: '0.75rem 1rem', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: 6, fontWeight: 600, color: 'var(--navy)' }}>
                  {area}
                </div>
              ))}
            </div>
          </div>

          <GraduateProgramForm />
        </div>
      </section>
      <SiteFooter />
    </>
  )
}