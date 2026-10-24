import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero, NoticeBanner } from '@/components/ui'
import RampTrackForm from '@/components/forms/RampTrackForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apply — Ground Handling & Ramp Operatives Track',
  description: 'Apply for the Aerojet Skilled Training Programme — Ground Handling & Ramp Track. Ground Handling Operatives, Aircraft Marshalling, Aircraft Fuelling, Cargo & Baggage Handling.',
}

export default function RampTrackPage() {
  return (
    <>
      <SiteNav />
      <PageHero
        title="Ground Handling & Ramp Operatives"
        subtitle="Airside operations training with IATA-recognised certifications"
        image="/images/2-DEJI4YEv.jpg"
        height={360}
      />

      <section className="section-white">
        <div className="container-max mx-auto" style={{ maxWidth: 800 }}>
          <div style={{ marginBottom: '2rem' }}>
            <NoticeBanner>
              <strong>Programme status:</strong> Accepting applications for the Ground Handling & Ramp Track ahead of our Accra facility launch.
              Formal cohorts will be confirmed once our operational timeline is set.
            </NoticeBanner>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
            <Link href="/skilled-training" style={{ color: 'var(--blue)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              <ArrowLeft size={15} aria-hidden="true" /> Back to Skilled Training
            </Link>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>|</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Roles: Ground Handling Operatives · Aircraft Marshalling · Aircraft Fuelling · Cargo & Baggage Handling</span>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Entry Requirements</h2>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--muted)', lineHeight: 1.8 }}>
              <li>Minimum WAEC/WASSCE passes including English</li>
              <li>Valid driving licence (light vehicle minimum)</li>
              <li>No prior aviation experience required — full training provided</li>
              <li>Good physical fitness for an active outdoor ramp environment</li>
              <li>Must pass airside security clearance and medical assessment</li>
              <li>Willing to work shifts including nights, weekends and public holidays</li>
            </ul>
          </div>

          <RampTrackForm />
        </div>
      </section>
      <SiteFooter />
    </>
  )
}