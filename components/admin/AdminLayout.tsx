'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Users,
  Briefcase,
  Settings,
  LogOut,
  ChevronRight,
  ChevronLeft,
  User as UserIcon,
  Shield,
  Menu,
  X,
  FileText,
  LayoutDashboard,
  FolderOpen,
  HelpCircle,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ToastContainer from '@/components/ui/ToastContainer'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumb?: string
}

/**
 * Admin portal shell — matched to the aerojet-aviation AdminShell:
 *   • White sidebar with aerojet-blue brand mark + collapse toggle (w-64 / w-20)
 *   • aerojet-blue/10 active nav state, slate hover
 *   • Light top bar (white/80 blur) with page title + status pill
 *   • White user footer with dropdown (My Info / Settings / Help / Sign Out)
 */
export default function AdminLayout({ children, title, breadcrumb }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [userName, setUserName] = useState('Admin User')
  const [userRole, setUserRole] = useState('')
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: 'Aerojet Aviation',
    portal_status: 'Portal Online',
    support_email: 'support@aerojet-aviation.com',
  })

  useEffect(() => {
    setMounted(true)
    const saved = typeof window !== 'undefined' ? localStorage.getItem('admin-sidebar-open') : null
    if (saved !== null) setSidebarOpen(JSON.parse(saved))

    fetch('/api/auth/me')
      .then((res) => res.json())
      .then(({ user, admin }) => {
        if (admin) {
          setUserRole(admin.role)
          setUserName(admin.full_name || user?.email?.split('@')[0] || 'Admin User')
        } else if (user) {
          setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin User')
        }
      })
      .catch(() => {})

    fetch('/api/admin/settings')
      .then((res) => res.json())
      .then(({ data }) => {
        if (data) {
          const sMap: Record<string, string> = {}
          data.forEach((s: any) => (sMap[s.setting_key] = s.setting_value))
          setSettings((prev) => ({ ...prev, ...sMap }))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (mounted) localStorage.setItem('admin-sidebar-open', JSON.stringify(sidebarOpen))
  }, [sidebarOpen, mounted])

  // Close mobile drawer on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/admin/login')
  }

  const toggleSidebar = () => setSidebarOpen((p) => !p)

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
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
          <Link
            href="/admin/dashboard"
            className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-aerojet-blue"
          >
            <img src="/images/aalogowhite-BCKBvd3h.png" alt="Aerojet" className="h-6 w-6 object-contain" />
          </Link>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="whitespace-nowrap text-xs font-black uppercase tracking-widest text-aerojet-blue">
                Aerojet Careers
              </p>
              <p className="whitespace-nowrap text-[10px] text-slate-400">Recruitment Portal</p>
            </div>
          )}
          {sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="ml-auto hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:block"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
          {!sidebarOpen && (
            <button
              onClick={toggleSidebar}
              className="ml-auto hidden rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 lg:block"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 admin-scrollbar" aria-label="Main navigation">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className={cn(gIdx > 0 && 'mt-6')}>
              {sidebarOpen && (
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {group.label}
                </p>
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
                        isActive
                          ? 'bg-aerojet-blue/10 font-semibold text-aerojet-blue'
                          : 'text-slate-700 hover:bg-slate-50 hover:text-aerojet-blue',
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
              <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Quick Links
              </p>
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

        {/* User footer */}
        <div className="border-t border-slate-100 p-4">
          {sidebarOpen ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen((p) => !p)}
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
                    <p className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      {userRole || 'Member'}
                    </p>
                  </div>
                </div>
                <ChevronRight
                  className={cn('h-4 w-4 shrink-0 text-slate-400 transition-transform', userMenuOpen && 'rotate-90')}
                  aria-hidden="true"
                />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                  <div className="absolute bottom-full left-0 right-0 z-50 mb-2">
                    <div className="rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
                      <Link
                        href="/admin/my-info"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <UserIcon className="h-4 w-4" aria-hidden="true" />
                        My Info
                      </Link>
                      <Link
                        href="/admin/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <Settings className="h-4 w-4" aria-hidden="true" />
                        Settings
                      </Link>
                      <a
                        href={`mailto:${settings.support_email || 'support@aerojet-aviation.com'}`}
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        <HelpCircle className="h-4 w-4" aria-hidden="true" />
                        Help &amp; Support
                      </a>
                      <hr className="my-2 border-slate-200" />
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={handleLogout}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-red-50 hover:text-red-600"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className={cn('flex flex-1 flex-col transition-all duration-300 ease-in-out', sidebarOpen ? 'lg:ml-64' : 'lg:ml-20')}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md lg:px-8">
          <div className="flex items-center gap-3 lg:gap-4">
            <button
              onClick={() => setMobileOpen((p) => !p)}
              className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 transition-all hover:bg-slate-100 lg:hidden"
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              {breadcrumb && (
                <nav className="mb-0.5 flex items-center gap-1.5 text-[11px] font-bold text-slate-400">
                  <span className="uppercase tracking-widest">Portal</span>
                  <ChevronRight size={10} />
                  <span className="uppercase tracking-widest text-slate-700">
                    {breadcrumb}
                  </span>
                </nav>
              )}
              <h1 className="text-xl font-bold uppercase tracking-tight text-slate-900">{title || 'Dashboard'}</h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 shadow-sm sm:flex">
              <div className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-700">
                {settings.portal_status}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] flex-1 overflow-y-auto bg-slate-50 p-4 admin-scrollbar lg:p-8">
          <div className="mx-auto max-w-[1600px] pb-20">{children}</div>
        </main>
      </div>

      <ToastContainer />
    </div>
  )
}
