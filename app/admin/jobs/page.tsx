'use client'
import { useEffect, useState } from 'react'
import { Briefcase } from 'lucide-react'
import type { Job } from '@/types'
import AdminLayout from '@/components/admin/AdminLayout'
import { StatusPill } from '@/components/ui/StatusPill'
import { EmptyState } from '@/components/ui/EmptyState'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { toast } from '@/lib/toast'


// Metadata state
type Metadata = {
  departments: any[]
  categories: any[]
  employment_types: any[]
}

const EMPTY_JOB = {
  title: '', ref_code: '', department: '', category: 'experienced_professional',
  employment_type: 'full_time', location: '',
  status: 'draft', target_count: '', closes_at: '', indefinite_deadline: false, open_positions: false,
  summary: '', responsibilities: '', requirements: '', what_we_offer: '',
  tags: '',
}

// Column header → API sort key mapping
const SORTABLE_COLUMNS: Record<string, string> = {
  'Job Title': 'title',
  'Department': 'department',
  'Category': 'category',
  'Vacancies': 'target_count',
  'Closes': 'closes_at',
  'Status': 'status',
  'Created': 'created_at',
  'Updated': 'updated_at',
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
  const [newDeptName, setNewDeptName] = useState('')
  const [creatingDept, setCreatingDept] = useState(false)
  const [pageInfo, setPageInfo] = useState<{ total: number; page: number; limit: number }>({ total: 0, page: 1, limit: 50 })
  const [sortCol, setSortCol] = useState('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [userRole, setUserRole] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [confirmConfig, setConfirmConfig] = useState<{
    title: string
    description?: string
    confirmLabel?: string
    variant?: 'danger' | 'default'
    onConfirm: () => void
  } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const openConfirm = (config: {
    title: string
    description?: string
    confirmLabel?: string
    variant?: 'danger' | 'default'
    onConfirm: () => void
  }) => {
    setConfirmConfig(config)
    setConfirmOpen(true)
  }
  const closeConfirm = () => {
    setConfirmOpen(false)
    setConfirmConfig(null)
  }

  const load = async (pg: number = pageInfo.page) => {
    setLoading(true)
    const params = new URLSearchParams({ page: String(pg), limit: '50', sort: sortCol, dir: sortDir })
    if (statusF) params.set('status', statusF)
    try {
      const r = await fetch(`/api/admin/jobs?${params}`)
      const d = await r.json()
      if (!r.ok) {
        toast.error(d.error || 'Failed to load jobs.')
        setJobs([])
      } else if (d.data?.data) {
        setJobs(d.data.data)
        setPageInfo({ total: d.data.total || 0, page: d.data.page || 1, limit: d.data.limit || 50 })
      } else {
        setJobs(d.data || [])
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error — could not load jobs.')
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const setSort = (col: string) => {
    if (sortCol === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
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
    load(1)
  }, [statusF, sortCol, sortDir, refreshKey])

  useEffect(() => {
    loadMetadata()

    const checkRole = async () => {
      const r = await fetch('/api/auth/me')
      const { admin } = await r.json()
      if (admin) setUserRole(admin.role)
    }
    checkRole()
    
    // Auto-open modal if navigating from dashboard
    if (typeof window !== 'undefined' && window.location.search.includes('action=new')) {
       setTimeout(() => {
         // Clear URL so it doesn't pop open again on saves
         window.history.replaceState({}, document.title, '/admin/jobs')
         setModal('new')
          setForm({ ...EMPTY_JOB, location: baseLoc })
          setPageInfo(p => ({ ...p, page: 1 }))
       }, 500)
    }
  }, [])

  const sf = (k: string) => (v: any) => setForm(f => ({ ...f, [k]: v }))

  const openNew  = () => { 
    setForm({ ...EMPTY_JOB, location: baseLoc })
    setModal('new')
    setPageInfo(p => ({ ...p, page: 1 }))
  }
  const openEdit = (j: Job) => {
    setNewDeptName('')
    setForm({
      ...j,
      tags: (j.tags || []).join(', '),
      target_count: j.target_count || '',
      closes_at: j.closes_at ? new Date(j.closes_at).toISOString().slice(0, 10) : '',
      indefinite_deadline: !j.closes_at,
      open_positions: !j.target_count,
    })
    setModal('edit')
  }

  const save = async (publishNow?: boolean) => {
    if (form.department === '__add_new__') {
      toast.error('Please select or create a department before saving.')
      return
    }
    if (!form.title?.trim() || !form.department) {
      toast.error('Title and department are required.')
      return
    }
    setSaving(true)
    const payload: Record<string, any> = {
      ...(modal === 'edit' ? { id: form.id } : {}),
      title: form.title.trim(),
      ref_code: form.ref_code ? form.ref_code.toUpperCase() : undefined,
      department: form.department,
      category: form.category,
      employment_type: form.employment_type,
      location: form.location || 'Accra, Ghana (AIA)',
      status: publishNow ? 'open' : form.status || 'draft',
      target_count: form.open_positions ? null : (form.target_count ? Number(form.target_count) : null),
      closes_at: form.indefinite_deadline ? null : (form.closes_at || null),
      summary: form.summary || null,
      responsibilities: form.responsibilities || null,
      requirements: form.requirements || null,
      what_we_offer: form.what_we_offer || null,
      tags: (form.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean),
    }
    const method = modal === 'edit' ? 'PATCH' : 'POST'
    try {
      const res = await fetch('/api/admin/jobs', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const d = await res.json()
       if (!res.ok) {
        toast.error(d.error || 'Failed to save job posting.')
      } else {
        setModal(null)
        setRefreshKey(k => k + 1)
        toast.success(publishNow ? 'Job published' : 'Job saved as draft')
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error — could not save job posting.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateDept = async () => {
    if (!newDeptName.trim()) return
    setCreatingDept(true)
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newDeptName.trim() }),
      })
      const d = await res.json()
      if (!res.ok) {
        toast.error(d.error || 'Could not create department.')
      } else {
        setMeta((m) => ({
          ...m,
          departments: [...m.departments, d.data],
        }))
        sf('department')(newDeptName.trim())
        setNewDeptName('')
        toast.success('Department created')
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error — could not create department.')
    } finally {
      setCreatingDept(false)
    }
  }

  const cancelNewDept = () => {
    setNewDeptName('')
  }

  const toggleVisibility = async (j: Job) => {
    const newStatus = j.status === 'open' ? 'draft' : 'open'
    const action = newStatus === 'open' ? 'publish' : 'unpublish'
    openConfirm({
      title: `${action === 'publish' ? 'Publish' : 'Unpublish'} job posting?`,
      description: `"${j.title}" will be ${newStatus === 'open' ? 'visible on the careers page' : 'hidden from the careers page'}.`,
      confirmLabel: newStatus === 'open' ? 'Publish' : 'Hide',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/jobs', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: j.id, status: newStatus }),
          })
          if (!res.ok) {
            const d = await res.json()
            toast.error(d.error || 'Failed to update visibility')
          } else {
            toast.success(`Job ${newStatus === 'open' ? 'published' : 'moved to draft'}`)
            setRefreshKey(k => k + 1)
          }
        } catch (err: any) {
          toast.error(err.message || 'Network error')
        }
      },
    })
  }

  const toggleStatus = async (j: Job) => {
    const statuses = ['draft', 'open', 'paused', 'closed', 'filled']
    const idx = statuses.indexOf(j.status)
    const newStatus = statuses[(idx + 1) % statuses.length]
      openConfirm({
      title: `Change status to ${newStatus}?`,
      description: `"${j.title}" will move from "${j.status}" to "${newStatus}".`,
      confirmLabel: 'Update',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/jobs', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: j.id, status: newStatus }),
          })
          if (!res.ok) {
            const d = await res.json()
            toast.error(d.error || 'Failed to update status')
          } else {
            toast.success(`Status changed to ${newStatus}`)
            setRefreshKey(k => k + 1)
          }
        } catch (err: any) {
          toast.error(err.message || 'Network error')
        }
      },
    })
  }

  const handleDelete = async (j: Job) => {
    openConfirm({
      title: 'Delete job posting?',
      description: `"${j.title}" will be permanently removed and no longer visible.`,
      confirmLabel: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/admin/jobs?id=${j.id}`, { method: 'DELETE' })
          if (res.ok) {
            toast.success('Job posting deleted')
            setRefreshKey(k => k + 1)
          } else {
            const d = await res.json()
            toast.error(d.error || 'Failed to delete job')
          }
        } catch (err: any) {
          toast.error(err.message || 'Network error')
        }
      },
    })
  }

  return (
    <AdminLayout title="Job Postings">
      <div className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 items-center">
          <div className="flex items-center gap-3">
            <select value={statusF} onChange={e => setStatusF(e.target.value)} className="admin-input text-xs uppercase tracking-widest cursor-pointer appearance-none min-w-40">
              <option value="">All statuses</option>
              {['open','draft','closed','paused','filled'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          
          <div className="md:ml-auto flex items-center gap-6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
               {pageInfo.total > 0 ? `${(pageInfo.page - 1) * pageInfo.limit + 1}-${Math.min(pageInfo.page * pageInfo.limit, pageInfo.total)} of ${pageInfo.total}` : `${jobs.length} posting${jobs.length !== 1 ? 's' : ''}`}
            </span>
            {pageInfo.total > pageInfo.limit && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => load(pageInfo.page - 1)}
                  disabled={pageInfo.page <= 1}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  Prev
                </button>
                <span className="text-[10px] font-bold text-slate-400">
                  {pageInfo.page} / {Math.ceil(pageInfo.total / pageInfo.limit)}
                </span>
                <button
                  onClick={() => load(pageInfo.page + 1)}
                  disabled={pageInfo.page >= Math.ceil(pageInfo.total / pageInfo.limit)}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 disabled:opacity-50 transition-all"
                >
                  Next
                </button>
              </div>
            )}
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
            <EmptyState icon={Briefcase} message="No job postings yet. Create your first one." />

          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '11%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '9%' }} />
                <col style={{ width: '19%' }} />
              </colgroup>
              <thead>
                 <tr className="bg-slate-50/50">
                   {['Job Title','Department','Category','Vacancies','Closes','Status','Created','Updated','Actions'].map(h => {
                     const colKey = SORTABLE_COLUMNS[h]
                     const sortable = !!colKey
                     return (
                     <th
                       key={h}
                       className="px-3 py-2 text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400 border-b border-slate-100"
                       onClick={sortable ? () => setSort(colKey) : undefined}
                       style={sortable ? { cursor: 'pointer', userSelect: 'none' } : undefined}
                     >
                       <div className="flex items-center gap-1">
                         {h}
                         {sortable && sortCol === colKey && (
                           <span className="text-blue-600">{sortDir === 'asc' ? '↑' : '↓'}</span>
                         )}
                       </div>
                     </th>
                     )
                   })}
                 </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jobs.map(j => (
                   <tr key={j.id} className="hover:bg-slate-50/50 transition-colors group/row">
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-900 uppercase tracking-tight truncate group-hover/row:text-blue-600 transition-colors">{j.title}</span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest truncate">{j.ref_code} · {j.location}</span>
                       </div>
                    </td>
                    <td className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-tight truncate">{j.department}</td>
                    <td className="px-3 py-2.5 text-[10px] font-bold text-slate-600 uppercase tracking-tight truncate">
                       {meta.categories.find(c => c.value === j.category)?.label || j.category?.replace(/_/g, ' ')}
                    </td>
                     <td className="px-3 py-2.5 text-[10px] font-bold text-slate-900">{!j.target_count ? 'Open' : j.target_count}</td>
                     <td className="px-3 py-2.5">
                       {j.closes_at && <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">Closes {new Date(j.closes_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>}
                       {!j.closes_at && <span className="text-[9px] font-bold text-sky-600 uppercase tracking-tighter">No deadline</span>}
                     </td>
                     <td className="px-3 py-2.5"><StatusPill status={j.status} /></td>
                    <td className="px-3 py-2.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(j.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        {new Date(j.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                     <td className="px-3 py-2.5">
                        <div className="flex gap-1.5 flex-wrap">
                          <button
                            onClick={() => openEdit(j)}
                            className="px-2.5 py-1 bg-white border border-slate-200 text-[9px] font-bold uppercase tracking-widest text-blue-600 rounded hover:border-blue-400 hover:text-blue-700 transition-all shadow-sm"
                          >
                            Edit
                          </button>
                          {(userRole === 'admin' || userRole === 'hr_manager') && (
                            <>
                          <button
                            onClick={() => toggleVisibility(j)}
                            className={`px-2.5 py-1 border rounded text-[9px] font-bold uppercase tracking-widest transition-all shadow-sm ${j.status === 'open' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 hover:bg-emerald-100' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-900 hover:text-white'}`}
                            title={j.status === 'open' ? 'Hide from careers page' : 'Publish to careers page'}
                          >
                            {j.status === 'open' ? 'Published' : 'Draft'}
                          </button>
                          <button
                            onClick={() => toggleStatus(j)}
                            className="px-2.5 py-1 bg-slate-50 border border-slate-100 text-[9px] font-bold uppercase tracking-widest text-slate-400 rounded hover:bg-slate-900 hover:text-white transition-all shadow-sm"
                          >
                            {j.status === 'open' ? 'Close' : j.status === 'closed' ? 'Reopen' : 'Cycle'}
                          </button>
                          <button
                            onClick={() => handleDelete(j)}
                            className="px-2.5 py-1 bg-red-50 border border-red-100 text-[9px] font-bold uppercase tracking-widest text-red-500 rounded hover:bg-red-600 hover:text-white transition-all shadow-sm"
                          >
                            Delete
                          </button>
                            </>
                          )}
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
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" 
             onClick={() => !saving && (setModal(null), setNewDeptName(''))}
          />
          <div className="relative bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] font-medium">
            <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="space-y-1">
                 <h2 className="text-xl font-bold text-slate-900 uppercase tracking-tighter">
                   {modal === 'new' ? 'Create New Vacancy' : 'Edit Job Posting'}
                </h2>
                <p className="text-[10px] font-bold text-blue-600 uppercase tracking-[0.2em]">{modal === 'new' ? 'Draft Posting' : 'Reference: ' + (form.ref_code || 'N/A')}</p>
              </div>
               <button 
                 onClick={() => { setModal(null); setNewDeptName('') }} 
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
                  <input value={form.title ?? ''} onChange={e => sf('title')(e.target.value)} placeholder="e.g. Licensed Aircraft Engineers" className="admin-input" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Reference Code</label>
                  <input value={form.ref_code ?? ''} onChange={e => sf('ref_code')(e.target.value)} placeholder="e.g. AERO-ENG-001" className="admin-input" />
                </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Department *</label>
                   <select value={form.department ?? ''} onChange={e => sf('department')(e.target.value)} className="admin-input appearance-none">
                     <option value="">Select…</option>
                     {meta.departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
                     <option value="__add_new__">— Add new department —</option>
                   </select>
                   {form.department === '__add_new__' && (
                     <div className="pt-2 space-y-2">
                        <div className="flex gap-2">
                          <input
                            value={newDeptName}
                            onChange={e => setNewDeptName(e.target.value)}
                            placeholder="Department name"
                            className="admin-input flex-1"
                          />
                          <button
                            type="button"
                            onClick={handleCreateDept}
                            disabled={creatingDept || !newDeptName.trim()}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all"
                          >
                            {creatingDept ? 'Adding…' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { cancelNewDept(); sf('department')('') }}
                            className="px-4 py-2 bg-white border border-slate-200 text-slate-400 rounded-lg text-[9px] font-bold uppercase tracking-widest hover:bg-slate-50 transition-all"
                          >
                            Cancel
                          </button>
                        </div>
                     </div>
                   )}
                 </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Category</label>
                  <select value={form.category} onChange={e => sf('category')(e.target.value)} className="admin-input appearance-none">
                    {meta.categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Employment type</label>
                  <select value={form.employment_type} onChange={e => sf('employment_type')(e.target.value)} className="admin-input appearance-none">
                    {meta.employment_types.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Location</label>
                  <input value={form.location ?? ''} onChange={e => sf('location')(e.target.value)} className="admin-input" />
                </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Number of vacancies</label>
                   {!form.open_positions ? (
                     <input type="number" value={form.target_count ?? ''} onChange={e => sf('target_count')(e.target.value)} placeholder="e.g. 5" className="admin-input" min="1" />
                   ) : (
                     <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600">Open — unlimited positions</div>
                   )}
                   <label className="flex items-center gap-2 mt-2 cursor-pointer">
                     <input
                       type="checkbox"
                       checked={!!form.open_positions}
                       onChange={e => { sf('open_positions')(e.target.checked); if (e.target.checked) sf('target_count')('') }}
                       className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                     />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Open positions (no fixed limit)</span>
                   </label>
                 </div>
                 <div className="space-y-1.5">
                   <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Closing date</label>
                   {!form.indefinite_deadline ? (
                     <input type="date" value={form.closes_at ?? ''} onChange={e => sf('closes_at')(e.target.value)} className="admin-input" />
                   ) : (
                     <div className="px-4 py-3 bg-slate-50 border border-slate-100 rounded-lg text-[11px] font-bold text-slate-600">No deadline — open indefinitely</div>
                   )}
                   <label className="flex items-center gap-2 mt-2 cursor-pointer">
                     <input
                       type="checkbox"
                       checked={!!form.indefinite_deadline}
                       onChange={e => { sf('indefinite_deadline')(e.target.checked); if (e.target.checked) sf('closes_at')('') }}
                       className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                     />
                     <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Indefinite — no application deadline</span>
                   </label>
                 </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Tags (comma-separated)</label>
                  <input value={form.tags ?? ''} onChange={e => sf('tags')(e.target.value)} placeholder="e.g. EASA Part-66, Boeing 737, AOG" className="admin-input" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Summary</label>
                  <textarea value={form.summary ?? ''} onChange={e => sf('summary')(e.target.value)} className="admin-input admin-textarea min-h-25" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Key responsibilities</label>
                  <textarea value={form.responsibilities ?? ''} onChange={e => sf('responsibilities')(e.target.value)} className="admin-input admin-textarea min-h-30" placeholder="• Responsibility 1&#10;• Responsibility 2" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">Requirements</label>
                  <textarea value={form.requirements ?? ''} onChange={e => sf('requirements')(e.target.value)} className="admin-input admin-textarea min-h-30" placeholder="• Requirement 1&#10;• Requirement 2" />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-[10px] font-bold tracking-widest text-blue-600 uppercase px-1">What we offer</label>
                  <textarea value={form.what_we_offer ?? ''} onChange={e => sf('what_we_offer')(e.target.value)} className="admin-input admin-textarea min-h-25" />
                </div>
              </div>
            </div>
            
            <div className="p-8 border-t border-slate-100 bg-slate-50 flex flex-wrap gap-4 justify-end shrink-0">
                <button onClick={() => { setModal(null); setNewDeptName('') }} className="px-8 py-3.5 bg-white border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-slate-900 hover:border-slate-400 transition-all">Cancel</button>
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

      <ConfirmDialog
        open={confirmOpen}
        onClose={closeConfirm}
        title={confirmConfig?.title || ''}
        description={confirmConfig?.description}
        confirmLabel={confirmConfig?.confirmLabel}
        variant={confirmConfig?.variant || 'default'}
        onConfirm={confirmConfig ? confirmConfig.onConfirm : () => {}}
      />
    </AdminLayout>
  )
}
