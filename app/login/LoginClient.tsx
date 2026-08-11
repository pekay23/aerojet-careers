'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/**
 * Split-screen login, matching the aerojet-aviation portal shell:
 *   • Left navy branding panel (hidden on mobile) with logo + heading
 *   • Right light form panel with the sign-in card
 *
 * Auth logic is unchanged from before: `supabase.signInWithPassword` is the
 * Neon-backed shim that posts to /api/auth/login and sets the session cookie.
 */
export default function LoginClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const redirectTo = searchParams.get('redirect') || '/admin/dashboard'

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      await router.push(redirectTo)
    } catch {
      setError('Connection failure: Unable to connect to our server.')
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left branding panel — hidden on mobile */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-aerojet-blue p-12 lg:flex lg:w-[45%] xl:w-[40%]">
        <div className="absolute inset-0 bg-linear-to-br from-aerojet-blue via-[#003a7c] to-[#001a3c]" />

        <div className="relative z-10">
          <Link href="/" className="mb-20 block h-10 w-40">
            <img
              src="/logos/logo-footer.png"
              alt="Aerojet Aviation"
              className="h-full w-auto object-contain object-left"
            />
          </Link>
          <h1 className="font-display max-w-md text-4xl font-black uppercase leading-[1.05] tracking-tight text-white xl:text-5xl">
            Careers Portal
          </h1>
          <p className="mt-6 max-w-sm font-sans leading-relaxed text-blue-100/60">
            Access the staff dashboard to manage vacancies, applications, and the talent pipeline.
          </p>
        </div>

        <p className="relative z-10 text-[10px] uppercase tracking-widest text-blue-100/40">
          &copy; {new Date().getFullYear()} Aerojet Aviation. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="relative flex min-h-screen flex-1 flex-col bg-slate-50">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white p-4 lg:hidden">
          <Link href="/" className="block h-8 w-32">
            <img
              src="/logos/logo-navbar.png"
              alt="Aerojet Aviation"
              className="h-full w-auto object-contain object-left"
            />
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-slate-400 transition-colors hover:text-slate-600"
          >
            ← Back to site
          </Link>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-xl">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-aero-blue sm:text-3xl">
                Welcome Back
              </h2>
              <p className="mt-2 font-sans text-base text-slate-500">
                Sign in to your portal account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label
                    className="mb-2 block text-sm font-bold text-slate-700"
                    htmlFor="email"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all hover:border-slate-300 focus:ring-4 focus:ring-aerojet-blue/10"
                    placeholder="admin@aerojet-aviation.com"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-bold text-slate-700"
                    htmlFor="password"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition-all hover:border-slate-300 focus:ring-4 focus:ring-aerojet-blue/10"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-aerojet-blue px-4 py-3.5 text-sm font-black uppercase tracking-widest text-white shadow-lg shadow-aerojet-blue/20 transition-all hover:-translate-y-0.5 hover:bg-[#003a7c] hover:shadow-xl hover:shadow-aerojet-blue/30 active:translate-y-0 disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-100 p-6 text-center">
          <p className="text-[10px] uppercase tracking-widest text-slate-400">
            &copy; {new Date().getFullYear()} Aerojet Aviation &middot; Staff Portal
          </p>
        </div>
      </div>
    </div>
  )
}
