import { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Our Story | Aerojet Aviation Careers',
  description: 'Learn about Aerojet Aviation Group — our mission to develop West Africa\'s premier MRO facility in Accra, Ghana, our milestones, and our vision for the future of aviation maintenance.',
}

export default function OurStoryPage() {
  return (
    <>
      <SiteNav />

      <div className="page-pad" style={{ background: 'var(--bg)', paddingTop: '70px' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto', padding: '3rem 1.5rem' }}>

          {/* Hero */}
          <div style={{ marginBottom: '3rem' }}>
            <h1 className="section-heading" style={{ marginTop: 0 }}>Our Story</h1>
            <p style={{ fontSize: '1.125rem', color: 'var(--muted-foreground)', lineHeight: 1.7, maxWidth: '720px' }}>
              Aerojet Aviation is leading the development of West Africa&rsquo;s premier Maintenance, Repair and Overhaul (MRO) facility in Accra, Ghana. With institutional support from major partners, we are delivering world-class maintenance capabilities to support both local and international operators.
            </p>
          </div>

          {/* Mission */}
          <div className="card" style={{ padding: '2rem', marginBottom: '2.5rem' }}>
            <h2 className="article-section-heading" style={{ marginTop: 0 }}>Mission</h2>
            <p style={{ color: '#334155', lineHeight: 1.8 }}>
              Developing West Africa&rsquo;s premier Maintenance, Repair and Overhaul (MRO) facility in Accra, Ghana. We aim to be the most trusted partner for comprehensive aircraft maintenance, repair, and overhaul services — raising the bar for safety, quality, and reliability across the region.
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <span className="article-metric">Accra International Airport, Accra, Ghana</span>
              <span className="article-metric">Aerojet Aviation Group</span>
            </div>
          </div>

          {/* Timeline */}
          <h2 className="section-heading">Milestones</h2>

          <div className="article-timeline-group">
            <div className="article-timeline">
              <strong>Founding &amp; Vision</strong>
              Aerojet Aviation Group was founded with a clear vision: to establish West Africa&rsquo;s first world-class MRO facility. From the outset, the leadership team identified the critical gap in regional aircraft maintenance capacity and set out to build a facility that meets international standards.
            </div>

            <div className="article-timeline">
              <strong>MRO Facility Planning &amp; Approvals</strong>
              Extensive planning and feasibility studies were conducted to design a facility capable of supporting narrow-body and wide-body aircraft. Regulatory approvals and compliance frameworks were established in line with EASA Part 145 and Ghana Civil Aviation Authority requirements.
            </div>

            <div className="article-timeline">
              <strong>Accra International Airport Location Secured</strong>
              A strategic location at Accra International Airport was secured for the MRO facility, providing direct airside access, existing infrastructure connectivity, and proximity to major airlines operating across West Africa.
            </div>

            <div className="article-timeline">
              <strong>Partnerships &amp; Institutional Support</strong>
              Major institutional partners were brought on board to provide technical expertise, financial backing, and operational guidance. These partnerships ensure the facility will deliver world-class maintenance capabilities from day one of operations.
            </div>

            <div className="article-timeline">
              <strong>Talent Acquisition &amp; Training Academy</strong>
              A dedicated training academy was launched to develop local engineering talent. Graduate programs, skilled training pathways, and experienced professional roles were established to build a sustainable pipeline of certified aircraft maintenance engineers.
            </div>

            <div className="article-timeline">
              <strong>Operational Launch — Planned</strong>
              The facility is on track for operational launch, with phased commissioning of hangar bays, tooling, and certified staff. Once operational, the MRO will serve both local operators and international carriers requiring maintenance support in West Africa.
            </div>
          </div>

          {/* CTA */}
          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <Link href="/jobs" className="btn btn-blue btn-lg">
              View Current Vacancies
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />

      {/* JSON-LD structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'Aerojet Aviation Group',
            url: process.env.NEXT_PUBLIC_APP_URL || 'https://careers.aerojet-aviation.com',
            description: "Developing West Africa's premier Maintenance, Repair and Overhaul (MRO) facility in Accra, Ghana.",
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'GH',
              addressLocality: 'Accra',
              streetAddress: 'Accra International Airport',
            },
            sameAs: [
              'https://www.linkedin.com/company/aerojet-aviation',
            ],
          }),
        }}
      />
    </>
  )
}
