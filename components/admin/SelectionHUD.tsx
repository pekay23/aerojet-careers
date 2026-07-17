'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Trash2, 
  Download, 
  ChevronUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SelectionHUDProps {
  selectedCount: number
  onClear: () => void
  onBatchStatus: (status: string) => void
  onBatchDelete: () => void
  onBatchExport: () => void
}

const STATUSES = ['under_review','shortlisted','interview','offer','hired','rejected']

export default function SelectionHUD({ 
  selectedCount, 
  onClear, 
  onBatchStatus, 
  onBatchDelete, 
  onBatchExport 
}: SelectionHUDProps) {
  
  const [showStatusMenu, setShowStatusMenu] = React.useState(false)

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] w-full max-w-2xl px-4"
        >
          <div className="bg-white text-slate-900 rounded-3xl shadow-sm border border-slate-100 p-4 flex items-center justify-between gap-6 overflow-visible">
             
             {/* Left: Counter */}
             <div className="flex items-center gap-4 pl-2">
                <div className="h-10 w-10 bg-blue-600 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm transition-transform active:scale-95">
                   {selectedCount}
                </div>
                <div className="hidden sm:block">
                   <p className="text-[10px] font-bold uppercase tracking-tight text-slate-900 leading-none">Selected Items</p>
                   <button 
                     onClick={onClear}
                     className="text-[9px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-widest transition-colors flex items-center gap-1 mt-1"
                   >
                      <X size={10} /> Deselect All
                   </button>
                </div>
             </div>

             {/* Right: Actions */}
             <div className="flex items-center gap-2">
                
                {/* Batch Status Move */}
                <div className="relative">
                   <button 
                     onClick={() => setShowStatusMenu(!showStatusMenu)}
                     className={cn(
                       "flex items-center gap-2 px-5 py-3 rounded-2xl text-[10px] font-bold uppercase tracking-widest transition-all",
                       showStatusMenu ? "bg-slate-900 text-white" : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                     )}
                   >
                      Update Stage
                      <ChevronUp size={14} className={cn("transition-transform", showStatusMenu && "rotate-180")} />
                   </button>

                   {/* Status Popover */}
                   <AnimatePresence>
                      {showStatusMenu && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: -10 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full right-0 mb-4 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden w-48 text-slate-900"
                        >
                           <div className="p-3 border-b border-slate-50 bg-slate-50/50">
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Select target stage</span>
                           </div>
                           <div className="p-1">
                              {STATUSES.map(s => (
                                <button
                                  key={s}
                                  onClick={() => { onBatchStatus(s); setShowStatusMenu(false); }}
                                  className="w-full text-left px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest hover:bg-blue-50 hover:text-blue-600 transition-all rounded-xl"
                                >
                                   {s.replace(/_/g, ' ')}
                                </button>
                              ))}
                           </div>
                        </motion.div>
                      )}
                   </AnimatePresence>
                </div>

                <button 
                  onClick={onBatchExport}
                  className="p-3 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                  title="Export records"
                >
                   <Download size={18} />
                </button>

                <div className="w-px h-8 bg-slate-100 mx-1" />

                <button 
                  onClick={onBatchDelete}
                  className="p-3 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-2xl transition-all"
                  title="Remove selected"
                >
                   <Trash2 size={18} />
                </button>
             </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
