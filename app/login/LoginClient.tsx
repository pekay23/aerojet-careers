'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[var(--navy)] p-12 lg:flex lg:w-[45%] xl:w-[40%]">
        <div className="absolute inset-0 bg-[var(--gradient-brand)]" />

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
          <p className="mt-6 max-w-sm font-sans leading-relaxed text-white/60">
            Access the staff dashboard to manage vacancies, applications, and the talent pipeline.
          </p>
        </div>

        <p className="relative z-10 text-[10px] uppercase tracking-widest text-white/40">
          &copy; {new Date().getFullYear()} Aerojet Aviation. All rights reserved.
        </p>
      </div>

      {/* Right form panel */}
      <div className="relative flex min-h-screen flex-1 flex-col bg-[var(--background)]">
        {/* Mobile header */}
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--card)] p-4 lg:hidden">
          <Link href="/" className="block h-8 w-32">
            <img
              src="/logos/logo-navbar.png"
              alt="Aerojet Aviation"
              className="h-full w-auto object-contain object-left"
            />
          </Link>
          <Link
            href="/"
            className="text-xs font-bold text-[var(--muted-foreground)] transition-colors hover:text-[var(--navy)]"
          >
            &larr; Back to site
          </Link>
        </div>

        {/* Form area */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-xl">
            <div className="mb-8">
              <h2 className="font-display text-2xl font-black uppercase tracking-tight text-[var(--navy)] sm:text-3xl">
                Welcome Back
              </h2>
              <p className="mt-2 font-sans text-base text-[var(--muted-foreground)]">
                Sign in to your portal account.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="form-card">
              {error && (
                <div className="rounded-lg border border-[var(--danger)] bg-[var(--danger-soft)] p-4 text-sm text-[var(--danger)]">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div>
                  <label
                    className="mb-2 block text-sm font-bold text-[var(--foreground)]"
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
                    className="field-input"
                    placeholder="admin@aerojet-aviation.com"
                  />
                </div>

                <div>
                  <label
                    className="mb-2 block text-sm font-bold text-[var(--foreground)]"
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
                    className="field-input"
                    placeholder="&bull;&bull;&bull;&bull;&bull;&bull;&bull;&bull;"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-blue w-full mt-6"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--border)] p-6 text-center">
          <p className="text-[10px] uppercase tracking-widest text-[var(--muted-foreground)]">
            &copy; {new Date().getFullYear()} Aerojet Aviation &middot; Staff Portal
          </p>
        </div>
      </div>
    </div>
  )
}
