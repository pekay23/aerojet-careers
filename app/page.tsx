import Link from 'next/link'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero } from '@/components/ui'
import { CTAButtons } from '@/components/ui/CTAButtons'
import { JOBS_CACHE_TAG, METADATA_CACHE_TAG, STATS_CACHE_TAG } from '@/lib/recruitment-data'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers at Aerojet Aviation',
  description: "Join the team building West Africa's premier MRO facility at Accra International Airport, Accra.",
}

const TRACKS = [
  {
    id: 'experienced',
    title: 'Experienced Professionals',
    subtitle: 'For applicants with 3 or more years of industry experience',
    options: [
      {
        label: 'Apply Now – Licensed Aircraft Engineers',
        desc: 'Immediate live application for licensed aircraft engineers.',
        href: '/apply/licensed-aircraft-engineers',
      },
      {
        label: 'Current Job Vacancies',
        desc: 'Browse open positions across Engineering, IT, Operations, HR, Customer Support, Sales, Logistics and Quality',
        href: '/jobs',
      },
      {
        label: 'General Application',
        desc: 'Register your profile for future opportunities when no current role matches your background',
        href: '/register',
      },
    ],
  },
  {
    id: 'early',
    title: 'Early Career & Trainee Positions',
    subtitle: 'For applicants with less than 3 years of work experience',
    options: [
      {
        label: 'Graduate Program',
        desc: 'Structured 24-month graduate placements across Engineering, IT, Operations, HR, Sales, Logistics and Quality',
        href: '/graduate-program',
      },
      {
        label: 'Skilled Training Program',
        desc: 'For Engineering Technicians, Mechanics and Ramp Operatives. Aircraft mechanics, engine technicians, electrical, composites, ground handling and marshalling',
        href: '/skilled-training',
      },
    ],
  },
]

const STATS_FALLBACK = [
  { value: 'AIA', label: 'Accra Intl Airport, Accra' },
  { value: '1st', label: 'Planned MRO Hub in West Africa' },
]

async function fetchStats() {
  try {
    // NEXT_PUBLIC_* values are inlined at build time, so an unset variable
    // would otherwise produce the literal string "undefined/api/stats" and
    // the page would silently fall back to the hardcoded counters.
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://careers.aerojet-aviation.com'
    const res = await fetch(`${baseUrl}/api/stats`, {
      next: { revalidate: 300, tags: [JOBS_CACHE_TAG, METADATA_CACHE_TAG, STATS_CACHE_TAG] },
    })
    if (!res.ok) return null
    const { data } = await res.json()
    return data
  } catch {
    return null
  }
}

export default async function HomePage() {
  const stats = await fetchStats()

  const displayStats = [
    { value: stats ? `${stats.activeJobs}+` : '12+', label: 'Active Vacancies' },
    ...STATS_FALLBACK,
    { value: stats ? `${stats.departments}` : '7', label: 'Departments Hiring' },
  ]

  return (
    <>
      <SiteNav />

      <PageHero
        title="Careers at Aerojet Aviation"
        subtitle="Build the future of African aviation. Join the team shaping West Africa's premier MRO hub."
        height={420}
      />

      <section className="section-white-sm">
        <div className="container-max mx-auto">
          <div className="card" style={{ background: 'var(--surface-accent-soft)', borderLeft: '4px solid var(--aero-sky)', borderRadius: '3px', padding: '0.875rem 1.25rem', fontSize: '13px', color: 'var(--aero-blue)', lineHeight: 1.6 }}>
            <strong>Note:</strong> Aerojet Aviation is actively building its team ahead of the operational launch of our Accra MRO facility. We welcome applications from qualified professionals and early-career talent who share our vision.
          </div>
        </div>
      </section>

      <section className="section-white">
        <div className="container-max mx-auto section-center">
          <h2 className="section-heading-xl">Find Your Place at Aerojet</h2>
          <p className="section-subtitle">
            Whether you are an experienced aviation professional or just starting your career, Aerojet Aviation
            offers pathways to grow with a company building something extraordinary — a world-class MRO facility
            at the heart of Africa&apos;s aviation future.
          </p>
        </div>
      </section>

      <section className="section-white-sm">
        <div className="container-max mx-auto">
          <div className="grid-auto">
            {TRACKS.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </div>
      </section>

      <section className="section-brand">
        <div className="container-max mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {displayStats.map((s) => (
            <div key={s.value} className="flex flex-col items-center">
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="section-white">
        <div className="container-max mx-auto">
          <h2 className="section-heading-xl text-center" style={{ marginBottom: '0.75rem' }}>
            Why Join Aerojet Aviation?
          </h2>
          <p className="section-subtitle" style={{ marginBottom: '3rem' }}>
            We are not just an employer — we are building Africa&apos;s aviation maintenance industry from the ground up.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[
              {
                title: 'Pioneer Opportunity',
                body: "Join a founding team at West Africa's first world-class MRO facility, with unmatched career growth potential.",
              },
              {
                title: 'Training & Development',
                body: 'Access structured learning, international partnerships, and industry certifications to advance your expertise.',
              },
              {
                title: 'Continental Impact',
                body: "Your work will directly reduce Africa's reliance on overseas MRO — a mission with lasting regional significance.",
              },
            ].map((v, i) => (
              <div key={v.title} className={`card card-inner ${i === 2 ? 'md:col-span-2 md:justify-self-center lg:col-span-1 lg:justify-self-stretch' : ''}`} style={{ border: '1px solid var(--aero-blue-100)' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 700, color: 'var(--aero-blue)', textAlign: 'center' }}>{v.title}</h4>
                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <h2 className="cta-title">
          Ready to Take Off With Us?
        </h2>
        <p className="cta-subtitle">
          Explore opportunities or get in touch to learn more about life at Aerojet Aviation
        </p>
        <CTAButtons />
      </section>

      <SiteFooter />
    </>
  )
}

function TrackCard({ track }: { track: (typeof TRACKS)[number] }) {
  return (
    <div className="card" style={{ overflow: 'hidden', background: 'white' }}>
      <div style={{ background: 'var(--aero-blue)', padding: '1.25rem 1.5rem' }}>
        <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.35rem' }}>{track.title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', margin: 0 }}>
          {track.subtitle}
        </p>
      </div>
      <div style={{ background: 'white' }}>
        {track.options.map((opt, i) => (
          <Link
            key={opt.href}
            href={opt.href}
            className="track-option"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '1rem',
              padding: '1rem 1.25rem',
              textDecoration: 'none',
              borderBottom: i < track.options.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, color: 'var(--aero-blue)', fontSize: '0.95rem', marginBottom: '0.3rem' }}>
                {opt.label}
              </div>
              <div style={{ color: 'var(--muted-foreground)', fontSize: '0.82rem', lineHeight: 1.55 }}>
                {opt.desc}
              </div>
            </div>
            <span style={{ color: 'var(--aero-sky)', fontSize: '1.25rem', fontWeight: 700, flexShrink: 0 }}>
              ›
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
