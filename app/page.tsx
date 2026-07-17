import Link from 'next/link'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero, NoticeBanner } from '@/components/ui'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Careers at Aerojet Aviation',
  description: "Join the team building West Africa's premier MRO facility at Kotoka International Airport, Accra.",
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

const STATS = [
  { value: '12+', label: 'Active Vacancies' },
  { value: 'KIA', label: 'Kotoka Intl Airport, Accra' },
  { value: '7', label: 'Departments Hiring' },
  { value: '1st', label: 'Planned MRO Hub in West Africa' },
]

export default function HomePage() {
  return (
    <>
      <SiteNav activePath="/" />

      <PageHero
        title="Careers at Aerojet Aviation"
        subtitle="Build the future of African aviation. Join the team shaping West Africa's premier MRO hub."
        height={420}
      />

      <section style={{ background: 'white', padding: '2rem 1rem' }}>
        <div className="max-w-content mx-auto">
          <NoticeBanner>
            <strong>Note:</strong> Aerojet Aviation is actively building its team ahead of the operational launch of our Accra MRO facility. We welcome applications from qualified professionals and early-career talent who share our vision.
          </NoticeBanner>
        </div>
      </section>

      <section style={{ background: 'white', padding: '3rem 1rem 2rem' }}>
        <div
          className="max-w-content mx-auto"
          style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}
        >
          <h2 style={{ fontSize: '1.875rem', marginBottom: '1rem' }}>Find Your Place at Aerojet</h2>
          <p style={{ color: 'var(--muted)', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
            Whether you are an experienced aviation professional or just starting your career, Aerojet Aviation
            offers pathways to grow with a company building something extraordinary — a world-class MRO facility
            at the heart of Africa&apos;s aviation future.
          </p>
        </div>
      </section>

      <section style={{ background: 'var(--bg)', padding: '2rem 1rem 4rem' }}>
        <div className="max-w-content mx-auto">
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {TRACKS.map((track) => (
              <TrackCard key={track.id} track={track} />
            ))}
          </div>
        </div>
      </section>

      <div style={{ background: 'var(--navy)', padding: '3rem 1rem' }}>
        <div
          className="max-w-content mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {STATS.map((s) => (
            <div key={s.value}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section style={{ background: 'white', padding: '4rem 1rem' }}>
        <div className="max-w-content mx-auto">
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', marginBottom: '0.75rem' }}>
            Why Join Aerojet Aviation?
          </h2>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--muted)',
              maxWidth: 600,
              margin: '0 auto 3rem',
              fontSize: '0.95rem',
              lineHeight: 1.7,
            }}
          >
            We are not just an employer — we are building Africa&apos;s aviation maintenance industry from the ground up.
          </p>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '1.5rem',
            }}
          >
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
            ].map((v) => (
              <div key={v.title} className="card" style={{ padding: '2rem 1.5rem', textAlign: 'center' }}>
                <h4 style={{ marginBottom: '0.75rem', fontSize: '1rem' }}>{v.title}</h4>
                <p style={{ color: 'var(--muted)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ background: 'var(--blue)', padding: '4rem 1rem', textAlign: 'center' }}>
        <h2 style={{ color: 'white', fontSize: '1.875rem', marginBottom: '0.75rem' }}>
          Ready to Take Off With Us?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.88)', fontSize: '1.05rem', marginBottom: '2rem' }}>
          Explore opportunities or get in touch to learn more about life at Aerojet Aviation
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/jobs"
            style={{
              background: 'white',
              color: 'var(--blue)',
              padding: '0.8rem 2rem',
              borderRadius: 4,
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            View All Vacancies
          </Link>
          <a
            href="https://aerojet-aviation.com/contact.html"
            style={{
              background: 'transparent',
              color: 'white',
              border: '2px solid white',
              padding: '0.8rem 2rem',
              borderRadius: 4,
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.95rem',
            }}
          >
            Contact Us
          </a>
        </div>
      </div>

      <SiteFooter />
    </>
  )
}

function TrackCard({ track }: { track: (typeof TRACKS)[number] }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ background: 'var(--navy)', padding: '1.5rem 1.75rem' }}>
        <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '0.35rem' }}>{track.title}</h3>
        <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem', margin: 0 }}>
          {track.subtitle}
        </p>
      </div>
      <div>
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
              padding: '1.25rem 1.75rem',
              textDecoration: 'none',
              borderBottom: i < track.options.length - 1 ? '1px solid var(--border)' : 'none',
              background: 'white',
              transition: 'background 0.15s',
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: 'var(--navy)',
                  fontSize: '0.95rem',
                  marginBottom: '0.3rem',
                }}
              >
                {opt.label}
              </div>
              <div style={{ color: 'var(--muted)', fontSize: '0.82rem', lineHeight: 1.55 }}>
                {opt.desc}
              </div>
            </div>
            <span
              style={{
                color: 'var(--blue)',
                fontSize: '1.25rem',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              ›
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
