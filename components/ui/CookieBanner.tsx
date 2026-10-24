'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const STORAGE_KEY = 'cookie_preferences'
const CONSENT_API = '/api/consent/log'

type ConsentCategories = {
  necessary: true
  analytics: boolean
  functional: boolean
  targeting: false
}

type StoredPreferences = {
  analytics: boolean
  functional: boolean
}

const CATEGORY_DETAILS = [
  {
    id: 'necessary',
    name: 'Strictly Necessary',
    description: 'Essential for the portal to function. Set when you log in or submit an application.',
    cookies: ['aj_session (7 days)', 'refresh_token (30 days)'],
    enabled: true,
    required: true,
  },
  {
    id: 'functional',
    name: 'Functional',
    description: 'Enable enhanced functionality and personalisation, such as remembering your cookie preferences.',
    cookies: ['cookie_preferences (1 year)'],
    enabled: true,
    required: false,
  },
  {
    id: 'analytics',
    name: 'Performance & Analytics',
    description: 'We do not use performance or analytics cookies on the careers portal.',
    cookies: ['(none)'],
    enabled: false,
    required: true,
  },
  {
    id: 'targeting',
    name: 'Targeting / Advertising',
    description: 'We do not use targeting or advertising cookies on the careers portal.',
    cookies: ['(none)'],
    enabled: false,
    required: true,
  },
] as const

/**
 * Fire-and-forget POST to the audit endpoint.
 * Never blocks the UI and never throws — a failed audit is a console.warn.
 */
function logConsent(categories: ConsentCategories, userAgent?: string) {
  if (typeof window === 'undefined') return
  const body = JSON.stringify({
    categories,
    timestamp: new Date().toISOString(),
    userAgent: userAgent || navigator.userAgent,
    ip: undefined, // server resolves from request headers
  })
  try {
    fetch(CONSENT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      // keepalive ensures the request completes even if the page unmounts
      keepalive: true,
    }).catch((err) => {
      console.warn('[consent] audit POST failed:', err?.message || err)
    })
  } catch (err) {
    console.warn('[consent] audit POST failed:', err instanceof Error ? err.message : String(err))
  }
}

function getStoredPreferences(): StoredPreferences {
  if (typeof window === 'undefined') return { analytics: false, functional: false }
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        analytics: Boolean(parsed?.analytics),
        functional: Boolean(parsed?.functional),
      }
    }
  } catch {
    /* ignore parse errors */
  }
  return { analytics: false, functional: false }
}

function savePreferences(prefs: StoredPreferences) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
}

function buildCategoriesFromPrefs(prefs: StoredPreferences): ConsentCategories {
  return {
    necessary: true,
    analytics: prefs.analytics,
    functional: prefs.functional,
    targeting: false,
  }
}

export function CookieBanner() {
  const [visible, setVisible] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [modalFunctional, setModalFunctional] = useState(false)
  const bannerRef = useRef<HTMLDivElement>(null)
  const modalRef = useRef<HTMLDivElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (window.location.pathname.startsWith('/admin')) return
    setVisible(!localStorage.getItem(STORAGE_KEY))
  }, [])

  // Listen for custom event from CookieSettingsButton
  useEffect(() => {
    const handleOpenPreferences = () => {
      const prefs = getStoredPreferences()
      setModalFunctional(prefs.functional)
      setShowModal(true)
    }
    window.addEventListener('cookie:open-preferences', handleOpenPreferences)
    return () => window.removeEventListener('cookie:open-preferences', handleOpenPreferences)
  }, [])

  useEffect(() => {
    if (!visible || !bannerRef.current) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const prefs: StoredPreferences = { analytics: false, functional: false }
        savePreferences(prefs)
        logConsent(buildCategoriesFromPrefs(prefs))
        setVisible(false)
      }
    }

    const focusable = bannerRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (focusable.length === 0) return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('keydown', handleTab)
    first?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('keydown', handleTab)
    }
  }, [visible])

  // Modal focus trap
  useEffect(() => {
    if (!showModal || !modalRef.current) return

    lastFocusedRef.current = document.activeElement as HTMLElement

    const focusable = modalRef.current.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    const first = focusable[0]
    const last = focusable[focusable.length - 1]

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleModalCancel()
      } else if (e.key === 'Tab') {
        if (focusable.length === 0) return
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    first?.focus()

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      lastFocusedRef.current?.focus()
    }
  }, [showModal])

  const handleAcceptAll = () => {
    const prefs: StoredPreferences = { analytics: true, functional: true }
    savePreferences(prefs)
    logConsent(buildCategoriesFromPrefs(prefs))
    setVisible(false)
  }

  const handleRejectNonEssential = () => {
    const prefs: StoredPreferences = { analytics: false, functional: false }
    savePreferences(prefs)
    logConsent(buildCategoriesFromPrefs(prefs))
    setVisible(false)
  }

  const handleManagePreferences = () => {
    setShowModal(true)
  }

  const handleModalSave = (functional: boolean) => {
    const prefs: StoredPreferences = { analytics: false, functional }
    savePreferences(prefs)
    logConsent(buildCategoriesFromPrefs(prefs))
    setShowModal(false)
    setVisible(false)
  }

  const handleModalCancel = () => {
    setShowModal(false)
  }

  if (!visible) return null

  return (
    <>
      <div
        ref={bannerRef}
        role="dialog"
        aria-modal="true"
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
                onClick={handleManagePreferences}
                style={{
                  padding: '0.5rem 1rem',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                  color: 'var(--aero-sky, #0ea5e9)',
                  background: 'transparent',
                  border: '1px solid var(--aero-sky, #0ea5e9)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Manage Preferences
              </button>
              <button
                type="button"
                onClick={handleRejectNonEssential}
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
                onClick={handleAcceptAll}
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

      {showModal && (
        <div
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-modal-title"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleModalCancel()
          }}
        >
          <div
            style={{
              background: 'var(--surface, #fff)',
              borderRadius: '1rem',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              padding: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h2 id="cookie-modal-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--aero-blue)', margin: 0 }}>
                Cookie Preferences
              </h2>
              <button
                type="button"
                onClick={handleModalCancel}
                aria-label="Close cookie preferences"
                style={{
                  padding: '0.25rem 0.5rem',
                  fontSize: '1.25rem',
                  lineHeight: 1,
                  color: '#64748b',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: '1.5rem' }}>
              Choose which cookie categories you want to allow. Strictly necessary, analytics, and targeting cookies cannot be changed.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
              {CATEGORY_DETAILS.map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    border: '1px solid var(--border, #e2e8f0)',
                    borderRadius: '0.75rem',
                    padding: '1rem',
                    background: cat.required ? 'var(--bg, #f8fafc)' : 'white',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--aero-blue)', margin: 0 }}>
                          {cat.name}
                        </h3>
                        {cat.required && (
                          <span style={{ fontSize: '0.625rem', fontWeight: 700, color: 'white', background: 'var(--aero-blue)', padding: '0.125rem 0.5rem', borderRadius: '9999px', textTransform: 'uppercase' }}>
                            {cat.enabled ? 'Always On' : 'Always Off'}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: 0, marginBottom: '0.5rem' }}>
                        {cat.description}
                      </p>
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, fontFamily: 'monospace' }}>
                        Cookies: {cat.cookies.join(', ')}
                      </p>
                    </div>
                    {!cat.required && cat.id === 'functional' && (
                      <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={modalFunctional}
                          onChange={(e) => setModalFunctional(e.target.checked)}
                          style={{
                            width: '1.125rem',
                            height: '1.125rem',
                            accentColor: 'var(--aero-sky, #0ea5e9)',
                          }}
                        />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleModalCancel}
                style={{
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: '#475569',
                  background: 'transparent',
                  border: '1px solid var(--border, #e2e8f0)',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleModalSave(modalFunctional)}
                style={{
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  color: 'white',
                  background: 'var(--aero-sky, #0ea5e9)',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}