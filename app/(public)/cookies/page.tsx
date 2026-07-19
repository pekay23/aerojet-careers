import { Metadata } from 'next'
import Link from 'next/link'
import SiteNav from '@/components/layout/SiteNav'
import SiteFooter from '@/components/layout/SiteFooter'

export const metadata: Metadata = { 
  title: 'Cookie Policy | Aerojet Aviation Careers',
  description: 'How Aerojet Aviation uses cookies and similar technologies on the careers portal.'
}

export default function CookiePolicyPage() {
  return (
    <>
      <SiteNav activePath="/cookies" />
      
      <div style={{ background: 'var(--bg)', paddingTop: '70px' }}>
        <div style={{ maxWidth: '880px', margin: '0 auto', padding: '3rem 1.5rem' }}>
          <div style={{ borderRadius: '1.5rem', border: '1px solid var(--border)', background: 'white', padding: '2rem', boxShadow: 'var(--shadow-xl)', marginBottom: '2rem' }}>
            <div style={{ marginBottom: '2.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border)' }}>
              <span style={{ display: 'inline-block', marginBottom: '1rem', borderRadius: '9999px', background: 'rgba(0, 174, 239, 0.1)', padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 800, color: 'var(--aero-sky)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Legal Policy
              </span>
              <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', lineHeight: 1.2 }}>
                Cookie Policy
              </h1>
              <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#94a3b8', fontStyle: 'italic' }}>Last updated: July 2026</p>
            </div>

            <div style={{ color: '#334155', lineHeight: 1.7 }}>
              <p style={{ fontSize: '1.125rem', marginBottom: '1.5rem' }}>
                This Cookie Policy explains how <strong>Aerojet Aviation</strong> ("we", "us", "our") uses cookies and similar technologies on 
                <Link href="/" style={{ fontWeight: 600, color: 'var(--aero-sky)' }}>
                  careers.aerojet-aviation.com
                </Link>
                ("the Portal").
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>What Are Cookies</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                Cookies are small text files placed on your device when you visit a website. They help the site
                remember your actions and preferences (such as login, language, font size) over a period of time.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Categories We Use</h3>
              <p style={{ marginBottom: '1rem' }}>We use the following categories of cookies:</p>
              
              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>1. Strictly Necessary Cookies</h4>
              <p style={{ marginBottom: '1rem' }}>
                These cookies are essential for the Portal to function and cannot be switched off. They are
                usually set in response to actions you take, such as logging in, filling forms, or setting
                privacy preferences. They include session authentication, CSRF protection, and security headers.
              </p>

              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>2. Performance & Analytics Cookies</h4>
              <p style={{ marginBottom: '1rem' }}>
                These cookies help us understand how visitors interact with the Portal by collecting anonymous
                information. We may use privacy-respecting analytics to measure page views, navigation paths,
                and error rates to improve the website. You can opt out of non-essential analytics.
              </p>

              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>3. Functional Cookies</h4>
              <p style={{ marginBottom: '1rem' }}>
                These enable enhanced functionality and personalisation, such as remembering your preferred
                language or region. They may be set by us or by third-party providers whose services we use.
              </p>

              <h4 style={{ fontWeight: 600, marginBottom: '0.5rem' }}>4. Targeting / Advertising Cookies</h4>
              <p style={{ marginBottom: '1rem' }}>
                We do not currently use targeting or advertising cookies on the careers portal.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Specific Cookies</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2rem', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--border)' }}>
                    <th style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--aero-blue)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Name</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--aero-blue)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Purpose</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--aero-blue)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Category</th>
                    <th style={{ padding: '0.75rem', fontWeight: 700, color: 'var(--aero-blue)', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>session_id</td>
                    <td style={{ padding: '0.75rem' }}>User session authentication</td>
                    <td style={{ padding: '0.75rem' }}>Strictly Necessary</td>
                    <td style={{ padding: '0.75rem' }}>Session</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>csrf_token</td>
                    <td style={{ padding: '0.75rem' }}>Cross-site request forgery protection</td>
                    <td style={{ padding: '0.75rem' }}>Strictly Necessary</td>
                    <td style={{ padding: '0.75rem' }}>Session</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>preferred_language</td>
                    <td style={{ padding: '0.75rem' }}>Remembers language preference</td>
                    <td style={{ padding: '0.75rem' }}>Functional</td>
                    <td style={{ padding: '0.75rem' }}>1 year</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>analytics_consent</td>
                    <td style={{ padding: '0.75rem' }}>Remembers analytics opt-in/out choice</td>
                    <td style={{ padding: '0.75rem' }}>Functional</td>
                    <td style={{ padding: '0.75rem' }}>1 year</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace' }}>_ga / _gid</td>
                    <td style={{ padding: '0.75rem' }}>Google Analytics (if enabled)</td>
                    <td style={{ padding: '0.75rem' }}>Analytics</td>
                    <td style={{ padding: '0.75rem' }}>13 months / 24h</td>
                  </tr>
                </tbody>
              </table>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Third-Party Providers</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We may use the following third-party services that set their own cookies:
              </p>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                <li><strong>Google Analytics</strong> — for aggregated, anonymised website analytics (only with consent).</li>
                <li><strong>Vercel</strong> — for hosting, edge caching, and performance metrics.</li>
              </ul>
              <p style={{ marginBottom: '1.5rem' }}>
                These providers have their own privacy policies. We encourage you to review them.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Managing Cookies</h3>
              <p style={{ marginBottom: '1rem' }}>
                You can control cookies through your browser settings:
              </p>
              <ul style={{ listStyle: 'disc', paddingLeft: '1.5rem', marginBottom: '1.5rem' }}>
                <li>Accept or reject all cookies</li>
                <li>Block third-party cookies</li>
                <li>Delete existing cookies</li>
                <li>Set preferences per site</li>
              </ul>
              <p style={{ marginBottom: '1.5rem' }}>
                Please note that disabling strictly necessary cookies will break core Portal functionality
                (login, application forms, security).
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Consent</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                On your first visit, we will ask for your consent to set non-essential cookies. You can
                withdraw or change your consent at any time via the cookie banner or your browser settings.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Changes to This Policy</h3>
              <p style={{ marginBottom: '1.5rem' }}>
                We may update this Cookie Policy to reflect changes in our practices or applicable law.
                The "Last updated" date at the top will be revised. Please review periodically.
              </p>

              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', textTransform: 'uppercase', marginTop: '2rem', marginBottom: '1rem' }}>Contact Us</h3>
              <p style={{ marginBottom: '0.75rem' }}>
                For questions about this Cookie Policy or our use of cookies, contact:
              </p>
              <p style={{ marginBottom: '0.5rem' }}>
                <a href="mailto:info@aerojet-aviation.com" style={{ fontWeight: 600, color: 'var(--aero-sky)' }}>
                  info@aerojet-aviation.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <SiteFooter />
    </>
  )
}