import { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'Privacy & Data Protection Notice | Aerojet Aviation Careers',
  description: 'How Aerojet Aviation collects, uses, protects, retains, and discloses personal data for career applications under Ghana Data Protection Act, 2012 (Act 843).',
}

const dataCategories = [
  'Identity and contact details, including name, nationality, date of birth, email address, phone number, and address where required.',
  'Professional qualifications and employment history, including licences, certifications, CV, references, and background check results.',
  'Application and assessment data, including selected programme, application status, documents, interview notes, aptitude test results, and medical fitness records.',
  'Account, security, and usage data, including login events, audit logs, IP address, device/browser information, preferences, and support messages.',
  'Payment and finance records needed to process application fees, tuition deposits, refunds, invoices, and reconciliation.',
]

const purposes = [
  'process applications, verify eligibility, manage enrolment, deliver training, schedule examinations, and issue academic records',
  'verify payments, maintain financial records, prevent fraud, and comply with accounting, aviation training, and legal obligations',
  'operate secure portals for applicants, students, instructors, examiners, and staff',
  'send service messages, security notices, academic updates, and lawful marketing where you have not objected or opted out',
  'monitor platform reliability, investigate abuse, maintain audit logs, and improve academy services',
]

const rights = [
  'request confirmation of whether we hold your personal data and receive an understandable description of that data',
  'ask us to correct, complete, block, erase, or destroy personal data that is inaccurate, excessive, out of date, unlawfully obtained, or no longer authorised for retention',
  'object to direct marketing or other processing where the law gives you that right',
  'ask for information about recipients or categories of recipients who have received your data',
  "raise a complaint with Aerojet or with Ghana's Data Protection Commission",
]

export default function PrivacyPolicyPage() {
  return (
    <>
        <SiteNav />
      
      <div style={{ background: 'var(--bg)', paddingTop: '70px' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto', padding: '3rem 1.5rem' }}>
          <article style={{ borderRadius: '1.5rem', border: '1px solid var(--border)', background: 'white', padding: '2rem', boxShadow: 'var(--shadow-xl)', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ display: 'inline-block', marginBottom: '1rem', borderRadius: '9999px', background: 'rgba(0, 174, 239, 0.1)', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--aero-sky)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Legal Policy
              </span>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', lineHeight: 1.2 }}>
                Privacy & Data Protection Notice
              </h1>
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic' }}>Last updated: July 2026</p>
            </div>

            <div style={{ color: '#334155', lineHeight: 1.7 }}>
              <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>
                This notice explains how <strong>Aerojet Aviation</strong> collects,
                uses, protects, stores, and discloses personal data when you use{' '}
                <Link href="/" style={{ fontWeight: 600, color: 'var(--aero-sky)' }}>
                  careers.aerojet-aviation.com
                </Link>, apply for a programme, or access an Aerojet portal.
              </p>
              <p style={{ marginBottom: '1.5rem' }}>
                Aerojet acts as a data controller for careers operations and follows the Ghana Data
                Protection Act, 2012 (Act 843). Our information security programme is managed against
                ISO/IEC 27001:2022 principles for confidentiality, integrity, availability, risk
                treatment, access control, logging, incident response, supplier management, and
                continual improvement.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Personal Data We Collect</h3>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                {dataCategories.map((item) => (
                  <li key={item} style={{ marginBottom: '0.5rem' }}>{item}</li>
                ))}
              </ul>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Why We Process Personal Data</h3>
              <p style={{ marginBottom: '1rem' }}>We collect and process personal data only for specific careers purposes, including to:</p>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                {purposes.map((item) => (
                  <li key={item} style={{ marginBottom: '0.5rem' }}>{item}</li>
                ))}
              </ul>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Legal Basis and Minimality</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We process personal data where it is necessary for an application, contract, legal or
                regulatory obligation, legitimate careers operation, consent-based activity, or another
                lawful justification under Act 843. We limit collection to data that is relevant and
                necessary for the stated purpose.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Sharing and Processors</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We may share personal data with authorised staff, instructors, examiners, payment
                providers, hosting providers, email and file-storage processors, regulators, aviation
                bodies, auditors, and professional advisers where needed for the purposes above. Third
                parties processing data for Aerojet must handle it securely and only under authorised
                instructions.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>International Transfers</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Some service providers may store or process data outside Ghana. Where this happens, we
                use reasonable contractual, technical, and organisational safeguards to protect the data
                and to keep processing consistent with Act 843.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Retention</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We keep personal data only for as long as necessary for the stated purpose, careers
                operations, aviation training records, finance records, dispute handling, audit logs,
                and legal obligations. Staff can manage retention schedules in the portal, and expired
                records are deleted, anonymised, or restricted where retention is no longer authorised.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Security Measures</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We use role-based access controls, authentication controls, audit logs, secure upload
                handling, retention workflows, security headers, least-privilege administration, and
                operational monitoring to reduce unauthorised access, alteration, disclosure, loss, or
                destruction of personal data.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Security Incidents</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                If we have reasonable grounds to believe personal data has been accessed or acquired by
                an unauthorised person, we will investigate, restore system integrity, and notify the
                Data Protection Commission and affected data subjects as soon as reasonably practicable
                where required by Act 843.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Your Rights</h3>
              <p style={{ marginBottom: '1rem' }}>You may:</p>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                {rights.map((item) => (
                  <li key={item} style={{ marginBottom: '0.5rem' }}>{item}</li>
                ))}
              </ul>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Cookies and Analytics</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We use essential cookies for login, security, and portal functionality. We may also use
                privacy-respecting analytics to understand page performance and improve the website.
                You can control non-essential cookies through your browser settings where available.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Applicants Under 16</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Our public website is not directed at children under 16. If an applicant under 16 must
                provide personal data for a lawful careers process, we require involvement from a parent
                or guardian and limit processing to the relevant purpose.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Links to Other Websites</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Our website may link to third-party websites. Their privacy practices are governed by
                their own notices, not this one.
              </p>

              <div style={{ marginTop: '2.5rem', borderRadius: '1rem', border: '1px solid var(--border)', background: 'var(--bg)', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>Contact Us</h3>
                <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '0.75rem' }}>
                  For privacy requests, correction requests, objections, breach questions, or
                  complaints, contact Aerojet&apos;s data protection contact.
                </p>
                <p style={{ fontSize: '0.875rem' }}>
                  Email:{' '}
                  <a href="mailto:info@aerojet-aviation.com" style={{ fontWeight: 600, color: 'var(--aero-sky)' }}>
                    info@aerojet-aviation.com
                  </a>
                </p>
              </div>
            </div>
          </article>
        </div>
      </div>

      <SiteFooter />
    </>
  )
}