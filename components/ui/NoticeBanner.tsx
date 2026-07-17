import React from 'react'

export function NoticeBanner({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-blue-50/50 border-l-4 border-blue-600 rounded-lg p-4 md:p-5 text-sm text-slate-900 leading-relaxed shadow-sm">
      <div className="flex items-start gap-3">
        {children}
      </div>
    </div>
  )
}
