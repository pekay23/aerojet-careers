'use client'

import React, { useState, useEffect } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import OrgChart from '@/components/admin/OrgChart'
import BudgetManager from '@/components/admin/BudgetManager'
import {
  Network,
  DollarSign,
  Zap,
  Lock,
  ArrowRight,
  Info,
  Building2,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function OrganizationPage() {
  const [activeView, setActiveView] = useState<'chart' | 'budget'>('chart')
  const [stats, setStats] = useState({ totalStaff: 0, totalBudget: 0, deptCount: 0 })
  const [initializing, setInitializing] = useState(false)
  const [userRole, setUserRole] = useState<string | null>(null)

  const fetchStats = async () => {
    // We could fetch real aggregated stats here
    const r = await fetch('/api/admin/departments')
    const { data } = await r.json()
    if (data) {
      setStats({
        totalStaff: 0, // Should come from people API
        totalBudget: data.reduce((acc: number, d: any) => acc + (d.current_budget || 0), 0),
        deptCount: data.length
      })
    }
  }

  const fetchUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me')
      const { user, admin } = await res.json()
      if (admin) {
        setUserRole(admin.role)
      } else if (user) {
        setUserRole('employee')
      }
    } catch {
      setUserRole('employee')
    }
  }

  useEffect(() => {
    fetchStats()
    fetchUserRole()
  }, [])

  const handleAutoInit = async () => {
    if (!confirm("This will link all existing staff members to the primary administrator as a starting point. Proceed?")) return
    
    setInitializing(true)
    try {
      const staffRes = await fetch('/api/admin/people')
      const { data: staff } = await staffRes.json()
      
      const admin = staff.find((s: any) => s.role === 'admin' || s.role === 'super_admin')
      if (!admin) {
        alert("No administrator found to act as CEO.")
        return
      }

      // Update everyone who doesn't have a manager
      for (const member of staff) {
        if (member.auth_user_id !== admin.auth_user_id) {
          await fetch('/api/admin/organization', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              staffId: member.auth_user_id,
              reportsTo: admin.auth_user_id
            })
          })
        }
      }
      window.location.reload()
    } finally {
      setInitializing(false)
    }
  }

  return (
    <AdminLayout title="Team Structure">
      <div className="space-y-10">
        
        {/* Modern Header */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-2xl shadow-slate-200/40 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-5">
              <Building2 size={240} className="text-slate-900" />
           </div>
           
           <div className="space-y-6 relative z-10">
              <div className="flex items-center gap-3">
                 <span className="px-3 py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg uppercase tracking-widest shadow-lg shadow-blue-500/30">Enterprise v2.0</span>
                  <h2 className="text-[10px] font-bold tracking-[0.4em] text-slate-500 uppercase">Aerojet Aviation Group</h2>
              </div>
              <div>
                 <h1 className="text-6xl font-black text-slate-900 tracking-tighter uppercase leading-[0.9]">Organizational<br/><span className="text-blue-600">Structure</span></h1>
                  <p className="mt-6 text-sm font-bold text-slate-500 max-w-sm leading-relaxed uppercase tracking-tight">
                    Dynamic visualization of reporting hierarchies and real-time departmental resource allocation.
                 </p>
              </div>
           </div>
           
           <div className="flex flex-wrap gap-4 relative z-10 w-full xl:w-auto">
              {[
                { label: 'Units', value: stats.deptCount, icon: Network, color: 'blue' },
                { label: 'Budget Cap', value: `$${(stats.totalBudget/1000).toFixed(0)}k`, icon: DollarSign, color: 'emerald' },
              ].map((stat, i) => (
                <div key={i} className="flex-1 min-w-[160px] bg-slate-50 border border-slate-100 px-8 py-6 rounded-3xl flex items-center gap-6 group hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                   <div className={cn(
                     "h-12 w-12 rounded-2xl flex items-center justify-center transition-all",
                     stat.color === 'blue' ? "bg-blue-600 text-white shadow-lg shadow-blue-200" : "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                   )}>
                      <stat.icon size={20} />
                   </div>
                   <div>
                       <p className="text-[10px] font-bold tracking-widest text-slate-500 uppercase mb-0.5">{stat.label}</p>
                      <p className="text-xl font-bold text-slate-900 tracking-tight">{stat.value}</p>
                   </div>
                </div>
              ))}
           </div>
        </div>

        {/* View Switcher Controls */}
        <div className="flex items-center justify-between gap-4">
           <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
              <button 
                onClick={() => setActiveView('chart')}
                className={cn(
                  "px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3",
                   activeView === 'chart' ? "bg-slate-900 text-white shadow-xl" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Network size={16} />
                Hierarchy Chart
              </button>
              <button 
                onClick={() => setActiveView('budget')}
                className={cn(
                  "px-8 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-3",
                   activeView === 'budget' ? "bg-slate-900 text-white shadow-xl" : "text-slate-500 hover:text-slate-900"
                )}
              >
                <DollarSign size={16} />
                Budget & Tracking
              </button>
           </div>

           <div className="flex items-center gap-3">
              {(userRole === 'admin' || userRole === 'hr_manager') && (
                <button 
                  onClick={handleAutoInit}
                  disabled={initializing}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-400 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-sm"
                  title="Populate reporting lines from existing database"
                >
                  <RefreshCw size={14} className={initializing ? "animate-spin" : ""} />
                  Initialize Flow
                </button>
              )}
           </div>
        </div>

        {/* Content Area */}
        <div className="min-h-[600px] animate-in fade-in duration-500">
          {activeView === 'chart' ? (
            <div className="space-y-6">
               <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex items-start gap-4">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                     <Info size={20} />
                  </div>
                  <div>
                     <h4 className="text-sm font-bold text-blue-900 uppercase tracking-tight">Interactive Visualizer</h4>
                      <p className="text-xs font-bold text-blue-800 leading-relaxed uppercase mt-1">
                        Use the handles to update reporting relationships. All changes are persisted in real-time to the Aerojet ERP dataset.
                     </p>
                  </div>
               </div>
               <OrgChart />
            </div>
          ) : (
            <BudgetManager userRole={userRole} />
          )}
        </div>

      </div>
    </AdminLayout>
  )
}
