'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { FaBars, FaTimes } from 'react-icons/fa'
import Image from 'next/image'

const MAIN_SITE = 'https://www.aerojet-aviation.com'

const NAV_LINKS = [
  { href: MAIN_SITE, label: 'Home' },
  { href: `${MAIN_SITE}/planned-capabilities`, label: 'Planned Capabilities' },
  { href: `${MAIN_SITE}/consultancy`, label: 'Consultancy' },
  { href: `${MAIN_SITE}/training`, label: 'Training' },
  { href: `${MAIN_SITE}/accra-mro`, label: 'Accra MRO' },
  { href: `${MAIN_SITE}/newsroom`, label: 'Newsroom' },
  { href: '/', label: 'Careers', internal: true },
  { href: `${MAIN_SITE}/contact`, label: 'Contact' },
]


export default function SiteNav({ activePath = '' }: { activePath?: string }) {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const linkColor = scrolled ? 'var(--aero-blue)' : 'white'
  const activeLinkColor = scrolled ? 'var(--aero-sky)' : 'var(--aero-sky)'
  const mobileLinkColor = scrolled ? 'var(--foreground)' : 'white'

  return (
    <nav
      style={{
        background: scrolled ? 'rgba(255,255,255,0.98)' : 'transparent',
        boxShadow: scrolled ? 'var(--shadow-md)' : 'none',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1000,
        transition: 'background 0.3s ease, box-shadow 0.3s ease',
        backdropFilter: scrolled ? 'blur(10px)' : 'none',
      }}
    >
      <div
        style={{
          maxWidth: 'var(--container-wide)',
          margin: '0 auto',
          padding: '0 1.5rem',
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo pinned to the far left (matches aerojet-aviation navbar). */}
        <Link
          href={MAIN_SITE}
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >


          <div style={{ position: 'relative', height: 40, width: 160 }}>
            <Image
              src={scrolled ? "/logos/logo-navbar.png" : "/logos/aerojetaviationlogonoBG.png"}
              alt="Aerojet Aviation"
              fill
              sizes="160px"
              style={{ objectFit: 'contain', objectPosition: 'left' }}
              priority
            />
          </div>
        </Link>

        <ul
          style={{
            listStyle: 'none',
            margin: 0,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
          }}
          className="desktop-nav"
        >
          {NAV_LINKS.map((link) => {
            const isActive = link.internal
              ? activePath === link.href ||
                activePath.startsWith('/jobs') ||
                activePath.startsWith('/apply') ||
                activePath.startsWith('/register') ||
                activePath.startsWith('/graduate-program') ||
                activePath.startsWith('/skilled-training')
              : false

            const style = {
              textDecoration: 'none',
              fontSize: '0.95rem',
              fontWeight: 500,
              color: isActive ? activeLinkColor : linkColor,
              transition: 'color 0.2s ease',
            }

            return (
              <li key={link.href}>
                {link.internal ? (
                  <Link href={link.href} style={style}>
                    {link.label}
                  </Link>
                ) : (
                  <a href={link.href} style={style}>
                    {link.label}
                  </a>
                )}
              </li>
            )
          })}
        </ul>

        <button
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="mobile-nav-menu"
          className="mobile-nav-toggle"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            color: linkColor,
            cursor: 'pointer',
            display: 'none',
          }}
        >
          {open ? <FaTimes aria-hidden="true" /> : <FaBars aria-hidden="true" />}
        </button>
      </div>

      {open && (
        <div
          id="mobile-nav-menu"
          className="mobile-nav-menu"

          style={{
            borderTop: `1px solid ${scrolled ? 'var(--border)' : 'rgba(255,255,255,0.2)'}`,
            background: scrolled ? 'var(--background)' : 'var(--aero-blue)',
            padding: '1rem 2rem',
            animation: 'slideDown 0.3s ease',
          }}
        >
          <style jsx>{`
            @keyframes slideDown {
              from { opacity: 0; transform: translateY(-10px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
          <ul
            style={{
              listStyle: 'none',
              margin: 0,
              padding: 0,
              display: 'flex',
              flexDirection: 'column',
              gap: '0.9rem',
            }}
          >
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                {link.internal ? (
                  <Link
                    href={link.href}
                    style={{ textDecoration: 'none', color: mobileLinkColor, fontSize: '0.95rem' }}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    style={{ textDecoration: 'none', color: mobileLinkColor, fontSize: '0.95rem' }}
                  >
                    {link.label}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  )
}