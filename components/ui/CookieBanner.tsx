'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cookie_preferences'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.pathname.startsWith('/admin')) return
    setVisible(!localStorage.getItem(STORAGE_KEY))
  }, [])

  if (!visible) return null

  const acceptAll = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: true, functional: true }))
    setVisible(false)
  }

  const rejectNonEssential = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ analytics: false, functional: false }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: 'var(--surface, #fff)',
        borderTop: '1px solid var(--border, #e2e8f0)',
        boxShadow: '0 -4px 24px rgba(0, 0, 0, 0.08)',
        padding: '1.25rem 1.5rem',
      }}
    >
      <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.5, flex: 1, minWidth: '240px', margin: 0 }}>
            We use cookies to keep you logged in, remember your preferences, and understand how the portal is used.
            Read our{' '}
            <Link href="/cookies" style={{ color: 'var(--aero-sky, #0ea5e9)', fontWeight: 600 }}>
              Cookie Policy
            </Link>
            .
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
            <button
              type="button"
              onClick={rejectNonEssential}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: '#475569',
                background: 'transparent',
                border: '1px solid var(--border, #e2e8f0)',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Reject non-essential
            </button>
            <button
              type="button"
              onClick={acceptAll}
              style={{
                padding: '0.5rem 1rem',
                fontSize: '0.825rem',
                fontWeight: 600,
                color: 'white',
                background: 'var(--aero-sky, #0ea5e9)',
                border: 'none',
                borderRadius: '0.375rem',
                cursor: 'pointer',
              }}
            >
              Accept all
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
