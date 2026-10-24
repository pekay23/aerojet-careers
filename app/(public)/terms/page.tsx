import { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Terms of Use | Aerojet Aviation Careers',
  description: 'Terms and conditions for using the Aerojet Aviation Careers portal, including application terms, user conduct, and intellectual property.',
}

export default function TermsPage() {
  return (
    <>
        <SiteNav />
      
      <div style={{ background: 'var(--bg)', paddingTop: '70px' }}>
        <div className="legal-page" style={{ maxWidth: '880px', margin: '0 auto', padding: '3rem 1.5rem' }}>
          <article style={{ borderRadius: '1.5rem', border: '1px solid var(--border)', background: 'white', padding: '2rem', boxShadow: 'var(--shadow-xl)', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ display: 'inline-block', marginBottom: '1rem', borderRadius: '9999px', background: 'rgba(0, 174, 239, 0.1)', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--aero-sky)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Legal Policy
              </span>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', lineHeight: 1.2 }}>
                Terms of Use
              </h1>
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic' }}>Last updated: October 2026</p>
            </div>

            <div style={{ color: '#334155', lineHeight: 1.7 }}>
              <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>
                Welcome to <strong>Aerojet Aviation Careers</strong> ("the Portal"). These Terms of Use ("Terms") govern
                your access to and use of <Link href="/" style={{ fontWeight: 600, color: 'var(--aero-sky)' }}>
                  careers.aerojet-aviation.com
                </Link> and any related services. By accessing or using the Portal, you agree to be bound by these
                Terms. If you do not agree, please do not use the Portal.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>1. Eligibility</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                You must be at least 16 years old to use the Portal. By using the Portal, you represent and warrant
                that you meet this age requirement and have the legal capacity to enter into these Terms.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>2. Account Registration</h3>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                <li>You must provide accurate, current, and complete information during registration.</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                <li>You must notify us immediately of any unauthorised use of your account.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms.</li>
              </ul>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>3. Applications & Submissions</h3>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                <li>All application materials (CV, documents, qualifications) must be authentic and accurate.</li>
                <li>Fraudulent or forged documents result in immediate disqualification and permanent ban.</li>
                <li>There are no application fees. Aerojet Aviation does not charge any fees for applying to any programme or role.</li>
                <li>We reserve the right to verify all submitted information with issuing authorities.</li>
              </ul>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>4. User Conduct</h3>
              <p style={{ marginBottom: '1rem' }}>You agree not to:</p>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                <li>Use the Portal for any unlawful purpose or in violation of any applicable law.</li>
                <li>Attempt to gain unauthorised access to any systems, accounts, or data.</li>
                <li>Interfere with or disrupt the Portal's operation, servers, or networks.</li>
                <li>Upload viruses, malware, or other harmful code.</li>
                <li>Scrape, harvest, or extract data from the Portal without written permission.</li>
                <li>Impersonate any person or entity or misrepresent your affiliation.</li>
              </ul>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>5. Intellectual Property</h3>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                <li>The Portal and its original content (text, graphics, logos, software) are owned by Aerojet Aviation and protected by Ghana and international copyright, trademark, and other intellectual property laws.</li>
                <li>You may not reproduce, distribute, modify, create derivative works, publicly display, or exploit any Portal content without our prior written consent.</li>
                <li>Your application materials remain your property, but you grant us a non-exclusive, royalty-free licence to use, store, and process them for admissions purposes.</li>
              </ul>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>6. Links to Third-Party Sites</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                The Portal may contain links to third-party websites (e.g., aerojet-aviation.com). These links are
                provided for convenience only. We do not control, endorse, or assume responsibility for the content,
                privacy policies, or practices of any third-party sites.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>7. Disclaimers</h3>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                <li>The Portal is provided "as is" and "as available" without warranties of any kind.</li>
                <li>We do not warrant that the Portal will be uninterrupted, error-free, or secure.</li>
                <li>We are not liable for any indirect, incidental, special, consequential, or punitive damages.</li>
                <li>Our total liability shall not exceed the amount you paid in fees (if any) in the 12 months preceding the claim.</li>
              </ul>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>8. Indemnification</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                You agree to indemnify and hold harmless Aerojet Aviation, its officers, directors, employees, and agents
                from any claims, damages, losses, liabilities, and expenses (including legal fees) arising out of your
                use of the Portal, violation of these Terms, or infringement of any third-party rights.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>9. Termination</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We may suspend or terminate your access to the Portal immediately, without prior notice, for any breach
                of these Terms. Upon termination, your right to use the Portal ceases immediately. Sections 4, 5, 7, 8,
                9, 10, and 11 survive termination.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>10. Governing Law & Jurisdiction</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                These Terms are governed by the laws of the Republic of Ghana. Any disputes shall be resolved in the
                courts of Ghana, with exclusive jurisdiction in Accra.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>11. Changes to Terms</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We may update these Terms at any time. Material changes will be communicated via the Portal or email.
                Continued use after changes constitutes acceptance. The "Last updated" date above will be revised.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>12. Contact Us</h3>
              <p style={{ marginBottom: '0.75rem' }}>
                For questions about these Terms, contact:
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <a href="mailto:careers@aerojet-aviation.com" style={{ fontWeight: 600, color: 'var(--aero-sky)' }}>
                  careers@aerojet-aviation.com
                </a>
              </p>
            </div>
          </article>
        </div>
      </div>

      <SiteFooter />
    </>
  )
}