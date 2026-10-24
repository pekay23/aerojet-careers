'use client'

const CONSENT_API = '/api/consent/log'

type ConsentCategories = {
  necessary: true
  analytics: boolean
  functional: boolean
  targeting: false
}

/** Fire-and-forget audit of the "manage preferences" action. */
function logManagePreferences() {
  if (typeof window === 'undefined') return
  let categories: ConsentCategories = { necessary: true, analytics: false, functional: false, targeting: false }
  try {
    const raw = localStorage.getItem('cookie_preferences')
    if (raw) {
      const parsed = JSON.parse(raw)
      categories = {
        necessary: true,
        analytics: Boolean(parsed?.analytics),
        functional: Boolean(parsed?.functional),
        targeting: false,
      }
    }
  } catch {
    /* ignore parse errors — log defaults */
  }
  try {
    fetch(CONSENT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        categories,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        ip: undefined,
      }),
      keepalive: true,
    }).catch((err) => {
      console.warn('[consent] audit POST failed:', err?.message || err)
    })
  } catch (err) {
    console.warn('[consent] audit POST failed:', err instanceof Error ? err.message : String(err))
  }
}

export function CookieSettingsButton() {
  const openModal = () => {
    logManagePreferences()
    // Dispatch custom event that CookieBanner listens for
    window.dispatchEvent(new CustomEvent('cookie:open-preferences'))
  }

  return (
    <button
      type="button"
      onClick={openModal}
      style={{
        marginBottom: '1.5rem',
        padding: '0.6rem 1.25rem',
        fontSize: '0.875rem',
        fontWeight: 600,
        color: 'white',
        background: 'var(--aero-sky, #0ea5e9)',
        border: 'none',
        borderRadius: '0.4rem',
        cursor: 'pointer',
      }}
    >
      Manage Preferences
    </button>
  )
}