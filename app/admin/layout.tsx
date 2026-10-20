import type { Metadata } from 'next'

/**
 * Admin layout — server-rendered metadata only.
 *
 * Auth is enforced at the edge by proxy.ts (JWT verification on every
 * /admin/* and /api/admin/* request). All admin page components are
 * 'use client' and call verifyRole() on their own data fetches, so the
 * server layout here exists only to set noindex metadata so search
 * engines never index the admin console.
 */
export const metadata: Metadata = {
  title: {
    default: 'Admin — Aerojet Aviation',
    template: '%s | Aerojet Aviation Admin',
  },
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-slate-50">{children}</div>
}