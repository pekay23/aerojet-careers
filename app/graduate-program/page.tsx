import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero } from '@/components/ui'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aerojet Graduate Program',
  description:
    'A structured pathway for early-career talent to begin building a career in African aviation with Aerojet Aviation.',
}

const PROGRAM_AREAS = [
  'Engineering',
  'Information Technology',
  'Operations',
  'Human Resources',
  'Customer Support',
  'Sales',
  'Logistics',
  'Quality',
]

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
        <div className="container-max mx-auto" style={{ maxWidth: 920 }}>
          <div className="card card-inner" style={{ marginBottom: '2rem' }}>
            <h2 className="section-heading-xl" style={{ marginTop: 0 }}>Overview</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '1rem' }}>
              The Aerojet Graduate Program is designed for high-potential early-career applicants
              with less than three years of work experience who are seeking a meaningful entry point
              into the aviation industry.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, margin: 0 }}>
              Participants will be considered for developmental pathways across core business and
              technical functions as Aerojet Aviation builds its long-term operational capability in
              Accra and across the region.
            </p>
          </div>

          <div className="grid-auto-sm" style={{ marginBottom: '1.25rem' }}>
            <div className="card card-inner">
              <h3 className="section-heading-xl" style={{ fontSize: '1.1rem', marginTop: 0 }}>Who this is for</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                Recent graduates and early-career applicants with strong academic foundations,
                motivation to build in a fast-growing organisation, and interest in aviation,
                operations, engineering, or corporate support functions.
              </p>
            </div>

            <div className="card card-inner">
              <h3 className="section-heading-xl" style={{ fontSize: '1.1rem', marginTop: 0 }}>Experience level</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                Intended primarily for candidates with less than 3 years of work experience.
                Strong internships, industrial attachments, research projects, and relevant training
                will be considered positively.
              </p>
            </div>
          </div>

          <div className="card card-inner" style={{ marginBottom: '2rem' }}>
            <h2 className="section-heading-xl">Program Areas</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '1.25rem' }}>
              As positions become available, graduate opportunities may be opened in the following
              areas:
            </p>

            <div className="grid-auto-sm">
              {PROGRAM_AREAS.map((area) => (
                <div
                  key={area}
                  className="card"
                  style={{
                    padding: '0.95rem 1rem',
                    background: 'var(--bg-light)',
                    fontWeight: 600,
                    color: 'var(--navy)',
                    textAlign: 'center',
                  }}
                >
                  {area}
                </div>
              ))}
            </div>
          </div>

          <div className="card card-inner" style={{ marginBottom: '2rem' }}>
            <h2 className="section-heading-xl">Current Status</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '1rem' }}>
              This page currently serves as a placeholder for the Graduate Program intake pathway.
              Formal program openings may be published{' '}
              <Link href="/jobs" className="text-link">
                from time to time
              </Link>{' '}
              based on operational needs.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, margin: 0 }}>
              Candidates interested in future graduate opportunities may{' '}
              <Link href="/register" className="text-link">
                register a general profile
              </Link>{' '}
              so Aerojet can retain their details for future consideration.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2rem' }}>
            <Link href="/register" className="btn btn-blue btn-lg">
              Register General Interest
            </Link>

            <Link
              href="/jobs"
              className="btn btn-lg"
              style={{
                background: 'white',
                color: 'var(--aero-blue-700)',
                border: '2px solid var(--aero-blue-700)',
              }}
            >
              View Current Vacancies
            </Link>

          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  )
}
