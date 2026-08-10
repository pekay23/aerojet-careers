'use client'

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={() => {
        localStorage.removeItem('cookie_preferences')
        window.location.reload()
      }}
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
