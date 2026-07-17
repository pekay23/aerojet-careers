'use client'

import React, { useState, useEffect } from 'react'
import { 
  Search, 
  Users, 
  MoreVertical, 
  Filter, 
  Download,
  Mail,
  Phone,
  ArrowUpRight,
  Circle,
  Shield, 
  UserPlus,
  Trash2,
  UserX,
  AlertTriangle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import AddStaffModal from './AddStaffModal'

interface StaffMember {
  id: string
  full_name: string
  job_title: string
  department: string
  role: string
  status: string
  email: string
  phone?: string
  photo_url?: string
}

export default function PeopleDirectory() {
  const [members, setMembers] = useState<StaffMember[]>([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setCurrentUser(data.user))
  }, [])

  const [officialDepts, setOfficialDepts] = useState<string[]>([])

  const fetchPeople = async () => {
    setIsLoading(true)
    const { data, error } = await supabase
      .from('admin_users')
      .select(`
        id,
        role,
        status,
        staff_profiles (
          first_name,
          last_name,
          job_title,
          department,
          email,
          phone,
          avatar_url
        )
      `)
    
    if (data) {
      const transformed = data.map((d: any) => ({
        id: d.id,
        role: d.role,
        status: d.status,
        full_name: d.staff_profiles ? `${d.staff_profiles.first_name} ${d.staff_profiles.last_name}` : 'Unnamed Employee',
        job_title: d.staff_profiles?.job_title || 'No Title',
        department: d.staff_profiles?.department || 'General',
        email: d.staff_profiles?.email || d.email || '',
        phone: d.staff_profiles?.phone || '',
        photo_url: d.staff_profiles?.avatar_url
      }))
      setMembers(transformed)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchPeople()
    fetch('/api/admin/metadata')
      .then(r => r.json())
      .then(({ data }) => {
        if (data && data.departments) {
          setOfficialDepts(data.departments.map((d: any) => d.name))
        }
      })
  }, [])

  const handleDelete = async (userId: string, mode: 'soft' | 'hard') => {
    if (userId === currentUser?.id) {
      alert("You cannot delete your own account.")
      return
    }

    const confirmMsg = mode === 'soft' 
      ? "Are you sure you want to deactivate this user? They will no longer be able to log in."
      : "PERMANENT DELETE: This will remove all data for this user. This action cannot be undone. Proceed?"
    
    if (!confirm(confirmMsg)) return

    try {
      const res = await fetch(`/api/admin/people?id=${userId}&mode=${mode}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      fetchPeople()
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredMembers = members.filter(m => 
    (filter === 'all' || m.department === filter) &&
    (m.full_name.toLowerCase().includes(search.toLowerCase()) || 
     m.job_title.toLowerCase().includes(search.toLowerCase()))
  )

  const deptsList = ['all', ...officialDepts]

  return (
    <div className="space-y-6">
      <AddStaffModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onSuccess={fetchPeople}
      />
      
      {/* Header / Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-2">
         <div className="space-y-1">
            <h2 className="text-[10px] font-bold tracking-[0.3em] text-blue-600 uppercase">Aerojet Staff Directory</h2>
            <h1 className="text-4xl font-bold text-slate-900 tracking-tighter uppercase">Team Management</h1>
            <p className="text-sm font-bold text-slate-400">Review and manage your team information and contact details.</p>
         </div>
         
         <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all shadow-xl shadow-slate-900/20 uppercase tracking-widest"
            >
              <UserPlus size={16} />
              <span>Add Member</span>
            </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Employees', value: members.length, icon: Users, color: 'blue' },
          { label: 'Active Now', value: members.filter(m => m.status === 'active').length, icon: ArrowUpRight, color: 'emerald' },
          { label: 'Departments', value: deptsList.length - 1, icon: Filter, color: 'indigo' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div>
               <p className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">{stat.label}</p>
               <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
             </div>
             <div className={cn(
               "p-3 rounded-lg",
               stat.color === 'blue' && "bg-blue-50 text-blue-600",
               stat.color === 'emerald' && "bg-emerald-50 text-emerald-600",
               stat.color === 'indigo' && "bg-indigo-50 text-indigo-600",
             )}>
               <stat.icon size={24} />
             </div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search by name or title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3">
           <select 
             className="bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-500 focus:outline-none"
             value={filter}
             onChange={(e) => setFilter(e.target.value)}
           >
             {deptsList.map(d => (
               <option key={d} value={d}>{d === 'all' ? 'All Departments' : d}</option>
             ))}
           </select>
           
           <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-400 hover:bg-white hover:text-blue-600 hover:shadow-lg transition-all">
             <Download size={18} />
           </button>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-48" />
            ))
          ) : filteredMembers.map((member) => (
            <motion.div
              layout
              key={member.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-2xl hover:shadow-blue-500/5 transition-all group cursor-pointer relative"
            >
              <div className="absolute top-4 right-4 z-10">
                 <div className="relative group/menu">
                    <button className="p-2 text-slate-300 hover:text-slate-600 transition-colors">
                       <MoreVertical size={18} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 hidden group-hover/menu:block bg-white border border-slate-200 rounded-xl shadow-2xl p-2 min-w-[160px] z-50">
                       <button 
                         onClick={() => handleDelete(member.id, 'soft')}
                         className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-all"
                       >
                         <UserX size={14} />
                         <span>Deactivate</span>
                       </button>
                       <button 
                         onClick={() => handleDelete(member.id, 'hard')}
                         className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-red-400 hover:bg-red-50 rounded-lg transition-all mt-1"
                       >
                         <Trash2 size={14} />
                         <span>Hard Delete</span>
                       </button>
                    </div>
                 </div>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="relative">
                  <div className="h-16 w-16 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-md flex items-center justify-center font-bold text-xl text-slate-400 uppercase overflow-hidden">
                    {member.photo_url ? (
                      <img src={member.photo_url} alt={member.full_name} className="h-full w-full object-cover" />
                    ) : (
                      member.full_name[0]
                    )}
                  </div>
                  <div className={cn(
                    "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-4 border-white shadow-sm",
                    member.status === 'active' ? "bg-emerald-500" : "bg-slate-300"
                  )} />
                </div>

                <div className="min-w-0 pr-6">
                   <h3 className="font-bold text-slate-900 truncate leading-tight">{member.full_name}</h3>
                   <p className="text-xs font-bold text-blue-600 truncate mb-1">{member.job_title}</p>
                   <span className="inline-block px-2 py-0.5 bg-slate-100 rounded-full text-[10px] font-bold text-slate-500 tracking-widest uppercase">
                     {member.department}
                   </span>
                </div>
              </div>

              <div className="grid grid-cols-2 border-t border-slate-100 pt-5 gap-4">
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Contact</p>
                    <div className="flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors">
                       <Mail size={14} />
                       <span className="text-xs font-bold truncate">{member.email || 'N/A'}</span>
                    </div>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Role</p>
                    <div className="flex items-center gap-2 text-slate-600">
                       <Shield size={14} className="text-blue-600" />
                       <span className="text-xs font-bold uppercase tracking-tight">{member.role}</span>
                    </div>
                 </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {!isLoading && filteredMembers.length === 0 && (
        <div className="bg-white py-20 rounded-xl border border-slate-200 text-center">
           <Users size={48} className="mx-auto text-slate-200 mb-4" />
           <p className="text-lg font-bold text-slate-900">No members found</p>
           <p className="text-sm text-slate-400">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  )
}
