'use client'

import React, { useEffect, useRef } from 'react'
import Link from 'next/link'

import {
  User as UserIcon,
  Settings,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react'

interface AdminUserMenuProps {
  userName: string
  userRole: string
  userMenuOpen: boolean
  settings: Record<string, string>
  onToggle: () => void
  onLogout: () => void
}

export default function AdminUserMenu({ userName, userRole, userMenuOpen, settings, onToggle, onLogout }: AdminUserMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!userMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onToggle()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen, onToggle])

  return (
    <div className="border-t border-slate-100 p-4" ref={menuRef}>
      {userMenuOpen ? (
        <div className="relative">
          <button
            onClick={onToggle}
            className="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-all hover:bg-slate-50"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-aerojet-blue/10 text-xs font-bold uppercase text-aerojet-blue">
                {userName[0]}
              </div>
              <div className="min-w-0">
                <p className="truncate font-bold text-slate-700">{userName}</p>
                <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-600">{userRole || 'Member'}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-slate-500 transition-transform" aria-hidden="true" />
          </button>

          <div className="absolute bottom-full left-0 right-0 z-50 mb-2">
            <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
              <Link href="/admin/my-info" onClick={onToggle} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <UserIcon className="h-4 w-4" aria-hidden="true" /> My Info
              </Link>
              <Link href="/admin/settings" onClick={onToggle} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Settings className="h-4 w-4" aria-hidden="true" /> Settings
              </Link>
              <a href={`mailto:${settings.support_email || 'support@aerojet-aviation.com'}`} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <HelpCircle className="h-4 w-4" aria-hidden="true" /> Help &amp; Support
              </a>
              <hr className="my-2 border-slate-200" />
              <button onClick={onLogout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4" aria-hidden="true" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <button onClick={onLogout} className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition-all hover:bg-red-50 hover:text-red-600" aria-label="Sign out" title="Sign out">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

