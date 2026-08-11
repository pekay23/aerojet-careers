import Link from 'next/link'
import { Wrench, Plane, ArrowRight } from 'lucide-react'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'
import { PageHero, NoticeBanner } from '@/components/ui'
import type { Metadata } from 'next'


export const metadata: Metadata = {
  title: 'Skilled Training Program',
  description: 'Aerojet Aviation Skilled Training Program for Engineering Technicians, Mechanics and Ramp Operatives.',
}

const ENG_ROLES = [
  { title: 'Trainee Aircraft Mechanics',           sub: 'Cat A pathway · 18-month program · Accra AIA' },
  { title: 'Engine Technicians (Trainee)',          sub: 'Powerplant · CFM56 / LEAP · Accra AIA' },
  { title: 'Electrical Technicians (Trainee)',      sub: 'Avionics / B2 pathway · Accra AIA' },
  { title: 'Skins, Repairs & Composites (Trainee)', sub: 'Structural repair · NDT · Accra AIA' },
]

const RAMP_ROLES = [
  { title: 'Ground Handling Operatives (Trainee)',  sub: 'Full ramp operations training · Accra AIA' },
  { title: 'Aircraft Marshalling Technicians',       sub: 'Wing-walking, towing, pushback · Accra AIA' },
  { title: 'Aircraft Fuelling Technicians',          sub: 'Fuelling / defuelling operations · Accra AIA' },
  { title: 'Cargo & Baggage Handling',               sub: 'ULD, DG, load control · Accra AIA' },
]

export default function SkilledTrainingPage() {
  return (
    <>
        <SiteNav />
      <PageHero title="Skilled Training Program" subtitle="For Engineering Technicians, Mechanics and Ramp Operatives" image="/images/2-DEJI4YEv.jpg" height={360} />

      <section style={{ background: 'white', padding: '3rem 1rem' }}>
        <div className="container-max mx-auto">
          <div style={{ marginBottom: '2rem' }}>
            <NoticeBanner>
              <strong>Program status:</strong> The Aerojet Skilled Training Program is accepting expressions of interest ahead of our Accra facility launch. Formal cohorts will be confirmed once our operational timeline is set.
            </NoticeBanner>
          </div>

          <div style={{ textAlign: 'center', maxWidth: 680, margin: '0 auto 3rem' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Choose Your Training Track</h2>
            <p style={{ color: 'var(--muted)', fontSize: '0.95rem', lineHeight: 1.7, margin: 0 }}>
              Two training pathways — one for aspiring aircraft technicians and mechanics, one for ground handling and ramp operatives.
              Both lead to industry-recognised qualifications and a permanent role at Aerojet.
            </p>
          </div>

          {/* Two tracks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '4rem' }}>

            {[
              { id: 'eng', title: 'Engineering Technicians & Mechanics', sub: 'Hands-on aircraft maintenance training with a pathway to AME Licence', Icon: Wrench, desc: 'Join Aerojet\'s structured apprenticeship programme for aircraft maintenance. You\'ll train alongside qualified LAEs, work on real aircraft, and progress towards an EASA / GCAA Part-66 licence.', roles: ENG_ROLES },
              { id: 'ramp', title: 'Ground Handling & Ramp Operatives', sub: 'Airside operations training with IATA-recognised certifications', Icon: Plane, desc: 'Start your aviation career on the ramp. Our training covers aircraft marshalling, towing, pushback, servicing, dangerous goods, and airside safety — with IATA Dangerous Goods certification included.', roles: RAMP_ROLES },

            ].map(track => (
              <div key={track.id} className="card" style={{ overflow: 'hidden', background: 'var(--bg-light)' }}>
                <div style={{ background: 'var(--navy)', padding: '1.25rem 1.5rem' }}>
                  <track.Icon size={26} aria-hidden="true" style={{ color: 'var(--aero-sky)', marginBottom: 8 }} />

                  <h3 style={{ color: 'white', fontSize: '1.1rem', marginBottom: '0.35rem' }}>{track.title}</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', margin: 0 }}>{track.sub}</p>
                </div>
                <div style={{ padding: '1.375rem' }}>
                  <p style={{ color: 'var(--muted)', fontSize: '0.875rem', lineHeight: 1.65, marginBottom: '1.25rem' }}>{track.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: '1.25rem' }}>
                    {track.roles.map(r => (
                      <div key={r.title} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0.875rem', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 3 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--navy)' }}>{r.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>{r.sub}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Link href="/register" className="btn btn-blue" style={{ width: '100%', textAlign: 'center', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    Apply for This Track <ArrowRight size={15} aria-hidden="true" />
                  </Link>

                </div>
              </div>
            ))}
          </div>

          {/* Entry requirements */}
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1.25rem', textAlign: 'center' }}>Entry Requirements</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>

            {[
              { title: 'Engineering Technicians Track', items: ['Minimum WAEC/WASSCE passes in Mathematics and Physics (Grade C or above)','OND in Mechanical, Electrical or Aeronautical Engineering preferred','Less than 3 years formal employment (trainees welcome)','Strong numerical and mechanical aptitude','Must be able to work shifts and pass a medical assessment','Willing to be based full-time in Accra, Ghana'] },
              { title: 'Ground Handling & Ramp Track', items: ['Minimum WAEC/WASSCE passes including English','Valid driving licence (light vehicle minimum)','No prior aviation experience required — full training provided','Good physical fitness for an active outdoor ramp environment','Must pass airside security clearance and medical assessment','Willing to work shifts including nights, weekends and public holidays'] },
            ].map(box => (
              <div key={box.title} className="card" style={{ padding: '1.5rem', background: 'var(--bg-light)' }}>
                <h4 style={{ marginBottom: '0.875rem', paddingBottom: '0.5rem', borderBottom: '2px solid var(--blue)', fontSize: '0.95rem' }}>{box.title}</h4>
                <ul style={{ paddingLeft: '1.25rem', margin: 0 }}>
                  {box.items.map(item => <li key={item} style={{ fontSize: '0.875rem', color: 'var(--muted)', lineHeight: 1.8 }}>{item}</li>)}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center', marginTop: '3rem' }}>
            <Link href="/register" className="btn btn-blue btn-lg">Register Your Interest</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  )
}
