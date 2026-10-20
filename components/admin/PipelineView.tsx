'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, 
  Clock, 
  ChevronRight, 
  Briefcase,
  Layers,
  Search
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface PipelineViewProps {
  apps: any[]
  loading: boolean
  onSelect?: (_app: any) => void
}

const STAGES = [
  { id: 'new', name: 'New Entries', color: 'slate' },
  { id: 'under_review', name: 'Assessment', color: 'indigo' },
  { id: 'shortlisted', name: 'Shortlisted', color: 'blue' },
  { id: 'interview', name: 'Interviewing', color: 'purple' },
  { id: 'offer', name: 'Final Offer', color: 'emerald' },
]

export default function PipelineView({ apps, loading }: PipelineViewProps) {
  const router = useRouter()
  const getStageApps = (stage: string) => apps.filter(a => a.status === stage)

  if (loading) {
     return (
        <div className="flex-1 flex flex-col items-center justify-center py-40 bg-slate-50/50">
           <Layers className="text-slate-200 animate-pulse mb-4" size={48} />
           <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] animate-pulse">Loading applicants&hellip;</p>
        </div>
     )
  }

  if (apps.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-40 bg-slate-50/30 space-y-4">
        <Search size={40} className="text-slate-200" />
        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">No applications found</p>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-x-auto overflow-y-hidden select-none bg-slate-50/30">
      <div className="flex gap-6 p-8 min-w-max h-full">
        {STAGES.map((stage) => {
          const stageApps = getStageApps(stage.id)
          return (
            <div key={stage.id} className="w-80 flex flex-col gap-6">
              {/* Column Header */}
              <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                   <div className={cn(
                     "w-2.5 h-2.5 rounded-full shadow-[0_0_10px_rgba(0,0,0,0.1)]",
                     stage.id === 'new' ? "bg-slate-400" :
                     stage.id === 'under_review' ? "bg-indigo-500" :
                     stage.id === 'shortlisted' ? "bg-blue-600" :
                     stage.id === 'interview' ? "bg-purple-600" : "bg-emerald-500"
                   )} />
                   <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">{stage.name}</h3>
                </div>
                <span className="px-2.5 py-1 bg-white border border-slate-100 rounded-xl text-[10px] font-bold text-slate-600 shadow-sm">
                   {stageApps.length}
                </span>
              </div>

              {/* Column Body */}
              <div className="flex-1 space-y-4 overflow-y-auto custom-scrollbar pb-10 pr-1">
                 {stageApps.length === 0 ? (
                   <div className="p-8 border-2 border-dashed border-slate-100 rounded-3xl flex flex-col items-center justify-center text-center opacity-50 grayscale">
                      <Search size={24} className="text-slate-200 mb-2" />
                      <p className="text-[9px] font-bold text-slate-500 uppercase">No entries</p>
                   </div>
                 ) : stageApps.map((a) => (
                   <motion.div
                     key={a.id}
                     layoutId={a.id}
                     onClick={() => router.push(`/admin/applications/${a.id}`)}
                     className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/40 hover:border-blue-200 transition-all cursor-pointer group relative overflow-hidden active:scale-95"
                   >
                     {/* Card Content */}
                     <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <div className="px-2 py-0.5 bg-slate-50 text-[8px] font-extrabold text-blue-500 rounded uppercase border border-slate-100">
                             {a.ref_code}
                           </div>
                           <ChevronRight size={14} className="text-slate-200 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                        </div>
                        
                        <div className="space-y-1">
                          <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors uppercase truncate">
                            {a.first_name} {a.last_name}
                          </h4>
                          <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-600 uppercase tracking-widest truncate">
                             <Briefcase size={10} className="text-slate-500" />
                             {a.job_title || 'General'}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                           <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-lg bg-slate-50 flex items-center justify-center text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                 <User size={12} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase">{a.nationality}</span>
                           </div>
                           <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase">
                              <Clock size={10} />
                              {Math.floor((new Date().getTime() - new Date(a.created_at).getTime()) / (1000 * 60 * 60 * 24))}d
                           </div>
                        </div>
                     </div>

                     {/* Progress Gradient Overlay */}
                     <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                   </motion.div>
                 ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
