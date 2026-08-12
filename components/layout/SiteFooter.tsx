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
    { label: 'Register Your Profile', href: '/register' },
    { label: 'FAQ', href: '/faq' },
    { label: 'Our Story', href: '/our-story' },
    { label: 'Check Application Status', href: '/check-status' },
  ],
  company: [
    { label: 'Main Website', href: MAIN_SITE },
    { label: 'Accra MRO', href: `${MAIN_SITE}/accra-mro` },
    { label: 'Consultancy', href: `${MAIN_SITE}/consultancy` },
    { label: 'Training Academy', href: `${MAIN_SITE}/training` },
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
          <div className="footer-col py-4">
             <div className="relative h-12 w-40 mb-6">
               <Image
                 src="/logos/logo-footer.png"
                 alt="Aerojet Aviation Footer Logo"
                 fill
                 sizes="160px"
                 className="object-contain object-left"
               />
            </div>
            <p className="opacity-80 leading-relaxed text-sm">
              Building West Africa's premier MRO facility — delivering world-class maintenance, training, and consultancy capabilities.
            </p>
          </div>

          {/* Column 2: Careers */}
          <div className="footer-col py-4">
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
          <div className="footer-col py-4">
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

            {/* Column 4: Legal */}
            <div className="footer-col py-4">
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

            {/* Column 5: Contact */}
            <div className="footer-col py-4">
              <h4 className="text-lg font-bold text-aero-accent mb-4">Contact</h4>
              <ul className="footer-contact space-y-3 text-sm opacity-90">
                <li className="flex items-center gap-3">
                  <FaMapMarkerAlt className="text-white" />
                  <span className="text-white">Accra International Airport, Accra, Ghana</span>
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

        {/* Copyright */}
        <div className="text-center pt-6 border-t border-white/10 text-xs opacity-60">
          <p>&copy; {new Date().getFullYear()} Aerojet Aviation. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

