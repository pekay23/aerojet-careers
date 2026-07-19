 'use client';

import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Mail, Phone } from 'lucide-react';


const MAIN_SITE = 'https://www.aerojet-aviation.com';

const footerLinks = {
  careers: [
    { label: 'All Vacancies', href: '/jobs' },
    { label: 'Graduate Program', href: '/graduate-program' },
    { label: 'Skilled Training', href: '/skilled-training' },
    { label: 'Licensed Aircraft Engineers', href: '/apply/licensed-aircraft-engineers' },
    { label: 'Register Your Profile', href: '/register' },
  ],
  company: [
    { label: 'Main Website', href: MAIN_SITE },
    { label: 'Planned Capabilities', href: `${MAIN_SITE}/planned-capabilities` },
    { label: 'Accra MRO', href: `${MAIN_SITE}/accra-mro` },
    { label: 'Consultancy', href: `${MAIN_SITE}/consultancy` },
    { label: 'Training Academy', href: `${MAIN_SITE}/training` },
    { label: 'Newsroom', href: `${MAIN_SITE}/newsroom` },
    { label: 'Contact', href: `${MAIN_SITE}/contact` },
  ],
  legal: [
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms of Use', href: '/terms' },
    { label: 'Cookie Policy', href: '/cookies' },
  ],
};


export default function SiteFooter() {
  return (
    <footer style={{ background: 'var(--aero-blue)', color: 'white' }}>
      <div style={{ maxWidth: 'var(--container-wide)', margin: '0 auto', padding: '3rem 1.5rem 2rem' }}>
        {/* Main Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Column 1: Brand */}
          <div style={{ paddingTop: '0.5rem' }}>
            <div style={{ position: 'relative', height: 48, width: 192, marginBottom: '1.5rem' }}>
              <Image
                src="/logos/logo-footer.png"
                alt="Aerojet Aviation Footer Logo"
                fill
                sizes="192px"
                style={{ objectFit: 'contain', objectPosition: 'left' }}
              />
            </div>
            <p style={{ opacity: 0.8, lineHeight: 1.7, fontSize: '0.875rem', marginBottom: '2rem', maxWidth: 280 }}>
              Building West Africa's premier MRO facility — delivering world-class maintenance capabilities.
            </p>

            {/* Careers CTA (replaces non-functional newsletter — no subscribe backend exists) */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
              <h4 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: 'var(--aero-sky)', marginBottom: '0.5rem' }}>
                Explore Openings
              </h4>
              <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: '1rem' }}>
                Browse current vacancies or register your profile for future opportunities.
              </p>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <Link
                  href="/jobs"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: 'var(--radius-xl)',
                    background: 'var(--aero-sky)',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    color: 'white',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 174, 239, 0.9)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--aero-sky)')}
                >
                  View Vacancies
                </Link>
                <Link
                  href="/register"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    borderRadius: 'var(--radius-xl)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    padding: '0.625rem 1.25rem',
                    fontSize: '0.875rem',
                    fontWeight: 'bold',
                    color: 'white',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--aero-sky)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)'; }}
                >
                  Register
                </Link>
              </div>
            </div>
          </div>


          {/* Column 2: Careers */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--aero-sky)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Careers
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {footerLinks.careers.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{ opacity: 0.9, fontSize: '0.875rem', transition: 'color 0.2s', color: 'white', textDecoration: 'none', display: 'block' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--aero-sky)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--aero-sky)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Company
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    style={{ opacity: 0.9, fontSize: '0.875rem', transition: 'color 0.2s', color: 'white', textDecoration: 'none', display: 'block' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--aero-sky)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal */}

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--aero-sky)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Legal
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    style={{ opacity: 0.9, fontSize: '0.875rem', transition: 'color 0.2s', color: 'white', textDecoration: 'none', display: 'block' }}
                    onMouseEnter={(e) => e.currentTarget.style.color = 'var(--aero-sky)'}
                    onMouseLeave={(e) => e.currentTarget.style.color = 'white'}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Contact */}

          <div>
            <h4 style={{ fontSize: '1rem', fontWeight: 'bold', color: 'var(--aero-sky)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Contact
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.875rem', opacity: 0.9, lineHeight: 1.6 }}>
                <MapPin size={16} aria-hidden="true" style={{ marginTop: 2, flexShrink: 0 }} />
                <span>Kotoka International Airport<br/>Accra, Ghana</span>

              </li>
              <li style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                <a href="mailto:careers@aerojet-aviation.com" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'color 0.2s', color: 'white', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--aero-sky)'} onMouseLeave={(e) => e.currentTarget.style.color = 'white'}>
                  <Mail size={16} aria-hidden="true" />
                  careers@aerojet-aviation.com

                </a>
              </li>
              <li style={{ fontSize: '0.875rem', opacity: 0.9 }}>
                <a href="tel:+233209848423" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', transition: 'color 0.2s', color: 'white', textDecoration: 'none' }} onMouseEnter={(e) => e.currentTarget.style.color = 'var(--aero-sky)'} onMouseLeave={(e) => e.currentTarget.style.color = 'white'}>
                  <Phone size={16} aria-hidden="true" />
                  +233-20-984-8423

                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginBottom: '1.5rem' }} />

        {/* Bottom Row: Copyright + Legal Links */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
          textAlign: 'center'
        }}>
          <p style={{ fontSize: '0.75rem', opacity: 0.6, margin: 0 }}>
            &copy; {new Date().getFullYear()} Aerojet Aviation. All rights reserved.
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '1.5rem' }}>
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                style={{ fontSize: '0.75rem', opacity: 0.6, transition: 'opacity 0.2s', color: 'white', textDecoration: 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={MAIN_SITE}
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '0.75rem', opacity: 0.6, transition: 'opacity 0.2s', color: 'white', textDecoration: 'none' }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.6'}
            >
              aerojet-aviation.com
            </a>

          </div>
        </div>
      </div>
    </footer>
  );
}