'use client'

import { useEffect, useState } from 'react'

/**
 * SecurityShield — client-side deterrents for public-facing content.
 *
 * Mount once in the root layout. In production it:
 *   - Disables right-click context menu and F12 DevTools
 *   - Silences console.debug/console.info (keeps console.warn/error)
 *
 * These are defense-in-depth measures only; the real protection is server-side
 * (CSP, auth middleware, sensitive-path blocking in proxy.ts).
 *
 * NOTE: We do NOT block copy/cut/drag globally — that harms accessibility
 * (screen readers, text selection for legitimate users). The context menu
 * block is a deterrent only; users can still select text via keyboard.
 *
 * The shield is gated behind NEXT_PUBLIC_SECURITY_SHIELD so it can be
 * toggled without a rebuild (defaults to off for safety).
 */
export default function SecurityShield() {
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    // Read the flag at runtime so a misconfiguration is recoverable
    // without rebuilding the production bundle.
    setEnabled(process.env.NEXT_PUBLIC_SECURITY_SHIELD === '1')
  }, [])

  useEffect(() => {
    if (!enabled) return

    const block = (e: MouseEvent) => {
      e.preventDefault()
    }
    const preventKey = (e: KeyboardEvent) => {
      // F12, Ctrl+Shift+I (devtools), Ctrl+U (view source)
      if (e.key === 'F12') {
        e.preventDefault()
        return
      }
      const mod = e.ctrlKey || e.metaKey
      if (mod && (e.key === 'i' || e.key === 'I' || e.key === 'u' || e.key === 'U')) {
        e.preventDefault()
      }
    }

    document.addEventListener('contextmenu', block)
    document.addEventListener('keydown', preventKey)

    // Silence dev console noise in production
    const originalDebug = console.debug
    const originalInfo = console.info
    console.debug = () => {}
    console.info = () => {}

    return () => {
      document.removeEventListener('contextmenu', block)
      document.removeEventListener('keydown', preventKey)
      console.debug = originalDebug
      console.info = originalInfo
    }
  }, [enabled])

  return null
}