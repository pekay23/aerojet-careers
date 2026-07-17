'use client'
import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Application } from '@/types'
import AdminLayout from '@/components/admin/AdminLayout'
import { 
  Trash2, 
  ArrowRight, 
  Layers, 
  Table as TableIcon, 
  Download, 
  Plus, 
  Zap,
  Clock,
  CheckCircle2,
  Filter
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { StatusPill } from '@/components/ui/StatusPill'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/lib/utils'
import PipelineView from '@/components/admin/PipelineView'
import SelectionHUD from '@/components/admin/SelectionHUD'
import { toast } from '@/lib/toast'

const STATUSES = ['new','under_review','shortlisted','interview','offer','hired','rejected','transferred_to_hr']

export default function ApplicationsPage() {
  const router = useRouter()
  const [apps,      setApps]      = useState<Application[]>([])
  const [total,     setTotal]     = useState(0)
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [status,    setStatus]    = useState('')
  const [page,      setPage]      = useState(1)
  const [selected,  setSelected]  = useState<string[]>([])
  const [updating,  setUpdating]  = useState<string | null>(null)
  
  // High-End UI State
  const [viewMode, setViewMode] = useState<'list' | 'pipeline'>('list')
  const [stats, setStats] = useState({ total: 0, new: 0, velocity: 0, pending: 0 })

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('view=pipeline')) {
      setTimeout(() => {
        setViewMode('pipeline')
        window.history.replaceState({}, document.title, window.location.pathname)
      }, 100)
    }
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: '25' })
    if (search) params.set('search', search)
    if (status) params.set('status', status)
    const r = await fetch(`/api/admin/applications?${params}`)
    const d = await r.json()
    setApps(d.data?.data || [])
    setTotal(d.data?.total || 0)
    setLoading(false)
  }, [page, search, status])

  const loadStats = useCallback(async () => {
    const r = await fetch('/api/admin/applications/stats')
    const { data } = await r.json()
    if (data) setStats(data)
  }, [])

  useEffect(() => { 
    load()
    loadStats()
  }, [load, loadStats])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 400)
    return () => clearTimeout(t)
  }, [search]) // eslint-disable-line

  const updateStatus = async (id: string, newStatus: string) => {
    setUpdating(id)
    await fetch('/api/admin/applications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    await load()
    setUpdating(null)
  }

  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    const checkRole = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: adminUser } = await supabase
          .from('admin_users')
          .select('role')
          .eq('auth_user_id', user.id)
          .maybeSingle()
        setUserRole(adminUser?.role || 'employee')
      }
    }
    checkRole()
  }, [])

  const handleDelete = async (a: Application) => {
    const isManager = userRole === 'recruiter'
    const actionName = isManager ? 'archive' : 'PERMANENTLY delete'
    const confirmMsg = `Are you sure you want to ${actionName} the application for ${a.first_name} ${a.last_name}?`
    
    if (!confirm(confirmMsg)) return
    
    try {
      const res = await fetch(`/api/admin/applications?id=${a.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to delete')
      load()
      loadStats()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const handleBatchStatus = async (newStatus: string) => {
    if (!confirm(`Move ${selected.length} applications to stage: ${newStatus.toUpperCase()}?`)) return
    setUpdating('batch')
    try {
      const promises = selected.map(id => 
        fetch('/api/admin/applications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, status: newStatus }),
        })
      )
      await Promise.all(promises)
      await load()
      await loadStats()
      setSelected([])
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const handleBatchDelete = async () => {
    if (!confirm(`Are you sure you want to archive ${selected.length} applications?`)) return
    setUpdating('batch')
    try {
      const promises = selected.map(id => fetch(`/api/admin/applications?id=${id}`, { method: 'DELETE' }))
      await Promise.all(promises)
      await load()
      await loadStats()
      setSelected([])
    } catch (err: any) {
      alert(err.message)
    } finally {
      setUpdating(null)
    }
  }

  const exportCSV = () => {
    const rows = [
      ['Ref','First Name','Last Name','Email','Phone','Nationality','Country','Role','Status','Submitted'],
      ...apps.map(a => [
        a.ref_code, a.first_name, a.last_name, a.email, a.phone,
        a.nationality, a.country_of_residence, a.job_title || 'General',
        a.status, new Date(a.created_at).toLocaleDateString('en-GB'),
      ]),
    ]
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const a   = document.createElement('a')
    a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }))
    a.download = `aerojet-applications-${new Date().toISOString().slice(0,10)}.csv`
    a.click()
  }

  const totalPages = Math.ceil(total / 25)

  return (
    <AdminLayout title="Applications">
      <div className="space-y-8 pb-32">
        
        {/* Intelligence Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
           {[
             { label: 'Total Applicants', value: stats.total, icon: Layers, color: 'blue', desc: 'Active records' },
             { label: 'New Applications', value: stats.new, icon: Zap, color: 'emerald', desc: 'Awaiting review' },
             { label: 'Recent Progress', value: stats.velocity, icon: CheckCircle2, color: 'indigo', desc: 'Processed last 7d' },
             { label: 'Pending Tasks', value: stats.pending, icon: Clock, color: 'red', desc: 'Awaiting action > 3d' },
           ].map((stat, i) => (
             <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm group hover:border-blue-200 transition-all flex items-start justify-between">
                <div className="space-y-1">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{stat.label}</p>
                   <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                   <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">{stat.desc}</p>
                </div>
                <div className={cn("p-3 rounded-xl transition-all shadow-lg shadow-black/5", 
                  stat.color === 'blue' ? "bg-blue-50 text-blue-600" :
                  stat.color === 'emerald' ? "bg-emerald-50 text-emerald-600" :
                  stat.color === 'indigo' ? "bg-indigo-50 text-indigo-600" : "bg-red-50 text-red-600"
                )}>
                   <stat.icon size={20} />
                </div>
             </div>
           ))}
        </div>

        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col font-medium">
          
          {/* Toolbar */}
          <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center bg-slate-50/50">
            
            {/* View Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
               <button 
                 onClick={() => setViewMode('list')}
                 className={cn("px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.2em] rounded-xl transition-all flex items-center gap-2", viewMode === 'list' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
               >
                  <TableIcon size={14} /> List View
               </button>
               <button 
                 onClick={() => setViewMode('pipeline')}
                 className={cn("px-4 py-2 text-[9px] font-extrabold uppercase tracking-[0.2em] rounded-xl transition-all flex items-center gap-2", viewMode === 'pipeline' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600")}
               >
                  <Layers size={14} /> Selection Process
               </button>
            </div>

            <div className="relative flex-1 w-full max-w-sm group">
              <input
                type="text" 
                placeholder="Search candidates…"
                value={search} 
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-6 pr-6 py-2.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-300"
              />
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl">
               <Filter size={14} className="text-slate-400" />
               <select 
                 value={status} 
                 onChange={e => { setStatus(e.target.value); setPage(1) }} 
                 className="bg-transparent border-none focus:ring-0 text-[10px] font-bold uppercase tracking-widest text-slate-800 cursor-pointer min-w-[120px] appearance-none"
               >
                 <option value="">All Stages</option>
                 {STATUSES.map(s => (
                   <option key={s} value={s}>{s.replace(/_/g, ' ').toUpperCase()}</option>
                 ))}
               </select>
            </div>

            <div className="flex items-center gap-3 md:ml-auto">
              <button 
                onClick={exportCSV} 
                className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
                title="Export Visible Results"
              >
                <Download size={18} />
              </button>
              <button 
                onClick={load}      
                className="px-6 py-2.5 bg-slate-900 text-white text-[10px] font-bold uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-sm"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Table / Pipeline Toggle */}
          {viewMode === 'pipeline' ? (
            <PipelineView 
              apps={apps} 
              loading={loading} 
              onSelect={(a) => router.push(`/admin/applications/${a.id}`)} 
            />
          ) : (
            <>
              {/* List Table */}
              {loading ? (
                <div className="py-24 flex flex-col items-center justify-center space-y-4">
                   <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Updating Selection Process…</p>
                </div>
              ) : apps.length === 0 ? (
                <div className="py-20">
                  <EmptyState message="No current registrations match your criteria." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50">
                        <th className="px-4 lg:px-8 py-4 lg:py-5 border-b border-slate-100 w-12 text-center">
                          <input 
                            type="checkbox" 
                            onChange={e => setSelected(e.target.checked ? apps.map(a => a.id) : [])} 
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                          />
                        </th>
                        {['Applicant','Role','Profile','Status','Submitted','Actions'].map(h => (
                          <th key={h} className="px-4 lg:px-8 py-4 lg:py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-bold">
                      {apps.map(a => (
                        <tr 
                          key={a.id} 
                          onClick={() => router.push(`/admin/applications/${a.id}`)}
                          className="hover:bg-slate-50/50 transition-colors group/row cursor-pointer"
                        >
                          <td className="px-4 lg:px-8 py-4 lg:py-6 text-center" onClick={e => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={selected.includes(a.id)} 
                              onChange={e => setSelected(p => e.target.checked ? [...p, a.id] : p.filter(x => x !== a.id))} 
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                            />
                          </td>
                          <td className="px-4 lg:px-8 py-4 lg:py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-900 group-hover/row:text-blue-600 transition-colors uppercase tracking-tight">{a.first_name} {a.last_name}</span>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{a.email}</span>
                              <span className="text-[9px] font-bold text-blue-400 uppercase tracking-tighter mt-0.5">{a.ref_code}</span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-8 py-4 lg:py-6 max-w-[180px]">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-900 uppercase tracking-tight truncate">{a.job_title || 'General Application'}</span>
                              <span className="text-[9px] font-bold text-slate-300 uppercase truncate">{a.qualifications?.licence_type}</span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-8 py-4 lg:py-6">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-widest">{a.nationality}</span>
                              <span className="text-[9px] font-bold text-slate-300 uppercase truncate">{a.experience?.total_years_exp || '0'} YRS EXP</span>
                            </div>
                          </td>
                          <td className="px-4 lg:px-8 py-4 lg:py-6">
                            <StatusPill status={a.status} />
                          </td>
                          <td className="px-4 lg:px-8 py-4 lg:py-6">
                             <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
                               <Clock size={12} className="text-slate-200" />
                               {new Date(a.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                            </div>
                          </td>
                          <td className="px-4 lg:px-8 py-4 lg:py-6">
                             <div className="flex items-center gap-2">
                                <button 
                                  className="p-3 bg-slate-100 text-slate-400 rounded-xl group-hover/row:bg-blue-600 group-hover/row:text-white transition-all"
                                >
                                   <ArrowRight size={16} strokeWidth={3} />
                                </button>
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Showing {((page - 1) * 25) + 1} to {Math.min(page * 25, total)} of {total} entries
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setPage(p => Math.max(1, p - 1))} 
                      disabled={page === 1} 
                      className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-400 disabled:opacity-30 hover:text-slate-900 transition-all font-sans"
                    >
                      ← Previous
                    </button>
                    <button 
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                      disabled={page === totalPages} 
                      className="px-6 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-blue-600 disabled:opacity-30 hover:border-blue-400 transition-all font-sans"
                    >
                      Next Page →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <SelectionHUD 
          selectedCount={selected.length}
          onClear={() => setSelected([])}
          onBatchStatus={handleBatchStatus}
          onBatchDelete={handleBatchDelete}
          onBatchExport={() => {
            toast.success(`Exporting ${selected.length} entries...`)
          }}
        />
      </div>
    </AdminLayout>
  )
}
