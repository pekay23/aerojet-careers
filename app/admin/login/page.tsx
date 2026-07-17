import React, { Suspense, lazy } from 'react'

const LoginClient = lazy(() => import('./LoginClient'))

export const dynamic = 'force-dynamic'

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-8">
        <div className="w-10 h-10 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mb-4" />
        <div className="text-xs text-slate-400 animate-pulse">Loading…</div>
      </div>
    }>
      <LoginClient />
    </Suspense>
  )
}
