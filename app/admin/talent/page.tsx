'use client'
import { useEffect, useState, useCallback } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { EmptyState } from '@/components/ui/EmptyState'
import { 
  Search, 
  Download, 
  Mail, 
  User, 
  Users, 
  Clock, 
  Globe, 
  Briefcase,
  ChevronLeft,
  ChevronRight,
  Filter,
  Trash2,
  Zap,
  RotateCcw
} from 'lucide-react'
import TalentDetailDrawer from '@/components/admin/TalentDetailDrawer'
import FastTrackModal from '@/components/admin/FastTrackModal'

export default function TalentPoolPage() {
  const [talents,  setTalents]  = useState<any[]>([])
  const [total,    setTotal]    = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [search,   setSearch]   = useState('')
  const [dept,     setDept]     = useState('all')
  const [page,     setPage]     = useState(1)
  const limit = 25

  // UI State
  const [selectedTalent, setSelectedTalent] = useState<any | null>(null)
  const [showDrawer, setShowDrawer] = useState(false)
  const [showFastTrack, setShowFastTrack] = useState(false)
  const [officialDepts, setOfficialDepts] = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    if (dept !== 'all') params.set('dept', dept)
    try {
      const r = await fetch(`/api/admin/talent?${params}`)
      const d = await r.json()
      setTalents(d.data?.data || [])
      setTotal(d.data?.total || 0)
    } catch (e) {
      console.error('Failed to load talent pool', e)
    } finally {
      setLoading(false)
    }
  }, [page, search, dept])

  useEffect(() => {
    fetch('/api/admin/metadata')
      .then(r => r.json())
      .then(({ data }) => setOfficialDepts(data?.departments || []))
  }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove "${name}" from the talent pool?`)) return
    
    try {
      const res = await fetch(`/api/admin/talent?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      load()
    } catch (err: any) {
      alert(err.message)
    }
  }

  useEffect(() => { load() }, [load])

  // Debounce search/filter
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); load() }, 400)
    return () => clearTimeout(t)
  }, [search, dept])  

  const handleExportCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Phone', 'Nationality', 'Experience', 'Job Title', 'Interests', 'Date Registered']
    const rows = talents.map(t => [
      t.first_name, 
      t.last_name, 
      t.email, 
      t.phone || 'N/A', 
      t.nationality, 
      t.years_experience || '0', 
      t.current_job_title || 'N/A',
      (t.departments_interest || []).join('; '),
      new Date(t.created_at).toLocaleDateString()
    ])
    
    const csvContent = [headers, ...rows].map(e => e.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `aerojet-talent-pool-${new Date().toISOString().slice(0,10)}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <AdminLayout title="Staff & Candidates">
      <div className="space-y-6">
        
        {/* Header Actions */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
           <div className="relative flex-1 w-full max-w-sm group">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-600 group-focus-within:text-blue-500 transition-colors">
              <Search size={18} strokeWidth={2.5} />
            </div>
            <input
              type="text" 
              placeholder="Search by name or email…"
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-bold text-slate-900 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all placeholder:text-slate-500 shadow-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
             <div className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-2xl shadow-sm">
                <Filter size={14} className="text-slate-600" />
                <select 
                  className="bg-transparent border-none focus:ring-0 text-[10px] font-bold uppercase tracking-widest text-slate-600 cursor-pointer min-w-[120px]"
                  value={dept}
                  onChange={e => setDept(e.target.value)}
                >
                   <option value="all">All Interests</option>
                   {officialDepts.map(d => (
                      <option key={d.code} value={d.name}>{d.name.toUpperCase()}</option>
                    ))}
                </select>
             </div>
             <button 
               onClick={load}
               className="p-3.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 hover:text-slate-800 transition-all shadow-sm group"
               title="Refresh Data"
             >
                <div className="group-active:rotate-180 transition-transform duration-500"><RotateCcw size={18} /></div>
             </button>
              <button 
                onClick={handleExportCSV}
                className="px-6 py-3.5 bg-slate-100 text-slate-900 border border-slate-200 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-all shadow-sm flex-1 md:flex-none"
              >
                 Export List
              </button>
          </div>
        </div>

        {/* Content Table */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-4">
               <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest animate-pulse">Accessing Records…</p>
            </div>
          ) : talents.length === 0 ? (
            <div className="py-20">
              <EmptyState message={search ? "No candidates found matching your search." : "The talent pool is currently empty."} />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100/50">
                     <th scope="col" className="px-4 lg:px-8 py-3 lg:py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100">Candidate</th>
                     <th scope="col" className="px-4 lg:px-8 py-3 lg:py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100">Interests</th>
                     <th scope="col" className="px-4 lg:px-8 py-3 lg:py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100">Location</th>
                     <th scope="col" className="px-4 lg:px-8 py-3 lg:py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100">Experience</th>
                     <th scope="col" className="px-4 lg:px-8 py-3 lg:py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100">Date Registered</th>
                     <th scope="col" className="px-4 lg:px-8 py-3 lg:py-5 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-100 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {talents.map(t => (
                    <tr 
                      key={t.id} 
                      onClick={() => { setSelectedTalent(t); setShowDrawer(true); }}
                      className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-4 lg:px-8 py-4 lg:py-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 font-bold group-hover:from-blue-600 group-hover:to-blue-700 group-hover:text-white transition-all shadow-sm">
                            <User size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{t.first_name} {t.last_name}</span>
                            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                              <Mail size={12} className="text-blue-400" />
                              {t.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                          {(t.departments_interest || []).slice(0, 2).map((d: string) => (
                            <span key={d} className="px-3 py-1 bg-blue-50 text-blue-600 text-[9px] font-bold rounded-full uppercase tracking-widest border border-blue-100/50">
                              {d}
                            </span>
                          ))}
                          {t.departments_interest?.length > 2 && (
                            <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[9px] font-bold rounded-full uppercase tracking-widest">
                              +{t.departments_interest.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-8 py-4 lg:py-6">
                        <div className="flex flex-col">
                           <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                             <Globe size={12} className="text-emerald-500" />
                             {t.nationality || 'Unknown'}
                           </span>
                           <span className="text-[9px] font-bold text-slate-600 uppercase mt-0.5 ml-5">{t.country || 'Not Specified'}</span>
                        </div>
                      </td>
                      <td className="px-4 lg:px-8 py-4 lg:py-6">
                        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                          <Briefcase size={12} className="text-blue-400" />
                          {t.years_experience || '—'}
                        </span>
                      </td>
                      <td className="px-4 lg:px-8 py-4 lg:py-6">
                        <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-600 uppercase tracking-widest">
                          <Clock size={14} className="text-slate-500" />
                          {new Date(t.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td className="px-4 lg:px-8 py-4 lg:py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {t.cv_path ? (
                            <a 
                              href={`/api/admin/download?path=${encodeURIComponent(t.cv_path)}&bucket=application-documents`}
                              className="p-3 bg-white border border-slate-100 text-blue-600 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all flex items-center gap-2"
                              title="Download CV"
                            >
                               <Download size={18} strokeWidth={2.5} />
                               <span className="text-[10px] font-bold uppercase tracking-widest pr-1 hidden xl:inline">CV</span>
                            </a>
                          ) : (
                            <div className="px-4 py-2 bg-slate-50 text-slate-500 text-[9px] font-bold rounded-xl border border-slate-100 uppercase tracking-widest">
                               No CV
                            </div>
                          )}
                           <button 
                             onClick={(e) => { e.stopPropagation(); setSelectedTalent(t); setShowFastTrack(true); }}
                             className="p-3 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl hover:bg-blue-600 hover:text-white transition-all"
                             title="Fast-Track to Job"
                           >
                              <Zap size={18} fill="currentColor" />
                           </button>
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleDelete(t.id, `${t.first_name} ${t.last_name}`); }}
                             className="p-3 bg-red-50 text-red-400 border border-red-100 rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-sm"
                             title="Remove from Pool"
                           >
                              <Trash2 size={18} strokeWidth={2.5} />
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
          {!loading && totalPages > 1 && (
            <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/30 flex flex-col sm:flex-row justify-between items-center gap-4">
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} entries
              </span>
              <div className="flex gap-3">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-slate-600 disabled:opacity-30 hover:text-slate-900 hover:border-slate-400 transition-all shadow-sm"
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                <div className="flex items-center gap-2">
                   {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                     <button
                       key={p}
                       onClick={() => setPage(p)}
                       className={`w-10 h-10 rounded-xl text-[10px] font-bold transition-all ${p === page ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400'}`}
                     >
                       {p}
                     </button>
                   ))}
                </div>
                <button 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                  disabled={page === totalPages} 
                  className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold uppercase tracking-widest text-blue-600 disabled:opacity-30 hover:border-blue-400 transition-all shadow-sm"
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-white rounded-3xl p-10 relative overflow-hidden shadow-sm border border-slate-100 group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 opacity-50 -mr-32 -mt-32 rounded-full blur-3xl group-hover:bg-blue-50 transition-colors duration-1000" />
           <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
              <div className="space-y-4 text-center md:text-left">
                <div className="flex items-center gap-3 justify-center md:justify-start">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100">
                     <Users size={20} className="text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold uppercase tracking-tight text-slate-900 leading-none">About Staff & Candidates</h3>
                </div>
                <p className="max-w-xl text-[11px] font-bold text-slate-600 uppercase tracking-tight leading-relaxed">
                  This repository contains combined records of staff members and external candidates who have expressed general interest in joining the group.
                </p>
              </div>
              <div className="flex flex-col items-center md:items-end gap-1.5 shrink-0">
                 <div className="text-[9px] font-bold text-blue-600 uppercase tracking-[0.3em]">Talent Records</div>
              </div>
           </div>
        </div>
        <TalentDetailDrawer 
          talent={selectedTalent}
          isOpen={showDrawer}
          onClose={() => setShowDrawer(false)}
          onFastTrack={() => { setShowDrawer(false); setShowFastTrack(true); }}
          onDelete={(t) => { setShowDrawer(false); handleDelete(t.id, `${t.first_name} ${t.last_name}`); }}
        />

        <FastTrackModal 
          talent={selectedTalent}
          isOpen={showFastTrack}
          onClose={() => setShowFastTrack(false)}
          onSuccess={() => { load(); setShowFastTrack(false); }}
        />
      </div>
    </AdminLayout>
  )
}
