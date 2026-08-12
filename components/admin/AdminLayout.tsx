'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import AdminSidebar from '@/components/admin/AdminSidebar'
import AdminTopbar from '@/components/admin/AdminTopbar'
import AdminUserMenu from '@/components/admin/AdminUserMenu'
import ToastContainer from '@/components/ui/ToastContainer'

interface AdminLayoutProps {
  children: React.ReactNode
  title?: string
  breadcrumb?: string
}

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

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
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

      <AdminSidebar
        sidebarOpen={sidebarOpen}
        mobileOpen={mobileOpen}
        onToggleSidebar={toggleSidebar}
      />

      {/* Main content */}
      <div className={cn('flex flex-1 flex-col transition-all duration-300 ease-in-out', sidebarOpen ? 'lg:ml-64' : 'lg:ml-20')}>
        <AdminTopbar title={title} breadcrumb={breadcrumb} mobileOpen={mobileOpen} onToggleMobile={() => setMobileOpen((p) => !p)} />

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] flex-1 overflow-y-auto bg-slate-50 p-4 admin-scrollbar lg:p-8">
          <div className="mx-auto max-w-[1600px] pb-20">{children}</div>
        </main>
      </div>

      <AdminUserMenu
        userName={userName}
        userRole={userRole}
        userMenuOpen={userMenuOpen}
        settings={settings}
        onToggle={() => setUserMenuOpen((p) => !p)}
        onLogout={handleLogout}
      />

      <ToastContainer />
    </div>
  )
}
