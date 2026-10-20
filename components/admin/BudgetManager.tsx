'use client'

import React, { useEffect, useState } from 'react'
import { 
  TrendingUp, 
  DollarSign, 
  History, 
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Lock
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Department {
  id: string
  name: string
  code: string
  current_budget: number
  allocation_ratio: number
  manager?: {
    full_name: string
    email: string
  }
}

interface BudgetHistory {
  id: string
  amount: number
  prev_amount: number | null
  change_reason: string
  created_at: string
  author: { full_name: string }
}

export default function BudgetManager({ userRole }: { userRole: string | null }) {
  const [depts, setDepts] = useState<Department[]>([])
  const [selectedDept, setSelectedDept] = useState<Department | null>(null)
  const [history, setHistory] = useState<BudgetHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [editForm, setEditForm] = useState({
    budget: '',
    reason: ''
  })

  // Creation & Meta State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [metaForm, setMetaForm] = useState({ name: '', code: '' })
  const [availableManagers, setAvailableManagers] = useState<any[]>([])
  const [createForm, setCreateForm] = useState({
    name: '',
    code: '',
    manager_id: '',
    initial_budget: '0'
  })

  useEffect(() => {
    fetchDepts()
    fetchManagers()
  }, [])

  useEffect(() => {
    if (selectedDept) fetchHistory(selectedDept.id)
  }, [selectedDept])

  const fetchDepts = async () => {
    const res = await fetch('/api/admin/departments')
    const { data } = await res.json()
    setDepts(data)
    if (data.length > 0 && !selectedDept) setSelectedDept(data[0])
    setLoading(false)
  }

  const fetchManagers = async () => {
    const res = await fetch('/api/admin/people')
    const { data } = await res.json()
    setAvailableManagers(data || [])
  }

  const fetchHistory = async (id: string) => {
    const res = await fetch(`/api/admin/departments/budget/history?deptId=${id}`)
    const { data } = await res.json()
    setHistory(data)
  }

  const handleCreateDept = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: createForm.name,
          code: createForm.code,
          manager_id: createForm.manager_id || null,
          current_budget: Number(createForm.initial_budget),
          change_reason: 'Department Creation'
        })
      })
      if (res.ok) {
        const data = await res.json()
        await fetchDepts()
        setSelectedDept(data.data)
        setShowCreateModal(false)
        setCreateForm({ name: '', code: '', manager_id: '', initial_budget: '0' })
      }
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateMeta = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDept || !metaForm.name) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDept.id,
          name: metaForm.name,
          code: metaForm.code
        })
      })
      if (res.ok) {
        await fetchDepts()
        setIsEditing(false)
      }
    } finally {
      setSaving(false)
    }
  }

  const handleNameChange = (name: string) => {
    // Generate 3-letter code automatically
    const code = name.replace(/\s/g, '').slice(0, 3).toUpperCase()
    setCreateForm({ ...createForm, name, code })
  }

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDept || !editForm.budget) return

    setSaving(true)
    try {
      const res = await fetch('/api/admin/departments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedDept.id,
          current_budget: Number(editForm.budget),
          change_reason: editForm.reason
        })
      })
      if (res.ok) {
        fetchDepts()
        fetchHistory(selectedDept.id)
        setEditForm({ budget: '', reason: '' })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return null

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-sans">
      
      {/* Left Column: Dept List */}
      <div className="lg:col-span-4 space-y-4">
        <div className="flex items-center justify-between mb-4 px-2">
           <h3 className="text-[10px] font-bold tracking-[0.3em] text-slate-600 uppercase">Departmental Units</h3>
           {(userRole === 'admin' || userRole === 'hr') && (
             <button 
               onClick={() => setShowCreateModal(true)}
               className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600 hover:text-blue-600 hover:border-blue-400 transition-all shadow-sm"
               title="Create New Department"
             >
                <Plus size={16} />
             </button>
           )}
        </div>
        <div className="space-y-2">
          {depts.map(dept => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept)}
              className={cn(
                "w-full text-left p-5 rounded-2xl border transition-all duration-300 group",
                selectedDept?.id === dept.id 
                  ? "bg-slate-900 border-slate-900 text-white shadow-2xl shadow-slate-900/20 translate-x-1" 
                  : "bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 shadow-sm"
              )}
            >
              <div className="flex items-center justify-between mb-4">
                 <span className={cn(
                   "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
                   selectedDept?.id === dept.id ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"
                 )}>
                   {dept.code || 'DEPT'}
                 </span>
                 <DollarSign size={16} className={selectedDept?.id === dept.id ? "text-blue-400" : "text-slate-500"} />
              </div>
              <p className="font-bold text-lg tracking-tight uppercase mb-1">{dept.name}</p>
              <div className="flex items-end justify-between">
                 <p className={cn("text-xs font-bold", selectedDept?.id === dept.id ? "text-slate-400" : "text-slate-600")}>
                   Current Budget
                 </p>
                 <p className="text-xl font-bold tracking-tighter">
                   ${dept.current_budget.toLocaleString()}
                 </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Right Column: Details & History */}
      <div className="lg:col-span-8 space-y-8">
        {selectedDept ? (
          <>
            {/* Budget Editor */}
            <div className="bg-white p-10 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
               <div className="flex items-start justify-between mb-10">
                  <div className="flex-1 space-y-1">
                     <p className="text-[10px] font-bold tracking-widest text-blue-600 uppercase">Resources & Funding</p>
                     
                     {isEditing ? (
                       <div className="space-y-4 pt-2 max-w-md">
                          <input 
                            className="text-2xl font-bold text-slate-900 tracking-tighter uppercase w-full bg-slate-50 border-b-2 border-slate-200 focus:border-blue-600 focus:outline-none py-1"
                            value={metaForm.name}
                            onChange={(e) => setMetaForm({ ...metaForm, name: e.target.value })}
                          />
                          <input 
                            className="text-[10px] font-bold text-slate-600 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded"
                            value={metaForm.code}
                            placeholder="CODE"
                            onChange={(e) => setMetaForm({ ...metaForm, code: e.target.value.toUpperCase() })}
                          />
                          <div className="flex gap-2">
                             <button onClick={handleUpdateMeta} className="text-[10px] font-bold text-blue-600 uppercase">Save Changes</button>
                             <button onClick={() => setIsEditing(false)} className="text-[10px] font-bold text-slate-600 uppercase">Cancel</button>
                          </div>
                       </div>
                     ) : (
                       <div className="group flex items-center gap-4">
                          <div>
                             <h2 className="text-3xl font-bold text-slate-900 tracking-tighter uppercase">{selectedDept.name}</h2>
                             <p className="text-sm font-bold text-slate-600">Manage allocation and historical expenditure.</p>
                          </div>
                          {(userRole === 'admin' || userRole === 'hr') && (
                            <button 
                              onClick={() => {
                                setIsEditing(true)
                                setMetaForm({ name: selectedDept.name, code: selectedDept.code })
                              }}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                               <Plus className="rotate-45 scale-75" size={20} />
                            </button>
                          )}
                       </div>
                     )}
                  </div>
                  <div className="bg-slate-50 px-6 py-3 rounded-2xl border border-slate-100">
                     <p className="text-[10px] font-bold tracking-widest text-slate-600 uppercase mb-1">Allocation Share</p>
                     <div className="flex items-center gap-3">
                        <TrendingUp size={20} className="text-emerald-500" />
                        <span className="text-2xl font-bold text-slate-900">{selectedDept.allocation_ratio}%</span>
                     </div>
                  </div>
               </div>

               {(userRole === 'admin' || userRole === 'hr') ? (
                 <form onSubmit={handleUpdateBudget} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-1.5">
                       <label className="text-[10px] font-bold tracking-widest text-slate-600 uppercase ml-1">New Budget Amount</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">$</span>
                          <input 
                            type="number"
                            placeholder="0.00"
                            className="w-full pl-8 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold font-sans"
                            value={editForm.budget}
                            onChange={e => setEditForm({...editForm, budget: e.target.value})}
                          />
                       </div>
                    </div>
                    <div className="md:col-span-1 space-y-1.5">
                       <label className="text-[10px] font-bold tracking-widest text-slate-600 uppercase ml-1">Change Reason</label>
                       <input 
                          placeholder="e.g. Q3 Expansion"
                          className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-bold"
                          value={editForm.reason}
                          onChange={e => setEditForm({...editForm, reason: e.target.value})}
                       />
                    </div>
                    <div className="md:col-span-1 flex items-end">
                       <button
                          disabled={saving || !editForm.budget}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                       >
                          {saving ? "Updating..." : "Update Budget"}
                          <ChevronRight size={14} />
                       </button>
                    </div>
                 </form>
               ) : (
                 <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-3 text-slate-600 italic">
                    <Lock size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Editing Restricted to Finance Admins</span>
                 </div>
               )}
            </div>

            {/* History Feed */}
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
               <div className="flex items-center gap-3 mb-8">
                  <div className="h-8 w-8 bg-white border border-slate-200 rounded-lg flex items-center justify-center text-slate-600">
                     <History size={16} />
                  </div>
                  <h3 className="text-[10px] font-bold tracking-widest text-slate-900 uppercase">Budget Audit Timeline</h3>
               </div>

               <div className="space-y-4">
                  {history.length === 0 ? (
                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-500">
                       <AlertCircle size={32} />
                       <p className="text-[10px] font-bold uppercase tracking-widest mt-2">No historical records</p>
                    </div>
                  ) : history.map(h => (
                    <div key={h.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
                       <div className="flex items-center gap-6">
                          <div className={cn(
                            "h-10 w-10 rounded-xl flex items-center justify-center",
                            (h.prev_amount || 0) < h.amount ? "bg-emerald-50 text-emerald-500" : "bg-rose-50 text-rose-500"
                          )}>
                             {(h.prev_amount || 0) < h.amount ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-slate-900 tracking-tight uppercase">{h.change_reason}</p>
<p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                                 By {h.author?.full_name} · {new Date(h.created_at).toLocaleDateString('en-GB')}
                              </p>
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-lg font-bold text-slate-900">${h.amount.toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-tighter">
                             Prev: ${h.prev_amount?.toLocaleString() || '0'}
                          </p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </>
        ) : (
          <div className="h-full min-h-[400px] border-2 border-dashed border-slate-100 rounded-3xl flex items-center justify-center">
             <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select a department to manage</p>
          </div>
        )}
      </div>

      {/* Create Department Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
              <div className="bg-slate-900 p-8 text-white">
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-2xl font-bold uppercase tracking-tight">New Unit</h3>
                    <button onClick={() => setShowCreateModal(false)} className="text-slate-600 hover:text-white"><Plus className="rotate-45" size={24} /></button>
                 </div>
                 <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Establish a custom organizational department</p>
              </div>
              
              <form onSubmit={handleCreateDept} className="p-8 space-y-6">
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-1">Department Name</label>
                    <input 
                      required
                      placeholder="e.g. Flight Operations"
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all font-sans"
                      value={createForm.name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-1">Code (Auto-Gen)</label>
                       <input 
                         required
                         maxLength={5}
                         placeholder="e.g. FLI"
                         className="w-full px-4 py-3.5 bg-white border border-slate-200 rounded-xl font-bold focus:border-blue-400 focus:outline-none transition-all"
                         value={createForm.code}
                         onChange={(e) => setCreateForm({ ...createForm, code: e.target.value.toUpperCase() })}
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-1">Initial Budget</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                          <input 
                             type="number"
                             className="w-full pl-8 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none transition-all font-sans"
                             value={createForm.initial_budget}
                             onChange={(e) => setCreateForm({ ...createForm, initial_budget: e.target.value })}
                          />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-600 ml-1">Department Manager</label>
                    <select 
                      className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:bg-white focus:outline-none transition-all font-sans"
                      value={createForm.manager_id}
                      onChange={(e) => setCreateForm({ ...createForm, manager_id: e.target.value })}
                    >
                       <option value="">Assign Later</option>
                       {availableManagers.map(m => (
                         <option key={m.auth_user_id} value={m.auth_user_id}>{m.full_name} ({m.role})</option>
                       ))}
                    </select>
                 </div>

                 <div className="pt-4 flex gap-3">
                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-slate-100 transition-all">Cancel</button>
                    <button 
                      type="submit" 
                      disabled={saving || !createForm.name}
                      className="flex-[2] py-4 bg-blue-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50"
                    >
                       {saving ? "Creating..." : "Establish Unit"}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  )
}
