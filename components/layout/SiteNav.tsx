'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaBars, FaTimes } from 'react-icons/fa';
import { usePathname } from 'next/navigation';
import { MAIN_SITE, CAREERS_INTERNAL_LINKS } from '@/lib/domain-config';

export default function SiteNav({ activePath = '' }: { activePath?: string }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const underlineRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
    ...CAREERS_INTERNAL_LINKS,
    { name: 'Newsroom', href: `${MAIN_SITE}/newsroom`, external: true },
    { name: 'Contact', href: `${MAIN_SITE}/contact`, external: true },
  ];

  const linkColor = scrolled ? 'text-aero-blue' : 'text-white';
  const hoverColor = 'hover:text-aero-accent';

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white shadow-md py-3' : 'bg-transparent py-5'
    }`}>
      <div className="container mx-auto px-6 flex justify-between items-center">

        {/* Logo — transparent version when over hero, dark version when scrolled */}
        <Link href="/" className="relative h-10 w-40">
          <Image
            src={scrolled ? '/logos/logo-navbar.png' : '/logos/aerojetaviationlogonoBG.png'}
            alt="Aerojet Aviation"
            fill
            sizes="160px"
            className="object-contain object-left"
            priority
          />
        </Link>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center gap-10">
          <div className="flex items-center gap-7">
            {menuItems.map((item, index) => (
              <div key={item.name} className="relative">
                <Link
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  className={`font-semibold text-sm uppercase tracking-wider transition-colors ${linkColor} ${hoverColor} ${pathname === item.href ? 'text-aero-accent' : ''}`}
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

          <Link
            href="/jobs"
            className="btn-primary text-sm py-2 px-6 tracking-widest"
          >
            View All Jobs
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className={`lg:hidden text-2xl ${linkColor}`}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-white shadow-lg flex flex-col items-center py-8 space-y-6 lg:hidden">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              target={item.external ? '_blank' : undefined}
              rel={item.external ? 'noopener noreferrer' : undefined}
              className={`font-bold text-lg hover:text-aero-accent ${pathname === item.href ? 'text-aero-accent' : 'text-aero-blue'}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.name}
            </Link>
          ))}
          <Link
            href="/jobs"
            className="btn-primary text-sm py-3 px-10 tracking-widest"
            onClick={() => setMobileMenuOpen(false)}
          >
            View All Jobs
          </Link>
        </div>
      )}
    </nav>
  );
}
