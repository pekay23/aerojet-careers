import React from 'react'

interface FormCardProps {
  title: string
  subtitle?: string
  children: React.ReactNode
}

export function FormCard({ title, subtitle, children }: FormCardProps) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-xl shadow-slate-200/50 p-8 md:p-10 relative overflow-hidden mb-6 group transition-all hover:border-blue-200">
      {/* Accent Bar */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-600 opacity-80" />
      
      <div className="space-y-1 mb-8">
        <h3 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight uppercase leading-tight">
          {title}
        </h3>
        {subtitle && (
          <p className="text-xs md:text-sm font-medium text-slate-400 uppercase tracking-widest">
            {subtitle}
          </p>
        )}
      </div>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
