'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero } from '@/components/ui'
import { CTAButtons } from '@/components/ui/CTAButtons'
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

const STATS_FALLBACK = [
  { value: 'KIA', label: 'Kotoka Intl Airport, Accra' },
  { value: '1st', label: 'Planned MRO Hub in West Africa' },
]

export default function HomePage() {
  const [stats, setStats] = useState<{ activeJobs: number; departments: number } | null>(null)

  useEffect(() => {
    fetch('/api/stats')
      .then(r => r.json())
      .then(({ data }) => setStats(data))
      .catch(() => setStats(null))
  }, [])

  const displayStats = [
    { value: stats ? `${stats.activeJobs}+` : '12+', label: 'Active Vacancies' },
    ...STATS_FALLBACK,
    { value: stats ? `${stats.departments}` : '7', label: 'Departments Hiring' },
  ]

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
          <div style={{ background: 'var(--surface-accent-soft)', borderLeft: '4px solid var(--aero-sky)', borderRadius: '3px', padding: '0.875rem 1.25rem', fontSize: '13px', color: 'var(--aero-blue)', lineHeight: 1.6 }}>

            <strong>Note:</strong> Aerojet Aviation is actively building its team ahead of the operational launch of our Accra MRO facility. We welcome applications from qualified professionals and early-career talent who share our vision.
          </div>
        </div>
      </section>

      <section style={{ background: 'white', padding: '3rem 1rem 2rem' }}>
        <div
          className="max-w-content mx-auto"
          style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto' }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.875rem', fontWeight: 800, color: 'var(--aero-blue)', marginBottom: '1rem' }}>Find Your Place at Aerojet</h2>
          <p style={{ color: 'var(--muted-foreground)', fontSize: '1rem', lineHeight: 1.7, margin: 0 }}>
            Whether you are an experienced aviation professional or just starting your career, Aerojet Aviation
            offers pathways to grow with a company building something extraordinary — a world-class MRO facility
            at the heart of Africa&apos;s aviation future.
          </p>
        </div>
      </section>

      <section style={{ background: 'white', padding: '2rem 1rem 4rem' }}>
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

      <div style={{ background: 'var(--aero-blue)', padding: '3rem 1rem' }}>
        <div
          className="max-w-content mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {displayStats.map((s) => (
            <div key={s.value}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'white', marginBottom: 4 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <section style={{ background: 'white', padding: '4rem 1rem' }}>
        <div className="max-w-content mx-auto">
          <h2 style={{ fontFamily: 'var(--font-display)', textAlign: 'center', fontSize: '1.75rem', fontWeight: 800, color: 'var(--aero-blue)', marginBottom: '0.75rem' }}>
            Why Join Aerojet Aviation?
          </h2>
          <p
            style={{
              textAlign: 'center',
              color: 'var(--muted-foreground)',
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
              <div key={v.title} className="card" style={{ padding: '2rem 1.5rem', textAlign: 'center', background: 'var(--surface-subtle)', border: '1px solid var(--aero-blue-100)' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', marginBottom: '0.75rem', fontSize: '1rem', fontWeight: 700, color: 'var(--aero-blue)' }}>{v.title}</h4>

                <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9rem', lineHeight: 1.65, margin: 0 }}>
                  {v.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div style={{ background: 'var(--gradient-brand)', padding: '4rem 1rem', textAlign: 'center' }}>
        <h2 style={{ color: 'white', fontSize: '1.875rem', fontWeight: 800, marginBottom: '0.75rem', fontFamily: 'var(--font-display)' }}>
          Ready to Take Off With Us?
        </h2>
        <p style={{ color: 'rgba(255,255,255,0.92)', fontSize: '1.05rem', marginBottom: '2rem' }}>

          Explore opportunities or get in touch to learn more about life at Aerojet Aviation
        </p>
        <CTAButtons />
      </div>

      <SiteFooter />
    </>
  )
}

function TrackCard({ track }: { track: (typeof TRACKS)[number] }) {
  return (
    <div className="card" style={{ overflow: 'hidden', background: 'white' }}>
      <div style={{ background: 'var(--aero-blue)', padding: '1.5rem 1.75rem' }}>
        <h3 style={{ color: 'white', fontSize: '1.2rem', marginBottom: '0.35rem' }}>{track.title}</h3>
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
              padding: '1.25rem 1.75rem',
              textDecoration: 'none',
              borderBottom: i < track.options.length - 1 ? '1px solid var(--border)' : 'none',
              transition: 'background 0.15s',
            }}
          >
            <div>
              <div
                style={{
                  fontWeight: 600,
                  color: 'var(--aero-blue)',
                  fontSize: '0.95rem',
                  marginBottom: '0.3rem',
                }}
              >
                {opt.label}
              </div>
              <div style={{ color: 'var(--muted-foreground)', fontSize: '0.82rem', lineHeight: 1.55 }}>
                {opt.desc}
              </div>
            </div>
            <span
              style={{
                color: 'var(--aero-sky)',
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