import { Metadata } from 'next'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'

export const metadata: Metadata = {
  title: 'FAQ | Aerojet Aviation Careers',
  description: 'Frequently asked questions about careers at Aerojet Aviation — MRO facility, Part-66 licences, visa sponsorship, graduate program, and more.',
}

const faqs = [
  {
    q: 'What is Aerojet Aviation?',
    a: 'Aerojet Aviation Group is developing West Africa\'s premier Maintenance, Repair and Overhaul (MRO) facility at Accra International Airport in Ghana. We deliver world-class aircraft maintenance, training, and consultancy capabilities to support both local and international operators.',
  },
  {
    q: 'What is an MRO facility?',
    a: 'MRO stands for Maintenance, Repair and Overhaul. An MRO facility is a certified location where aircraft undergo scheduled maintenance, unscheduled repairs, component overhaul, and regulatory inspections. Aerojet\'s Accra facility is being built to EASA Part 145 standards.',
  },
  {
    q: 'What are the Part-66 licence requirements?',
    a: 'We accept EASA Part-66 licences (B1.1, B2, and combined B1.1+B2), FAA A&P, and African civil aviation licences such as GCAA (Ghana), KCAA (Kenya), ECAA (Ethiopia), and NCAA (Nigeria). Applicants must hold a valid, unexpired licence relevant to the role they are applying for.',
  },
  {
    q: 'Do you offer visa sponsorship?',
    a: 'For certain senior and specialist roles, Aerojet Aviation can provide relocation and work permit support. This is assessed on a case-by-case basis depending on the role, your qualifications, and Ghana immigration requirements. Please discuss this during the application process.',
  },
  {
    q: 'How long does the application review take?',
    a: 'Our recruitment team reviews all applications within 5–7 business days. You will receive an email acknowledgement when you submit, and a further update once your application has been assessed. Shortlisted candidates are contacted for interview.',
  },
  {
    q: 'What is the graduate program duration?',
    a: 'The Aerojet Graduate Program is a structured 24-month development pathway for early-career talent. It combines on-the-job training, mentorship, and professional development across Engineering, IT, Operations, HR, Sales, Logistics, and Quality functions.',
  },
  {
    q: 'Is the skilled training program paid?',
    a: 'Yes. The Aerojet Skilled Training Program provides a structured training allowance for the duration of the program. Upon successful completion and certification, trainees are offered permanent roles within the organisation.',
  },
  {
    q: 'How do I check my application status?',
    a: 'You can check your application status by logging into the staff portal if you have an account. Alternatively, contact our recruitment team at careers@aerojet-aviation.com with your reference number and we will provide an update.',
  },
]

export default function FAQPage() {
  return (
    <>
      <SiteNav />
      <div className="page-pad" style={{ background: 'var(--bg)', paddingTop: '70px' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto', padding: '3rem 1.5rem' }}>
          <h1 className="section-heading" style={{ marginTop: 0 }}>Frequently Asked Questions</h1>
          <p style={{ color: 'var(--muted-foreground)', lineHeight: 1.7, marginBottom: '2.5rem', maxWidth: 640 }}>
            Answers to common questions about careers, licences, and life at Aerojet Aviation.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {faqs.map((item, i) => (
              <details key={i} className="card faq-item" style={{ padding: 0, overflow: 'hidden' }}>
                <summary style={{ padding: '1.25rem 1.5rem', fontWeight: 600, color: 'var(--navy)', cursor: 'pointer' }}>
                  <span>{item.q}</span>
                  <span className="faq-icon" aria-hidden="true">+</span>
                </summary>
                <div className="faq-body">
                  {item.a}
                </div>
              </details>
            ))}
          </div>

          <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '1rem' }}>
              Still have questions? We are happy to help.
            </p>
            <a href="mailto:careers@aerojet-aviation.com" className="btn btn-blue btn-lg">
              Contact Recruitment Team
            </a>
          </div>
        </div>
      </div>
      <SiteFooter />
    </>
  )
}
