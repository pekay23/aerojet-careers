'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Mail, 
  Phone, 
  Globe, 
  Briefcase, 
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  History,
  ShieldCheck
} from 'lucide-react'
import { StatusPill } from '@/components/ui/StatusPill'
import { cn } from '@/lib/utils'

interface AppDetailDrawerProps {
  app: any | null
  isOpen: boolean
  onClose: () => void
  onStatusChange: (_id: string, _status: string) => void
  onDelete: (_app: any) => void
}

export default function AppDetailDrawer({ app, isOpen, onClose, onStatusChange, onDelete }: AppDetailDrawerProps) {
  const [events, setEvents] = useState<any[]>([])
  const [loadingEvents, setLoadingEvents] = useState(false)

  useEffect(() => {
    if (isOpen && app) {
      setLoadingEvents(true)
      fetch(`/api/admin/applications/events?id=${app.id}`)
        .then(r => r.json())
        .then(({ data }) => setEvents(data || []))
        .finally(() => setLoadingEvents(false))
    }
  }, [isOpen, app])

  if (!app && isOpen) return null

  const STAGES = ['new','under_review','shortlisted','interview','offer','hired']

  return (
    <AnimatePresence>
      {isOpen && app && (
        <div className="fixed inset-0 z-[150] flex justify-end">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          
          {/* Drawer Content */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden rounded-l-[2rem]"
          >
            {/* Header */}
            <div className="bg-white border-b border-slate-100 px-8 py-10 text-slate-900 relative">
<button 
  onClick={onClose}
  className="absolute top-6 right-6 p-2 text-slate-500 hover:text-slate-900 transition-colors"
>
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-6">
                 <div className="h-20 w-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl font-bold text-slate-500 shadow-sm">
                    {app.first_name[0]}
                 </div>
                 <div className="space-y-2">
                     <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold uppercase tracking-tighter leading-none">{app.first_name} {app.last_name}</h2>
                        <StatusPill status={app.status} />
                     </div>
                     <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{app.job_title || 'General Application'}</p>
                     <div className="flex items-center gap-3 text-slate-500">
                       <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                          <Globe size={12} className="text-emerald-500" />
                          {app.nationality}
                       </div>
                       <div className="w-1 h-1 rounded-full bg-slate-200" />
                       <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                          <ShieldCheck size={12} className="text-blue-500" />
                          Ref: {app.ref_code}
                       </div>
                     </div>
                 </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar">
               
               {/* Quick Progress Bar */}
                <section className="space-y-4">
                   <h3 className="text-[9px] font-bold tracking-[0.3em] text-slate-600 uppercase">Process Status</h3>
                  <div className="flex items-center justify-between gap-1">
                     {STAGES.map((s, i) => {
                       const activeIndex = STAGES.indexOf(app.status)
                       const isPast = i < activeIndex
                       const isCurrent = i === activeIndex
                       return (
                         <div key={s} className="flex-1 flex flex-col items-center gap-2">
                            <div className={cn(
                              "h-1.5 w-full rounded-full transition-all duration-500",
                              isPast ? "bg-emerald-500" : isCurrent ? "bg-blue-600 animate-pulse" : "bg-slate-100"
                            )} />
                            <span className={cn(
                              "text-[8px] font-bold uppercase tracking-tighter",
                              isCurrent ? "text-blue-600" : isPast ? "text-emerald-500" : "text-slate-500"
                            )}>{s}</span>
                         </div>
                       )
                     })}
                  </div>
               </section>

               {/* Process Timeline */}
                <section className="space-y-6">
                   <div className="flex items-center justify-between">
                     <h3 className="text-[9px] font-bold tracking-[0.3em] text-slate-600 uppercase flex items-center gap-2">
                       <History size={14} /> Activity History
                     </h3>
                   </div>
                  
                  <div className="relative space-y-8 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-slate-100 before:via-slate-200 before:to-slate-100">
                    {loadingEvents ? (
                      <div className="pl-12 py-4 flex items-center gap-3 text-xs font-bold text-slate-600 uppercase animate-pulse">
                       <Clock size={16} className="animate-spin" /> Loading activity history…
                      </div>
                    ) : events.length === 0 ? (
                       <div className="pl-12 py-4 text-xs font-bold text-slate-500 uppercase italic">No activity recorded yet.</div>
                    ) : events.map((ev, i) => (
                      <div key={ev.id} className="relative pl-12 group">
                        <div className={cn(
                          "absolute left-4 -translate-x-1/2 flex items-center justify-center p-1.5 rounded-full border-4 border-white shadow-sm z-10 transition-transform group-hover:scale-110",
                          i === 0 ? "bg-blue-600 text-white" : "bg-white text-slate-500 border-slate-100"
                        )}>
                          {ev.event_type === 'status_change' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">
                            {ev.note}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-600 uppercase">
                            <span className="text-slate-500">{new Date(ev.created_at).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                            {ev.admin && (
                              <>
                                <span>•</span>
                                <span className="text-blue-500 font-extrabold">{ev.admin.email.split('@')[0]}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

               {/* Profile Fragments */}
                <section className="space-y-6">
                   <h3 className="text-[9px] font-bold tracking-[0.3em] text-slate-600 uppercase">Profile Summary</h3>
                  <div className="grid grid-cols-2 gap-6">
                     <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-200 transition-all">
                        <Briefcase size={20} className="text-blue-500 mb-2" />
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Experience</p>
                        <p className="text-sm font-bold text-slate-900">{app.experience?.total_years_exp || '0'} Years Total</p>
                     </div>
                     <div className="p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-200 transition-all">
                        <ShieldCheck size={20} className="text-emerald-500 mb-2" />
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Qualification</p>
                        <p className="text-sm font-bold text-slate-900 truncate">{app.qualifications?.licence_type || 'General'}</p>
                     </div>
                  </div>
               </section>

               {/* Contact Block */}
                <section className="space-y-4">
                   <h3 className="text-[9px] font-bold tracking-[0.3em] text-slate-600 uppercase">Contact Details</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                       <Mail size={16} className="text-blue-500" />
                       <span className="text-xs font-bold text-slate-900">{app.email}</span>
                    </div>
                    <div className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                       <Phone size={16} className="text-emerald-500" />
                       <span className="text-xs font-bold text-slate-900">{app.phone || 'N/A'}</span>
                    </div>
                  </div>
               </section>
            </div>

            {/* Footer Actions */}
            <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex flex-col gap-6">
                
                {/* Advanced Stage Toggle */}
                 <div className="space-y-3">
                    <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em] ml-1">Update Stage</p>
                   <div className="flex flex-wrap gap-2">
                      {['under_review', 'shortlisted', 'interview', 'offer', 'hired', 'rejected'].map(s => (
                        <button
                          key={s}
                          onClick={() => onStatusChange(app.id, s)}
                          className={cn(
                            "px-4 py-2 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all border",
                            app.status === s 
                              ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20" 
                              : "bg-white text-slate-600 border-slate-200 hover:border-blue-400 hover:text-blue-600"
                          )}
                        >
                           {s.replace(/_/g, ' ')}
                        </button>
                      ))}
                   </div>
                </div>

                <div className="flex gap-4">
                   <button 
                     onClick={() => onDelete(app)}
                     className="flex-1 flex items-center justify-center gap-2 px-6 py-5 bg-white border border-slate-100 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all"
                   >
                      <Trash2 size={18} />
                      Remove Record
                   </button>
                  {app.cv_path && (
                    <a 
                      href={`/api/admin/download?path=${encodeURIComponent(app.cv_path)}&bucket=application-documents`}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-5 bg-slate-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-black shadow-xl shadow-black/5"
                    >
                       <FileText size={18} />
                       Review CV
                    </a>
                  )}
                </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
