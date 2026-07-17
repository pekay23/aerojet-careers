'use client'
import { useEffect, useState } from 'react'
import AdminLayout from '@/components/admin/AdminLayout'
import { StatusPill } from '@/components/ui/StatusPill'
import { EmptyState } from '@/components/ui/EmptyState'
import type { Job } from '@/types'

// Metadata state
type Metadata = {
  departments: any[]
  categories: any[]
  employment_types: any[]
}

const EMPTY_JOB = {
  title: '', ref_code: '', department: '', category: 'experienced_professional',
  employment_type: 'full_time', location: '',
  status: 'draft', target_count: '', closes_at: '',
  summary: '', responsibilities: '', requirements: '', what_we_offer: '',
  tags: '',
}

export default function JobsAdminPage() {
  const [jobs,    setJobs]    = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [modal,   setModal]   = useState<'new' | 'edit' | null>(null)
  const [form,    setForm]    = useState<Record<string, any>>(EMPTY_JOB)
  const [saving,  setSaving]  = useState(false)
  const [statusF, setStatusF] = useState('')
  const [meta,    setMeta]    = useState<Metadata>({ departments: [], categories: [], employment_types: [] })
  const [baseLoc, setBaseLoc] = useState('Accra Base, GH')

  const load = async () => {
    setLoading(true)
    const url = statusF ? `/api/admin/jobs?status=${statusF}` : '/api/admin/jobs'
    const r   = await fetch(url)
    const d   = await r.json()
    setJobs(d.data || [])
    setLoading(false)
  }

  const loadMetadata = async () => {
    const [metaR, settingR] = await Promise.all([
      fetch('/api/admin/metadata'),
      fetch('/api/admin/settings')
    ])
    const metaD = await metaR.json()
    const setD  = await settingR.json()

    if (metaD.data) setMeta(metaD.data)
    if (setD.data) {
      const loc = setD.data.find((s: any) => s.setting_key === 'base_location')?.setting_value
      if (loc) setBaseLoc(loc)
    }
  }

  useEffect(() => { 
    load()
    loadMetadata()
    
    // Auto-open modal if navigating from dashboard
    if (typeof window !== 'undefined' && window.location.search.includes('action=new')) {
       setTimeout(() => {
         // Clear URL so it doesn't pop open again on saves
         window.history.replaceState({}, document.title, '/admin/jobs')
         setModal('new')
         setForm({ ...EMPTY_JOB, location: 'Accra Base, GH' })
       }, 500)
    }
  }, [statusF]) // eslint-disable-line

  const sf = (k: string) => (v: any) => setForm(f => ({ ...f, [k]: v }))

  const openNew  = () => { 
    setForm({ ...EMPTY_JOB, location: baseLoc })
    setModal('new') 
  }
  const openEdit = (j: Job) => {
    setForm({ ...j, tags: (j.tags || []).join(', '), target_count: j.target_count || '' })
    setModal('edit')
  }

  const save = async (publishNow?: boolean) => {
    if (!form.title?.trim() || !form.department) {
      alert('Title and department are required.'); return
    }
    setSaving(true)
    const payload = {
      ...form,
      tags:         (form.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
      target_count: form.target_count ? Number(form.target_count) : null,
      status:       publishNow ? 'open' : form.status || 'draft',
    }
    const method = modal === 'edit' ? 'PATCH' : 'POST'
    await fetch('/api/admin/jobs', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    setSaving(false)
    setModal(null)
    load()
  }
  const toggleStatus = async (j: Job) => {
    const newStatus = j.status === 'open' ? 'closed' : 'open'
    await fetch('/api/admin/jobs', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: j.id, status: newStatus }),
    })
    load()
  }

  const handleDelete = async (j: Job) => {
    if (!confirm(`Are you sure you want to delete "${j.title}"?`)) return
    
    setSaving(true)
    const res = await fetch(`/api/admin/jobs?id=${j.id}`, { method: 'DELETE' })
    if (res.ok) {
      load()
    } else {
      const d = await res.json()
      alert(d.error || 'Failed to delete job')
    }
    setSaving(false)
  }

  return (
    <AdminLayout title="Job Postings">
      <div className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-3">
            <select value={statusF} onChange={e => setStatusF(e.target.value)} className="px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-lg text-xs font-bold uppercase tracking-widest text-slate-800 focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all cursor-pointer appearance-none min-w-[160px]">
              <option value="">All statuses</option>
              {['open','draft','closed','paused','filled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="md:ml-auto flex items-center gap-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
               {jobs.length} posting{jobs.length !== 1 ? 's' : ''}
            </span>
            <button 
              onClick={openNew} 
              className="px-6 py-2.5 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all shadow-lg shadow-black/10 hover:-translate-y-0.5"
            >
              + New Job
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center space-y-4">
             <div className="w-8 h-8 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest animate-pulse">Loading Jobs…</p>
          </div>
        ) : jobs.length === 0 ? (
          <div className="py-20">
            <EmptyState icon="📌" message="No job postings yet. Create your first one." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  {['Job Title','Department','Category','Vacancies','Status','Created','Actions'].map(h => (
                    <th key={h} className="px-4 lg:px-8 py-3 lg:py-4 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map(j => (
                   <tr key={j.id} className="hover:bg-slate-50/50 transition-colors group/row">
                    <td className="px-4 lg:px-8 py-4 lg:py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 uppercase tracking-tight group-hover/row:text-blue-600 transition-colors">{j.title}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{j.ref_code} · {j.location}</span>
                        {j.closes_at && <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-tighter mt-1">Closes {j.closes_at}</span>}
                      </div>
                    </td>
                    <td className="px-4 lg:px-8 py-4 lg:py-5 text-[11px] font-bold text-slate-600 uppercase tracking-tight">{j.department}</td>
                    <td className="px-4 lg:px-8 py-4 lg:py-5 text-[11px] font-bold text-slate-600 uppercase tracking-tight">
                       {meta.categories.find(c => c.value === j.category)?.label || j.category?.replace(/_/g, ' ')}
                    </td>
                    <td className="px-4 lg:px-8 py-4 lg:py-5 text-[11px] font-bold text-slate-900">{j.target_count || '—'}</td>
                    <td className="px-4 lg:px-8 py-4 lg:py-5"><StatusPill status={j.status} /></td>
                    <td className="px-4 lg:px-8 py-4 lg:py-5">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(j.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 lg:px-8 py-4 lg:py-5">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openEdit(j)} 
                          className="px-4 py-1.5 bg-white border border-slate-200 text-[10px] font-bold uppercase tracking-widest text-blue-600 rounded-lg hover:border-blue-400 hover:text-blue-700 transition-all shadow-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => toggleStatus(j)} 
                          className="px-4 py-1.5 bg-slate-50 border border-slate-100 text-[10px] font-bold uppercase tracking-widest text-slate-400 rounded-lg hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                        >
                          {j.status === 'open' ? 'Close' : 'Open'}
                        </button>
                        <button 
                          onClick={() => handleDelete(j)} 
                          className="px-4 py-1.5 bg-red-50 border border-red-100 text-[10px] font-bold uppercase tracking-widest text-red-500 rounded-lg hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          title="Permanent Delete"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
            onClick={() => !saving && setModal(null)} 
          />
          <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] font-medium">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                 <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tighter">
                  {modal === 'new' ? 'Create New Vacancy' : 'Edit Opportunity'}
                </h2>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">{modal === 'new' ? 'Draft Posting' : 'Reference: ' + (form.ref_code || 'N/A')}</p>
              </div>
              <button 
                onClick={() => setModal(null)} 
                className="h-10 w-10 flex items-center justify-center rounded-lg bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:border-slate-300 transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-10 overflow-y-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Job title *</label>
                  <input value={form.title ?? ''} onChange={e => sf('title')(e.target.value)} placeholder="e.g. Licensed Aircraft Engineers" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Reference Code</label>
                  <input value={form.ref_code ?? ''} onChange={e => sf('ref_code')(e.target.value)} placeholder="e.g. AERO-ENG-001" className="w-full px-5 py-3.5 bg-slate-100/50 border border-slate-200 rounded-lg focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-300" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Department *</label>
                  <select value={form.department ?? ''} onChange={e => sf('department')(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 appearance-none">
                    <option value="">Select…</option>
                    {meta.departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Category</label>
                  <select value={form.category} onChange={e => sf('category')(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 appearance-none">
                    {meta.categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Employment type</label>
                  <select value={form.employment_type} onChange={e => sf('employment_type')(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 appearance-none">
                    {meta.employment_types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Location</label>
                  <input value={form.location ?? ''} onChange={e => sf('location')(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Number of vacancies</label>
                  <input type="number" value={form.target_count ?? ''} onChange={e => sf('target_count')(e.target.value)} placeholder="e.g. 5" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900" min="1" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Closing date</label>
                  <input type="date" value={form.closes_at ?? ''} onChange={e => sf('closes_at')(e.target.value)} className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Tags (comma-separated)</label>
                  <input value={form.tags ?? ''} onChange={e => sf('tags')(e.target.value)} placeholder="e.g. EASA Part-66, Boeing 737, AOG" className="w-full px-5 py-3.5 bg-slate-50 border border-slate-100 rounded-lg focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-200" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Summary</label>
                  <textarea value={form.summary ?? ''} onChange={e => sf('summary')(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-200 min-h-[100px] leading-relaxed" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Key responsibilities</label>
                  <textarea value={form.responsibilities ?? ''} onChange={e => sf('responsibilities')(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-200 min-h-[120px] leading-relaxed" placeholder="• Responsibility 1&#10;• Responsibility 2" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Requirements</label>
                  <textarea value={form.requirements ?? ''} onChange={e => sf('requirements')(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-200 min-h-[120px] leading-relaxed" placeholder="• Requirement 1&#10;• Requirement 2" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">What we offer</label>
                  <textarea value={form.what_we_offer ?? ''} onChange={e => sf('what_we_offer')(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold text-sm text-slate-900 placeholder:text-slate-200 min-h-[100px] leading-relaxed" />
                </div>
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-4 justify-end shrink-0">
               <button onClick={() => setModal(null)} className="px-8 py-3.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all">Cancel</button>
              <button 
                onClick={() => save(false)} 
                disabled={saving} 
                className="px-8 py-3.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:bg-slate-50 transition-all shadow-sm"
              >
                {saving ? 'Saving…' : 'Save as draft'}
              </button>
              <button 
                onClick={() => save(true)}  
                disabled={saving} 
                className="px-10 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30"
              >
                {saving ? 'Publishing…' : 'Publish now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

const TH: React.CSSProperties = { padding: '0.625rem 1.25rem', textAlign: 'left', fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }
const TD: React.CSSProperties = { padding: '0.8rem 1.25rem', verticalAlign: 'middle' }
