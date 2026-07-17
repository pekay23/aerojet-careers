'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AddStaffModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddStaffModal({ isOpen, onClose, onSuccess }: AddStaffModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [depts, setDepts] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'employee',
    department: '',
    jobTitle: ''
  })

  React.useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/metadata')
        .then(res => res.json())
        .then(({ data }) => {
          if (data && data.departments) {
            setDepts(data.departments)
            if (data.departments.length > 0 && !formData.department) {
              setFormData(prev => ({ ...prev, department: data.departments[0].name }))
            }
          }
        })
    }
  }, [isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/admin/people/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()
      if (data.success) {
        setIsSuccess(true)
        setTimeout(() => {
          onSuccess()
          onClose()
          setIsSuccess(false)
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            role: 'employee',
            department: depts[0]?.name || '',
            jobTitle: ''
          })
        }, 2000)
      } else {
        throw new Error(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 p-8 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-600 rounded-lg">
                  <UserPlus size={24} />
                </div>
                <div>
                   <h2 className="text-2xl font-bold uppercase tracking-tight text-white">Add New Staff</h2>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Manual Staff Entry</p>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="p-8">
              {isSuccess ? (
                <div className="py-12 text-center space-y-4 font-sans">
                   <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 size={40} />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 uppercase">Staff Added Successfully</h3>
                   <p className="text-sm text-slate-500 font-bold max-w-xs mx-auto">
                     The invitation email with temporary credentials has been sent to {formData.email}.
                   </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 text-sm font-bold">
                       <AlertCircle size={18} />
                       <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">First Name</label>
                      <input 
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="e.g. Ama"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Last Name</label>
                      <input 
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                        placeholder="e.g. Mensah"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Work Email</label>
                    <input 
                      required
                      type="email"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                      placeholder="ama.mensah@aerojet-aviation.com"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Department</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none transition-all font-sans"
                        value={formData.department}
                        onChange={(e) => setFormData({...formData, department: e.target.value})}
                      >
                         {depts.length === 0 ? (
                           <option key="empty">No Departments Found</option>
                         ) : depts.map(d => (
                           <option key={d.id || d.name} value={d.name}>{d.name}</option>
                         ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">User Role</label>
                      <select 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none transition-all"
                        value={formData.role}
                        onChange={(e) => setFormData({...formData, role: e.target.value})}
                      >
                         <option value="employee">Employee</option>
                         <option value="hr_manager">HR Manager</option>
                         <option value="admin">System Admin</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 ml-1">Job Title</label>
                    <input 
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all font-sans"
                      placeholder="e.g. Senior Aircraft Technician"
                      value={formData.jobTitle}
                      onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                    />
                    <div className="flex flex-wrap gap-2 mt-2">
                       {['Director', 'Manager', 'Officer', 'Intern'].map(title => (
                         <button
                           key={title}
                           type="button"
                           onClick={() => setFormData({...formData, jobTitle: title})}
                           className={cn(
                             "px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all",
                             formData.jobTitle === title 
                               ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                               : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                           )}
                         >
                           {title}
                         </button>
                       ))}
                    </div>
                  </div>

                  <div className="pt-4 flex gap-3 font-sans">
                    <button 
                      type="button"
                      onClick={onClose}
                      className="flex-1 px-6 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={isLoading}
                      className="flex-[2] px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-xl shadow-blue-500/20 flex items-center justify-center gap-2"
                    >
                      {isLoading ? <Loader2 className="animate-spin" size={18} /> : <span>Confirm Addition</span>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
