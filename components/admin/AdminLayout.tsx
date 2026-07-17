'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Briefcase, 
  Settings, 
  LogOut, 
  ChevronRight, 
  User as UserIcon, 
  Shield, 
  Menu, 
  X,
  FileText,
  LayoutDashboard,
  FolderOpen,
  HelpCircle,
  Share2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import ToastContainer from '@/components/ui/ToastContainer'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumb?: string
}

export default function AdminLayout({ children, title, breadcrumb }: AdminLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false) // Default to closed to prevent mobile blur on mount
  const [isFirstRender, setIsFirstRender] = useState(true)
  const [userName, setUserName] = useState('Admin User')
  const [userRole, setUserRole] = useState('')
  const [settings, setSettings] = useState<Record<string, string>>({
    company_name: 'Staff Portal',
    enterprise_logo_url: '/images/aalogo-TUj_x_h8.png',
    portal_status: 'Portal Online',
    support_email: 'support@aerojet-aviation.com'
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        // Fetch role and name from admin_users
        supabase
          .from('admin_users')
          .select('role, full_name')
          .eq('auth_user_id', session.user.id)
          .maybeSingle()
          .then(({ data }) => {
            if (data) {
              setUserRole(data.role)
              setUserName(data.full_name || session.user.email?.split('@')[0] || 'User')
            } else {
              setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User')
            }
          })
      }
    })

    // Fetch System Settings
    fetch('/api/admin/settings')
      .then(res => res.json())
      .then(({ data }) => {
        if (data) {
          const sMap: Record<string, string> = {}
          data.forEach((s: any) => sMap[s.setting_key] = s.setting_value)
          setSettings(prev => ({ ...prev, ...sMap }))
        }
      })

    // Handle initial sidebar state and window resizing
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true)
      } else {
        setIsSidebarOpen(false)
      }
    }

    if (isFirstRender) {
      handleResize()
      setIsFirstRender(false)
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isFirstRender])

  // Close sidebar on mobile navigation
  useEffect(() => {
    if (window.innerWidth < 1024) {
      setIsSidebarOpen(false)
    }
  }, [pathname])

  const [profileOpen, setProfileOpen] = useState(false)

  const navGroups = [
    {
      label: 'Overview',
      links: [
        { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      ]
    },
    {
      label: 'Recruitment',
      links: [
        { href: '/admin/applications', label: 'Applications', icon: Briefcase },
        { href: '/admin/jobs', label: 'Job Postings', icon: FileText },
        { href: '/admin/talent', label: 'Talent Pipeline', icon: Users },
      ]
    },
    {
      label: 'Company',
      links: [
        { href: '/admin/people', label: 'People', icon: Users },
        { href: '/admin/organization', label: 'Organization', icon: Shield },
      ]
    },
    {
      label: 'Resources',
      links: [
        { href: '/admin/documents', label: 'Documents', icon: FolderOpen },
      ]
    },
  ]

  async function handleLogout() {
     await supabase.auth.signOut()
     router.push('/admin/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-sidebar font-sans">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          ${settings.brand_primary_color ? `--blue: ${settings.brand_primary_color};` : ''}
          ${settings.brand_accent_radius ? `--radius: ${settings.brand_accent_radius}px;` : '--radius: 12px;'}
        }
        
        /* Apply dynamic radius to core components */
        .rounded-xl, .rounded-2xl, .rounded-3xl, .btn, .card {
          border-radius: var(--radius) !important;
        }
      `}} />
      
      {/* Sidebar Overlay (Mobile) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 z-40 bg-black/20 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 0 }}
        className={cn(
          "flex flex-col bg-sidebar transition-all duration-300 ease-in-out shrink-0 h-full overflow-hidden z-50 fixed inset-y-0 left-0 lg:static",
          isSidebarOpen ? "border-r border-sidebar-border" : "border-none"
        )}
      >
        {/* Logo Section */}
        <div className="flex h-14 lg:h-16 items-center border-b border-sidebar-border/50 px-6 overflow-hidden">
          <Link href="/admin/dashboard" className="flex items-center gap-3 w-full">
            <div className="shrink-0 flex items-center justify-start h-12 w-full">
              <img src="/images/aalogo-TUj_x_h8.png" className="h-full w-auto object-contain" alt="Logo" />
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-8 scrollbar-hide">
          {navGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2">
              <AnimatePresence>
                {isSidebarOpen && (
                  <motion.h3 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="px-3 text-[9px] font-bold tracking-[0.2em] text-sidebar-foreground/20 uppercase"
                  >
                    {group.label}
                  </motion.h3>
                )}
              </AnimatePresence>
              <div className="space-y-1">
                {group.links.map((link) => {
                  const isActive = pathname === link.href
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all duration-200 group relative",
                        isActive 
                          ? "bg-sidebar-accent text-sidebar-foreground shadow-sm" 
                          : "text-sidebar-foreground/50 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                      )}
                    >
                      <link.icon size={18} className={cn("shrink-0", isActive ? "text-[#2880b9]" : "")} />
                      <AnimatePresence>
                        {isSidebarOpen && (
                          <motion.span 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            className="text-[13px] font-bold truncate"
                          >
                            {link.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / User Profile with Dropdown */}
        <div className="border-t border-sidebar-border/50 p-4 relative">
          {/* Profile dropdown menu */}
          <AnimatePresence>
            {profileOpen && isSidebarOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-4 right-4 mb-2 bg-[#1e293b] border border-sidebar-border rounded-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
              >
                <div className="p-2 space-y-0.5">
                  <Link
                    href="/admin/my-info"
                    onClick={() => setProfileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      pathname === '/admin/my-info' && "bg-sidebar-accent text-sidebar-foreground"
                    )}
                  >
                    <UserIcon size={16} />
                    <span className="text-[12px] font-semibold">My Info</span>
                  </Link>
                  <Link
                    href="/admin/settings"
                    onClick={() => setProfileOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                      pathname === '/admin/settings' && "bg-sidebar-accent text-sidebar-foreground"
                    )}
                  >
                    <Settings size={16} />
                    <span className="text-[12px] font-semibold">Settings</span>
                  </Link>
                  <a
                    href={`mailto:${settings.support_email || 'support@aerojet-aviation.com'}`}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  >
                    <HelpCircle size={16} />
                    <span className="text-[12px] font-semibold">Help & Support</span>
                  </a>
                </div>
                <div className="border-t border-sidebar-border">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-5 py-3 w-full text-left transition-all text-red-400/70 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut size={16} />
                    <span className="text-[12px] font-semibold">Sign Out</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            onClick={() => isSidebarOpen && setProfileOpen(!profileOpen)}
            className={cn(
              "flex items-center gap-3 bg-sidebar-accent/50 p-3 rounded-xl border border-sidebar-border/50 overflow-hidden w-full text-left transition-all hover:bg-sidebar-accent/80",
              !isSidebarOpen && "opacity-0"
            )}
          >
            <div className="h-9 w-9 shrink-0 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-sm uppercase text-xs">
              {userName[0]}
            </div>
            {isSidebarOpen && (
              <div className="min-w-0 flex-1 ml-1">
                <p className="truncate text-xs font-bold text-sidebar-foreground">{userName}</p>
                <p className="truncate text-[9px] font-bold tracking-widest text-[#2880b9] uppercase">{userRole || 'Member'}</p>
              </div>
            )}
            {isSidebarOpen && (
              <ChevronRight size={14} className={cn(
                "text-sidebar-foreground/30 shrink-0 transition-transform duration-200",
                profileOpen && "rotate-90"
              )} />
            )}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-full">
        <header className="flex h-14 lg:h-16 items-center justify-between px-4 lg:px-8 bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shrink-0">
          <div className="flex items-center gap-3 lg:gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-400 transition-all text-slate-400 hover:text-blue-500"
            >
              <Menu size={20} />
            </button>
            <div>
              <nav className="flex items-center gap-1.5 text-xs font-bold text-slate-400 mb-0.5">
                <span>PORTAL</span>
                <ChevronRight size={10} />
                <span className="text-slate-900 uppercase tracking-widest">{breadcrumb || pathname.split('/').pop()?.replace(/-/g, ' ')}</span>
              </nav>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 uppercase">{title || 'Dashboard'}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-100 shadow-sm">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-bold tracking-widest text-emerald-700 uppercase">{settings.portal_status}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth admin-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-[1600px] mx-auto pb-20"
          >
            {children}
          </motion.div>
        </main>
      </div>
      <ToastContainer />
    </div>
  )
}
