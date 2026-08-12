'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  Users,
  Shield,
  FolderOpen,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSidebarProps {
  sidebarOpen: boolean
  mobileOpen: boolean
  onToggleSidebar: () => void
}

const navGroups = [
  {
    label: 'Overview',
    links: [{ href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Recruitment',
    links: [
      { href: '/admin/applications', label: 'Applications', icon: Briefcase },
      { href: '/admin/jobs', label: 'Job Postings', icon: FileText },
      { href: '/admin/talent', label: 'Talent Pipeline', icon: Users },
    ],
  },
  {
    label: 'Company',
    links: [
      { href: '/admin/people', label: 'People', icon: Users },
      { href: '/admin/organization', label: 'Organization', icon: Shield },
    ],
  },
  {
    label: 'Resources',
    links: [{ href: '/admin/documents', label: 'Documents', icon: FolderOpen }],
  },
]

export default function AdminSidebar({ sidebarOpen, mobileOpen, onToggleSidebar }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200 bg-white transition-all duration-300 ease-in-out',
        sidebarOpen ? 'w-64' : 'w-20',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
      aria-label="Admin navigation"
    >
      {/* Logo */}
      <div
        className={cn(
          'flex h-16 items-center gap-3 border-b border-slate-100 px-4 transition-all duration-300',
          sidebarOpen ? 'justify-start' : 'justify-center'
        )}
      >
        <Link href="/admin/dashboard" className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-aerojet-blue">
          <img src="/images/aalogowhite-BCKBvd3h.png" alt="Aerojet" className="h-6 w-6 object-contain" />
        </Link>
        {sidebarOpen && (
          <div className="overflow-hidden">
            <p className="whitespace-nowrap text-xs font-black uppercase tracking-widest text-aerojet-blue">Aerojet Careers</p>
            <p className="whitespace-nowrap text-[10px] text-slate-400">Recruitment Portal</p>
          </div>
        )}
        {sidebarOpen && (
          <button onClick={onToggleSidebar} className="ml-auto hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:block" aria-label="Collapse sidebar">
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
        {!sidebarOpen && (
          <button onClick={onToggleSidebar} className="ml-auto hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:block" aria-label="Expand sidebar">
            <ChevronRight className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 admin-scrollbar" aria-label="Main navigation">
        {navGroups.map((group, gIdx) => (
          <div key={gIdx} className={cn(gIdx > 0 && 'mt-6')}>
            {sidebarOpen && (
              <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{group.label}</p>
            )}
            <div className="space-y-1">
              {group.links.map((link) => {
                const isActive = pathname === link.href
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    title={!sidebarOpen ? link.label : undefined}
                    className={cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive ? 'bg-aerojet-blue/10 font-semibold text-aerojet-blue' : 'text-slate-700 hover:bg-slate-50 hover:text-aerojet-blue',
                      !sidebarOpen && 'justify-center'
                    )}
                  >
                    <link.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {sidebarOpen && <span className="truncate">{link.label}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}

        <div className="mt-8">
          {sidebarOpen && (
            <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">Quick Links</p>
          )}
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            title={!sidebarOpen ? 'View Public Site' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700',
              !sidebarOpen && 'justify-center'
            )}
          >
            <ExternalLink className="h-4 w-4 shrink-0" aria-hidden="true" />
            {sidebarOpen && <span>View Public Site</span>}
          </a>
        </div>
      </nav>
    </aside>
  )
}

