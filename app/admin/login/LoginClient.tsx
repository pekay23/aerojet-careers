'use client'

import { FormEvent, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Lock, Mail, ChevronRight, AlertCircle, Loader2 } from 'lucide-react'

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
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      router.push(redirectTo)
      router.refresh()
    } catch {
      setError('Connection failure: Unable to connect to our server.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 font-medium">

      <div className="w-full max-w-[420px] relative">
        {/* Branding Container */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 bg-white rounded-2xl shadow-sm border border-slate-100 mb-6">
            <img
              src="/images/aalogo-TUj_x_h8.png"
              alt="Aerojet Aviation"
              className="h-8 w-auto"
            />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Staff Portal
          </h1>
          <p className="mt-2 text-xs font-medium text-slate-400">
            Sign in with your admin credentials
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Email Address</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                  <Mail size={18} />
                </div>
                <input
                  id="email"
                  type="email"
                  placeholder="name@aerojet-aviation.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider ml-1">Password</label>
              </div>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:border-blue-500 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all placeholder:text-slate-300"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-3.5 bg-red-50 border border-red-100 rounded-xl text-red-600 text-xs font-medium">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Sign In
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-[11px] text-slate-400">
            &copy; {new Date().getFullYear()} Aerojet Aviation &middot; Staff Portal
          </p>
        </div>
      </div>
    </div>
  )
}
