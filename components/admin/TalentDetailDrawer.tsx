'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  Globe, 
  Briefcase, 
  Calendar, 
  Download, 
  Zap, 
  Trash2,
  Clock,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TalentDetailDrawerProps {
  talent: any | null
  isOpen: boolean
  onClose: () => void
  onFastTrack: (talent: any) => void
  onDelete: (talent: any) => void
}

export default function TalentDetailDrawer({ talent, isOpen, onClose, onFastTrack, onDelete }: TalentDetailDrawerProps) {
  if (!talent && isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && talent && (
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
            className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-slate-900 px-8 py-10 text-white relative">
              <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <div className="flex items-center gap-6">
                 <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-xl shadow-blue-500/20">
                    {talent.first_name[0]}
                 </div>
                 <div className="space-y-1">
                    <h2 className="text-2xl font-bold uppercase tracking-tighter leading-none">{talent.first_name} {talent.last_name}</h2>
                    <p className="text-xs font-bold text-blue-400 uppercase tracking-widest">{talent.current_job_title || 'General Candidate'}</p>
                    <div className="flex items-center gap-3 pt-2 text-slate-400">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                         <Globe size={12} className="text-emerald-500" />
                         {talent.nationality}
                      </div>
                      <div className="w-1 h-1 rounded-full bg-slate-700" />
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest">
                         <Clock size={12} />
                         Registered {new Date(talent.created_at).toLocaleDateString()}
                      </div>
                    </div>
                 </div>
              </div>
            </div>

            {/* Content Body */}
            <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
               
               {/* Contact Info */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Primary Contact</h3>
                  <div className="grid grid-cols-1 gap-3">
                     <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-all">
                        <div className="p-2 bg-white rounded-lg text-blue-600 shadow-sm">
                           <Mail size={16} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Work Email</span>
                           <span className="text-sm font-bold text-slate-900">{talent.email}</span>
                        </div>
                        <ArrowRight size={14} className="ml-auto text-slate-200 opacity-0 group-hover:opacity-100 transition-all" />
                     </div>
                     <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 group hover:border-blue-200 transition-all">
                        <div className="p-2 bg-white rounded-lg text-emerald-600 shadow-sm">
                           <Phone size={16} />
                        </div>
                        <div className="flex flex-col">
                           <span className="text-[10px] font-bold text-slate-400 uppercase">Mobile Number</span>
                           <span className="text-sm font-bold text-slate-900">{talent.phone || 'N/A'}</span>
                        </div>
                        <ArrowRight size={14} className="ml-auto text-slate-200 opacity-0 group-hover:opacity-100 transition-all" />
                     </div>
                  </div>
               </section>

               {/* Profile Highlights */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Profile Highlights</h3>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                        <Briefcase size={20} className="text-blue-500 mb-2" />
                        <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Experience</p>
                        <p className="text-lg font-bold text-blue-900">{talent.years_experience || '0'} Years</p>
                     </div>
                     <div className="p-5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                        <Calendar size={20} className="text-indigo-500 mb-2" />
                        <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Current Role</p>
                        <p className="text-lg font-bold text-indigo-900 truncate">{talent.current_job_title || 'N/A'}</p>
                     </div>
                  </div>
               </section>

               {/* Interests */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Areas of Interest</h3>
                  <div className="flex flex-wrap gap-2">
                     {(talent.departments_interest || []).map((d: string) => (
                       <span key={d} className="px-4 py-2 bg-white border border-slate-200 text-[10px] font-bold text-slate-600 rounded-xl uppercase tracking-widest shadow-sm">
                          {d}
                       </span>
                     ))}
                     {(!talent.departments_interest || talent.departments_interest.length === 0) && (
                       <span className="text-xs italic text-slate-400">No specific interests listed.</span>
                     )}
                  </div>
               </section>

               {/* Documents */}
               <section className="space-y-4">
                  <h3 className="text-[10px] font-bold tracking-[0.3em] text-slate-400 uppercase">Documents</h3>
                  {talent.cv_path ? (
                    <a 
                      href={`/api/admin/download?path=${encodeURIComponent(talent.cv_path)}&bucket=application-documents`}
                      className="flex items-center gap-4 p-5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-2xl shadow-xl shadow-blue-600/20 hover:-translate-y-1 transition-all group"
                    >
                       <div className="p-3 bg-white/10 rounded-xl">
                          <Download size={24} />
                       </div>
                       <div className="flex flex-col">
                          <span className="text-xs font-bold uppercase tracking-widest">Master Curriculum Vitae</span>
                          <span className="text-[10px] font-medium text-white/60 uppercase">Click to view/download PDF</span>
                       </div>
                       <ArrowRight size={20} className="ml-auto opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </a>
                  ) : (
                    <div className="p-8 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center text-center">
                       <Download size={32} className="text-slate-100 mb-2" />
                       <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">No documentation found</p>
                    </div>
                  )}
               </section>
            </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex gap-4">
                <button 
                  onClick={() => onDelete(talent)}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-white border border-red-100 text-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-red-50"
                >
                   <Trash2 size={16} />
                   Remove
                </button>
                <button 
                  onClick={() => onFastTrack(talent)}
                  className="flex-[2] flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:bg-blue-700 shadow-xl shadow-blue-500/20"
                >
                   <Zap size={16} fill="currentColor" />
                   Fast-Track to Job
                </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
