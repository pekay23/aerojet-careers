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
      <SiteNav activePath="/graduate-program" />

      <PageHero
        title="Aerojet Graduate Program"
        subtitle="A structured pathway into Africa's aviation future — for ambitious graduates ready to learn, grow, and contribute."
        height={360}
      />

      <section style={{ background: 'white', padding: '3rem 1rem' }}>
        <div className="max-w-content mx-auto" style={{ maxWidth: 920 }}>
          <div
            className="card"
            style={{
              padding: '2rem',
              marginBottom: '2rem',
            }}
          >
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Overview</h2>
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

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '1.5rem',
              marginBottom: '2rem',
            }}
          >
            <div className="card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Who this is for</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                Recent graduates and early-career applicants with strong academic foundations,
                motivation to build in a fast-growing organisation, and interest in aviation,
                operations, engineering, or corporate support functions.
              </p>
            </div>

            <div className="card" style={{ padding: '1.75rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '0.75rem' }}>Experience level</h3>
              <p style={{ color: 'var(--muted)', lineHeight: 1.7, margin: 0 }}>
                Intended primarily for candidates with less than 3 years of work experience.
                Strong internships, industrial attachments, research projects, and relevant training
                will be considered positively.
              </p>
            </div>
          </div>

          <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Program Areas</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '1.25rem' }}>
              As positions become available, graduate opportunities may be opened in the following
              areas:
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '0.9rem',
              }}
            >
              {PROGRAM_AREAS.map((area) => (
                <div
                  key={area}
                  style={{
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '0.95rem 1rem',
                    background: '#fff',
                    fontWeight: 600,
                    color: 'var(--navy)',
                  }}
                >
                  {area}
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Current Status</h2>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, marginBottom: '1rem' }}>
              This page currently serves as a placeholder for the Graduate Program intake pathway.
              Formal program openings may be published from time to time based on operational needs.
            </p>
            <p style={{ color: 'var(--muted)', lineHeight: 1.75, margin: 0 }}>
              Candidates interested in future graduate opportunities may register a general profile
              so Aerojet can retain their details for future consideration.
            </p>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '1rem',
              flexWrap: 'wrap',
              justifyContent: 'center',
              marginTop: '2rem',
            }}
          >
            <Link
              href="/register"
              style={{
                background: 'var(--blue)',
                color: 'white',
                textDecoration: 'none',
                padding: '0.9rem 1.6rem',
                borderRadius: 6,
                fontWeight: 700,
              }}
            >
              Register General Interest
            </Link>

            <Link
              href="/jobs"
              style={{
                background: 'white',
                color: 'var(--navy)',
                textDecoration: 'none',
                padding: '0.9rem 1.6rem',
                borderRadius: 6,
                fontWeight: 700,
                border: '1px solid var(--border)',
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
