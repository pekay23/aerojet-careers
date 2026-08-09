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
    <footer className="site-footer">
      <div className="footer-container">
        {/* Main Grid: Brand | Careers | Company | Legal | Contact */}
        <div className="footer-grid">
          {/* Column 1: Brand */}
          <div className="footer-col" style={{ paddingTop: 'var(--sp-1)' }}>
            <div style={{ position: 'relative', height: 48, width: 192, marginBottom: '1.5rem' }}>
              <Image
                src="/logos/logo-footer.png"
                alt="Aerojet Aviation Footer Logo"
                fill
                sizes="192px"
                style={{ objectFit: 'contain', objectPosition: 'left' }}
              />
            </div>
            <p style={{ opacity: 0.8, lineHeight: 1.7, fontSize: '0.875rem', marginBottom: 'var(--sp-6)', maxWidth: 280 }}>
              Building West Africa's premier MRO facility — delivering world-class maintenance capabilities.
            </p>

            {/* Explore Openings CTA — standalone element in Brand column */}
            <div style={{
              borderTop: '1px solid rgba(255,255,255,0.1)',
              paddingTop: 'var(--sp-5)',
            }}>
              <h4 style={{
                fontSize: '1.125rem',
                fontWeight: 'bold',
                color: 'var(--aero-sky)',
                marginBottom: 'var(--sp-2)',
              }}>
                Explore Openings
              </h4>
              <p style={{ fontSize: '0.875rem', opacity: 0.8, marginBottom: 'var(--sp-4)' }}>
                Browse current vacancies or register your profile for future opportunities.
              </p>
              <div style={{ display: 'flex', gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
                <Link
                  href="/jobs"
                  className="btn btn-sky btn-md"
                  style={{ transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--aero-sky-700)';
                    e.currentTarget.style.borderColor = 'var(--aero-sky-700)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--aero-sky-600)';
                    e.currentTarget.style.borderColor = 'var(--aero-sky-600)';
                  }}
                >
                  View Vacancies
                </Link>
                <Link
                  href="/register"
                  className="btn btn-ghost btn-md"
                  style={{
                    border: '1px solid rgba(255,255,255,0.35)',
                    color: 'white',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.borderColor = 'var(--aero-sky)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.35)';
                  }}
                >
                  Register
                </Link>
              </div>
            </div>
          </div>

          {/* Column 2: Careers */}
          <div className="footer-col">
            <h4>Careers</h4>
            <ul>
              {footerLinks.careers.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Company */}
          <div className="footer-col">
            <h4>Company</h4>
            <ul>
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target={link.href.startsWith('http') ? '_blank' : undefined}
                    rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div className="footer-col">
            <h4>Legal</h4>
            <ul>
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Contact (standalone, beside Legal) */}
          <div className="footer-col footer-contact">
            <h4>Contact</h4>
            <ul>
              <li>
                <MapPin size={16} aria-hidden="true" />
                <span>Kotoka International Airport<br/>Accra, Ghana</span>
              </li>
              <li>
                <a href="mailto:careers@aerojet-aviation.com">
                  <Mail size={16} aria-hidden="true" />
                  careers@aerojet-aviation.com
                </a>
              </li>
              <li>
                <a href="tel:+233209848423">
                  <Phone size={16} aria-hidden="true" />
                  +233-20-984-8423
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="footer-divider" />

        {/* Bottom Row: Copyright + Legal Links */}
        <div className="footer-bottom">
          <p>
            &copy; {new Date().getFullYear()} Aerojet Aviation. All rights reserved.
          </p>
          <div className="footer-legal-links">
            {footerLinks.legal.map((link) => (
              <Link
                key={link.label}
                href={link.href}
              >
                {link.label}
              </Link>
            ))}
            <a
              href={MAIN_SITE}
              target="_blank"
              rel="noopener noreferrer"
            >
              aerojet-aviation.com
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
