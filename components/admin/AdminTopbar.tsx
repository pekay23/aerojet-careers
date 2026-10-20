'use client'

import React from 'react'
import { Menu, X, ChevronRight } from 'lucide-react'

interface AdminTopbarProps {
  title?: string
  breadcrumb?: string
  mobileOpen: boolean
  onToggleMobile: () => void
}

export default function AdminTopbar({ title, breadcrumb, mobileOpen, onToggleMobile }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md lg:px-8">
      <div className="flex items-center gap-3 lg:gap-4">
        <button
          onClick={onToggleMobile}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-slate-100 lg:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <div>
          {breadcrumb && (
            <nav className="mb-0.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
              <span className="uppercase tracking-widest">Portal</span>
              <ChevronRight size={10} />
              <span className="uppercase tracking-widest text-slate-700">{breadcrumb}</span>
            </nav>
          )}
          <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">{title || 'Dashboard'}</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 shadow-sm sm:flex">
          <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">Operational</span>
        </div>
      </div>
    </header>
  )
}
