'use client'
import React, { useState, useEffect } from 'react'
import { subscribeToast } from '@/lib/toast'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'

export default function ToastContainer() {
  const [toasts, setToasts] = useState<{id: number, msg: string, type: string, exiting?: boolean}[]>([])

  useEffect(() => {
    return subscribeToast((msg, options) => {
      const id = Date.now() + Math.random()
      setToasts(p => [...p, { id, msg, type: options?.type || 'info' }])
      setTimeout(() => {
        setToasts(p => p.map(t => t.id === id ? { ...t, exiting: true } : t))
        setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 200)
      }, options?.duration || 3500)
    })
  }, [])

  return (
    <div className="fixed bottom-6 right-6 z-[9999] space-y-3 pointer-events-none flex flex-col items-end">
      {toasts.map(t => (
        <div
          key={t.id}
          className={`flex items-center gap-4 px-6 py-4 bg-white rounded-2xl shadow-2xl border pointer-events-auto min-w-[300px] ${t.exiting ? 'toast-exit' : 'toast-enter'} ${t.type === 'success' ? 'border-emerald-200/50' : t.type === 'error' ? 'border-red-200/50' : 'border-blue-200/50'}`}
        >
           <div className={`flex items-center justify-center h-8 w-8 rounded-full ${t.type === 'success' ? 'bg-emerald-50 text-emerald-500' : t.type === 'error' ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'}`}>
              {t.type === 'success' && <CheckCircle2 size={18} strokeWidth={2.5} />}
              {t.type === 'error' && <XCircle size={18} strokeWidth={2.5} />}
              {t.type === 'info' && <Info size={18} strokeWidth={2.5} />}
           </div>
           <span className="text-xs font-bold text-slate-800 tracking-wider uppercase flex-1">{t.msg}</span>
           <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="text-slate-300 hover:text-slate-500 transition-colors">
             <X size={16} />
           </button>
        </div>
      ))}
    </div>
  )
}
