'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Loader2, Briefcase, ChevronRight, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FastTrackModalProps {
  talent: any | null
  isOpen: boolean
  onClose: () => void
  onSuccess: (refCode: string) => void
}

export default function FastTrackModal({ talent, isOpen, onClose, onSuccess }: FastTrackModalProps) {
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedJob, setSelectedJob] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      fetch('/api/admin/jobs?status=open')
        .then(res => res.json())
        .then(({ data }) => {
          setJobs(data?.data || data || [])
          setLoading(false)
        })
        .catch(() => {
          setJobs([])
          setLoading(false)
        })
    }
  }, [isOpen])

  const handleAssign = async () => {
    if (!selectedJob || !talent) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/talent/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ talentId: talent.id, jobId: selectedJob })
      })
      const { data, error } = await res.json()
      if (error) throw new Error(error)
      
      setSuccess(data.refCode)
      setTimeout(() => {
        onSuccess(data.refCode)
        onClose()
        setSuccess(null)
        setSelectedJob(null)
      }, 2500)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden font-sans"
          >
            {/* Header */}
            <div className="bg-blue-600 p-8 text-white">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-blue-200 hover:text-white transition-colors"
                disabled={submitting || !!success}
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-white/10 rounded-xl">
                    <Zap size={24} fill="currentColor" />
                 </div>
                 <div className="space-y-1">
                    <h2 className="text-xl font-bold uppercase tracking-tight">Fast-Track Assignment</h2>
                    <p className="text-[10px] font-bold text-blue-100 uppercase tracking-[0.2em]">Converting Talent to Active Pipeline</p>
                 </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8">
              {success ? (
                <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in-95">
                   <div className="h-20 w-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-white shadow-xl">
                      <CheckCircle2 size={40} />
                   </div>
                   <h3 className="text-xl font-bold text-slate-900 uppercase">Assignment Successful</h3>
                   <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                     Reference Code: <span className="text-blue-600">{success}</span>
                   </p>
                </div>
              ) : (
                <div className="space-y-6">
                   <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center gap-4">
                     <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg">
                        {talent?.first_name[0]}
                     </div>
                     <div>
                        <p className="text-sm font-bold text-slate-900">{talent?.first_name} {talent?.last_name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{talent?.email}</p>
                     </div>
                   </div>

                   <div className="space-y-3">
                      <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase ml-1">Select Target Vacancy ({jobs.length})</label>
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                         {loading ? (
                           <div className="py-12 flex justify-center">
                              <Loader2 className="animate-spin text-blue-600" size={24} />
                           </div>
                         ) : jobs.length === 0 ? (
                           <div className="py-12 text-center text-xs font-bold text-slate-400 uppercase">No active job openings found.</div>
                         ) : jobs.map(job => (
                           <button 
                             key={job.id}
                             onClick={() => setSelectedJob(job.id)}
                             className={cn(
                               "w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left group",
                               selectedJob === job.id 
                                 ? "bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]" 
                                 : "bg-white border-slate-100 text-slate-600 hover:border-blue-400 hover:bg-blue-50/50"
                             )}
                           >
                              <div className="flex items-center gap-3">
                                 <Briefcase size={16} className={cn(selectedJob === job.id ? "text-blue-200" : "text-blue-400")} />
                                 <div className="flex flex-col">
                                    <span className="text-xs font-bold uppercase tracking-tight">{job.title}</span>
                                    <span className={cn("text-[9px] font-bold uppercase tracking-widest", selectedJob === job.id ? "text-blue-200" : "text-slate-400")}>{job.ref_code} • {job.department}</span>
                                 </div>
                              </div>
                              <ChevronRight size={14} className={cn("transition-transform", selectedJob === job.id ? "rotate-90 text-white" : "text-slate-300")} />
                           </button>
                         ))}
                      </div>
                   </div>

                   <button 
                     onClick={handleAssign}
                     disabled={!selectedJob || submitting}
                     className="w-full flex items-center justify-center gap-3 py-5 bg-slate-900 hover:bg-black text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all disabled:opacity-50 shadow-xl"
                   >
                      {submitting ? <Loader2 className="animate-spin" size={20} /> : <Zap size={18} fill="currentColor" />}
                      Confirm Final Assignment
                   </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
