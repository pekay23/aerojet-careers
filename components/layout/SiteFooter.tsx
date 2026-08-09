'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FaMapMarkerAlt, FaEnvelope, FaPhoneAlt } from 'react-icons/fa';
import { MAIN_SITE } from '@/lib/domain-config';

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
    <footer className="bg-aero-blue text-white pt-16 pb-6">
      <div className="container mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-10 mb-10 items-start">

        {/* Column 1: Brand */}
        <div className="py-4">
          <div className="relative h-12 w-48 mb-6">
            <Image
              src="/logos/logo-footer.png"
              alt="Aerojet Aviation Footer Logo"
              fill
              sizes="192px"
              className="object-contain object-left"
            />
          </div>
          <p className="opacity-80 leading-relaxed text-sm mb-8">
            Building West Africa's premier MRO facility — delivering world-class maintenance, training, and consultancy capabilities.
          </p>

          {/* Explore Openings CTA */}
          <div className="border-t border-white/10 pt-6">
            <h4 className="text-lg font-bold text-aero-accent mb-2">Explore Openings</h4>
            <p className="text-sm opacity-80 mb-4">
              Browse current vacancies or register your profile for future opportunities.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Link
                href="/jobs"
                className="btn-primary text-white text-sm py-2 px-5"
              >
                View Vacancies
              </Link>
              <Link
                href="/register"
                className="btn-secondary text-white text-sm py-2 px-5"
              >
                Register
              </Link>
            </div>
          </div>
        </div>

        {/* Column 2: Careers */}
        <div className="py-4">
          <h4 className="text-lg font-bold text-aero-accent mb-4">Careers</h4>
          <ul className="space-y-2 text-sm opacity-90">
            {footerLinks.careers.map((link) => (
              <li key={link.label}>
                <Link href={link.href} className="text-white hover:text-aero-accent transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="py-4">
          <h4 className="text-lg font-bold text-aero-accent mb-4">Company</h4>
          <ul className="space-y-2 text-sm opacity-90">
            {footerLinks.company.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target={link.href.startsWith('http') ? '_blank' : undefined}
                  rel={link.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  className="text-white hover:text-aero-accent transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Column 4: Legal + Contact */}
        <div className="py-4">
          <div className="mb-6">
            <h4 className="text-lg font-bold text-aero-accent mb-4">Legal</h4>
            <ul className="space-y-2 text-sm opacity-90">
              {footerLinks.legal.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-white hover:text-aero-accent transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold text-aero-accent mb-4">Contact</h4>
            <ul className="space-y-3 text-sm opacity-90">
              <li className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-white" />
                <span className="text-white">Kotoka International Airport, Accra, Ghana</span>
              </li>
              <li>
                <a
                  href="mailto:careers@aerojet-aviation.com"
                  className="flex items-center gap-3 text-white hover:text-aero-accent transition-colors"
                >
                  <FaEnvelope className="text-white" />
                  careers@aerojet-aviation.com
                </a>
              </li>
              <li>
                <a
                  href="tel:+233209848423"
                  className="flex items-center gap-3 text-white hover:text-aero-accent transition-colors"
                >
                  <FaPhoneAlt className="text-white" />
                  +233-20-984-8423
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="text-center pt-6 text-xs opacity-60">
        <p>&copy; {new Date().getFullYear()} Aerojet Aviation. All rights reserved.</p>
      </div>
    </footer>
  );
}
