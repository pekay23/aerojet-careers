import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero, NoticeBanner } from '@/components/ui'
import EngineeringTrackForm from '@/components/forms/EngineeringTrackForm'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apply — Engineering Technicians & Mechanics Track',
  description: 'Apply for the Aerojet Skilled Training Programme — Engineering Track. Trainee Aircraft Mechanics, Engine Technicians, Electrical Technicians, Skins/Repairs/Composites.',
}

export default function EngineeringTrackPage() {
  return (
    <>
      <SiteNav />
      <PageHero
        title="Engineering Technicians & Mechanics"
        subtitle="Hands-on aircraft maintenance training with a pathway to EASA / GCAA Part-66 AME Licence"
        image="/images/2-DEJI4YEv.jpg"
        height={360}
      />

      <section className="section-white">
        <div className="container-max mx-auto" style={{ maxWidth: 800 }}>
          <div style={{ marginBottom: '2rem' }}>
            <NoticeBanner>
              <strong>Programme status:</strong> Accepting applications for the Engineering Track ahead of our Accra facility launch.
              Formal cohorts will be confirmed once our operational timeline is set.
            </NoticeBanner>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
            <Link href="/skilled-training" style={{ color: 'var(--blue)', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
              <ArrowLeft size={15} aria-hidden="true" /> Back to Skilled Training
            </Link>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>|</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>Roles: Trainee Aircraft Mechanics · Engine Technicians · Electrical Technicians · Skins, Repairs & Composites</span>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>Entry Requirements</h2>
            <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--muted)', lineHeight: 1.8 }}>
              <li>Minimum WAEC/WASSCE passes in Mathematics and Physics (Grade C or above)</li>
              <li>OND in Mechanical, Electrical or Aeronautical Engineering preferred</li>
              <li>Less than 3 years formal employment (trainees welcome)</li>
              <li>Strong numerical and mechanical aptitude</li>
              <li>Must be able to work shifts and pass a medical assessment</li>
              <li>Willing to be based full-time in Accra, Ghana</li>
            </ul>
          </div>

          <EngineeringTrackForm />
        </div>
      </section>
      <SiteFooter />
    </>
  )
}