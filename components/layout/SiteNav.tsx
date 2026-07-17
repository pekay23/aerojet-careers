'use client'

import Link from 'next/link'
import { useState } from 'react'

const NAV_LINKS = [
  { href: 'https://aerojet-aviation.com', label: 'Home' },
  { href: 'https://aerojet-aviation.com/planned-capabilities.html', label: 'Planned Capabilities' },
  { href: 'https://aerojet-aviation.com/consultancy.html', label: 'Consultancy' },
  { href: 'https://aerojet-aviation.com/training.html', label: 'Training' },
  { href: 'https://aerojet-aviation.com/accra-mro.html', label: 'Accra MRO' },
  { href: 'https://aerojet-aviation.com/newsroom.html', label: 'Newsroom' },
  { href: '/', label: 'Careers', internal: true },
  { href: 'https://aerojet-aviation.com/contact.html', label: 'Contact' },
]

export default function SiteNav({ activePath = '' }: { activePath?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <nav
      style={{
        background: 'var(--background)',
        boxShadow: 'var(--shadow-sm)',
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 2rem',
          height: 70,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="https://aerojet-aviation.com"
          style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}
        >
          <img
            src="/images/aalogo-TUj_x_h8.png"
            alt="Aerojet Aviation"
            style={{ height: 40, width: 'auto', display: 'block' }}
          />
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
              color: isActive ? 'var(--aero-sky)' : 'var(--foreground)',
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
          aria-label="Toggle menu"
          className="mobile-nav-toggle"
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            color: 'var(--foreground)',
            cursor: 'pointer',
            display: 'none',
          }}
        >
          ☰
        </button>
      </div>

      {open && (
        <div
          className="mobile-nav-menu"
          style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--background)',
            padding: '1rem 2rem',
          }}
        >
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
                    style={{ textDecoration: 'none', color: 'var(--foreground)', fontSize: '0.95rem' }}
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </Link>
                ) : (
                  <a
                    href={link.href}
                    style={{ textDecoration: 'none', color: 'var(--foreground)', fontSize: '0.95rem' }}
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
