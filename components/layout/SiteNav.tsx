'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaBars, FaTimes } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { MAIN_SITE } from '@/lib/domain-config';

export default function SiteNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const underlineRefs = useRef<(HTMLDivElement | null)[]>([]);

  const LIGHT_BG_PATHS = [
    '/jobs', '/register', '/graduate-program', '/skilled-training',
    '/cookies', '/terms', '/privacy', '/faq', '/our-story', '/check-status',
  ];
  const forceOpaque = LIGHT_BG_PATHS.includes(pathname);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!mobileMenuOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileMenuOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const handleMouseEnter = (index: number) => {
    const el = underlineRefs.current[index];
    if (el) el.style.transform = 'scaleX(1)';
  };

  const handleMouseLeave = (index: number) => {
    const el = underlineRefs.current[index];
    if (el) el.style.transform = 'scaleX(0)';
  };

  const menuItems: Array<{ name: string; href: string; external?: boolean }> = [
    { name: 'Home', href: '/' },
    { name: 'Jobs', href: '/jobs' },
    { name: 'Graduate Program', href: '/graduate-program' },
    { name: 'Skilled Training', href: '/skilled-training' },
    { name: 'Register', href: '/register' },
    { name: 'Check Status', href: '/check-status' },
  ];

  const secondaryItems: Array<{ name: string; href: string; external?: boolean }> = [
    { name: 'FAQ', href: '/faq' },
    { name: 'Our Story', href: '/our-story' },
    { name: 'Newsroom', href: `${MAIN_SITE}/newsroom`, external: true },
    { name: 'Contact', href: `${MAIN_SITE}/contact`, external: true },
  ];

  const isOpaque = scrolled || forceOpaque;
  const linkColor = isOpaque ? 'text-aero-blue' : 'text-white';
  const hoverColor = 'hover:text-aero-accent';

  return (
    <nav className={`site-nav fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      isOpaque ? 'scrolled bg-white shadow-md py-3' : 'bg-transparent py-5'
    }`}>
      <div className="w-full px-4 sm:px-6">
        <div className="mx-auto max-w-8xl grid grid-cols-[auto_1fr_auto] items-center gap-4">

          {/* Logo — always visible, left-aligned */}
          <Link href="/" className="relative h-9 sm:h-10 w-36 sm:w-40 flex items-center no-underline">
            <Image
             src={isOpaque ? '/logos/logo-navbar.png' : '/logos/aerojetaviationlogonoBG.png'}
             alt="Aerojet Aviation"
             fill
             sizes="(max-width: 640px) 144px, (max-width: 1024px) 160px, 160px"
             className="object-contain object-left"
             priority
           />
          </Link>

          {/* Centered Desktop Links — hidden below lg, centered on desktop */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="flex items-center gap-5 xl:gap-7 flex-nowrap">
              {menuItems.map((item, index) => (
                <div key={item.name} className="relative min-touch">
                  <Link
                    href={item.href}
                    className={`font-semibold text-sm uppercase tracking-wider transition-colors py-3 px-3 rounded ${linkColor} ${hoverColor} ${pathname === item.href ? 'text-aero-accent' : ''}`}
                    onMouseEnter={() => handleMouseEnter(index)}
                    onMouseLeave={() => handleMouseLeave(index)}
                  >
                    {item.name}
                  </Link>
                  {/* Animated underline */}
                  <div
                    ref={(el) => { underlineRefs.current[index] = el; }}
                    className="absolute -bottom-1 left-0 h-0.5 bg-aero-accent origin-left scale-x-0"
                    style={{ width: '100%' }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* View All Jobs — far right on desktop */}
          <div className="hidden lg:flex justify-end">
            <Link
              href="/jobs"
              className="btn-primary text-sm py-2 px-5 sm:px-6 tracking-widest whitespace-nowrap"
            >
              View All Jobs
            </Link>
          </div>

          {/* Mobile Toggle — visible below lg, right-aligned */}
          <button
            className={`lg:hidden text-xl sm:text-2xl ${linkColor} min-h-11 min-w-11 flex items-center justify-center rounded focus:outline-none focus:ring-2 focus:ring-aero-accent`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
          >
            {mobileMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu — slide-down panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="absolute top-full left-0 w-full bg-white shadow-lg flex flex-col items-center py-6 space-y-5 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
        >
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className={`font-bold text-base sm:text-lg hover:text-aero-accent ${pathname === item.href ? 'text-aero-accent' : 'text-aero-blue'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <div style={{ width: '60%', height: 1, background: 'var(--border)' }} />
          {secondaryItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className={`text-sm hover:text-aero-accent ${pathname === item.href ? 'text-aero-accent' : 'text-aero-blue'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/jobs"
            className="btn-primary text-white text-sm py-3 px-10 tracking-widest"
            onClick={() => setMobileMenuOpen(false)}
          >
            View All Jobs
          </Link>
        </div>
      )}
    </nav>
  );
}